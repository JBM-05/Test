import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { PNG } from 'pngjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const publicDirectory = path.join(projectRoot, 'public')

const catalogPath = path.join(
  projectRoot,
  'src',
  'features',
  'bundle-builder',
  'data',
  'bundle-catalog.json',
)
const componentAssetsPath = path.join(
  projectRoot,
  'src',
  'features',
  'bundle-builder',
  'components',
  'assets.ts',
)

const isPublicAssetPath = (value) =>
  typeof value === 'string' && value.startsWith('/assets/')

function collectCatalogAssetPaths(value, assetPaths, expectedDimensions) {
  if (isPublicAssetPath(value)) {
    assetPaths.add(value)
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectCatalogAssetPaths(item, assetPaths, expectedDimensions)
    }
    return
  }

  if (value && typeof value === 'object') {
    if (
      isPublicAssetPath(value.src) &&
      Number.isInteger(value.width) &&
      Number.isInteger(value.height)
    ) {
      expectedDimensions.set(value.src, {
        width: value.width,
        height: value.height,
      })
    }

    for (const nestedValue of Object.values(value)) {
      collectCatalogAssetPaths(nestedValue, assetPaths, expectedDimensions)
    }
  }
}

function collectComponentAssetPaths(source, assetPaths) {
  const constants = new Map()
  const constantPattern = /const\s+([A-Z][A-Z0-9_]*)\s*=\s*['"](\/assets\/[^'"]+)['"]/g

  for (const match of source.matchAll(constantPattern)) {
    constants.set(match[1], match[2])
  }

  const literalPattern = /['"](\/assets\/[^'"]+\.[a-z0-9]+)['"]/gi
  for (const match of source.matchAll(literalPattern)) {
    assetPaths.add(match[1])
  }

  const templatePattern = /`\$\{([A-Z][A-Z0-9_]*)\}(\/[^`$]+)`/g
  for (const match of source.matchAll(templatePattern)) {
    const root = constants.get(match[1])
    if (!root) {
      throw new Error(`Unknown asset root \${${match[1]}} in ${componentAssetsPath}`)
    }

    const assetPath = `${root}${match[2]}`
    if (isPublicAssetPath(assetPath)) {
      assetPaths.add(assetPath)
    }
  }
}

function readJpegDimensions(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null

  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ])
  let offset = 2

  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }

    const marker = bytes[offset + 1]
    if (startOfFrameMarkers.has(marker)) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      }
    }

    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2
      continue
    }

    const segmentLength = bytes.readUInt16BE(offset + 2)
    if (segmentLength < 2) return null
    offset += segmentLength + 2
  }

  return null
}

function inspectAssetBytes(assetPath, bytes) {
  const extension = path.extname(assetPath).toLowerCase()

  if (extension === '.png') {
    const decoded = PNG.sync.read(bytes)
    return { width: decoded.width, height: decoded.height }
  }

  if (extension === '.jpg' || extension === '.jpeg') {
    const dimensions = readJpegDimensions(bytes)
    if (!dimensions || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) {
      throw new Error('invalid JPEG data')
    }
    return dimensions
  }

  if (extension === '.svg') {
    if (!bytes.subarray(0, 4096).toString('utf8').includes('<svg')) {
      throw new Error('invalid SVG data')
    }
    return null
  }

  if (extension === '.webp') {
    const isWebp =
      bytes.length >= 12 &&
      bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
      bytes.subarray(8, 12).toString('ascii') === 'WEBP'
    if (!isWebp) throw new Error('invalid WebP data')
    return null
  }

  throw new Error(`unsupported asset type ${extension || '(none)'}`)
}

async function verifyAsset(assetPath, expectedDimensions) {
  const relativeAssetPath = assetPath.slice(1).split('/').join(path.sep)
  const resolvedPath = path.resolve(publicDirectory, relativeAssetPath)
  const expectedRoot = `${path.resolve(publicDirectory)}${path.sep}`

  if (!resolvedPath.startsWith(expectedRoot)) {
    throw new Error(`Asset path escapes the public directory: ${assetPath}`)
  }

  try {
    const file = await stat(resolvedPath)
    if (!file.isFile() || file.size === 0) {
      return `${assetPath} is not a non-empty file`
    }

    const bytes = await readFile(resolvedPath)
    const actualDimensions = inspectAssetBytes(assetPath, bytes)
    const expected = expectedDimensions.get(assetPath)
    if (
      expected &&
      actualDimensions &&
      (actualDimensions.width !== expected.width ||
        actualDimensions.height !== expected.height)
    ) {
      return `${assetPath} is ${actualDimensions.width}x${actualDimensions.height}; expected ${expected.width}x${expected.height}`
    }
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return `${assetPath} is missing`
    }
    const reason = error instanceof Error ? error.message : String(error)
    return `${assetPath} could not be validated: ${reason}`
  }

  return null
}

const [catalogSource, componentAssetsSource] = await Promise.all([
  readFile(catalogPath, 'utf8'),
  readFile(componentAssetsPath, 'utf8'),
])

const assetPaths = new Set()
const expectedDimensions = new Map()
collectCatalogAssetPaths(
  JSON.parse(catalogSource),
  assetPaths,
  expectedDimensions,
)
collectComponentAssetPaths(componentAssetsSource, assetPaths)

const sortedAssetPaths = [...assetPaths].sort()
const verificationResults = await Promise.all(
  sortedAssetPaths.map((assetPath) => verifyAsset(assetPath, expectedDimensions)),
)
const failures = verificationResults.filter(Boolean)

if (failures.length > 0) {
  console.error('Design asset verification failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exitCode = 1
} else {
  console.log(`Verified ${sortedAssetPaths.length} referenced design assets.`)
}
