import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const referenceDirectory = path.resolve(
  scriptDirectory,
  '..',
  'e2e',
  'figma-reference',
)
const manifestPath = path.join(referenceDirectory, 'manifest.json')
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
if (manifest.version !== 1 || !Array.isArray(manifest.references)) {
  throw new Error(`Unsupported Figma reference manifest: ${manifestPath}`)
}

const failures = []

for (const reference of manifest.references) {
  const { filename, width, height, sha256 } = reference
  const referencePath = path.resolve(referenceDirectory, filename)
  const expectedRoot = `${referenceDirectory}${path.sep}`

  if (!referencePath.startsWith(expectedRoot)) {
    failures.push(`${filename}: path escapes the reference directory`)
    continue
  }

  try {
    const bytes = await readFile(referencePath)
    if (bytes.length < 24 || !bytes.subarray(0, 8).equals(pngSignature)) {
      failures.push(`${filename}: not a valid PNG header`)
      continue
    }

    const actualWidth = bytes.readUInt32BE(16)
    const actualHeight = bytes.readUInt32BE(20)
    if (actualWidth !== width || actualHeight !== height) {
      failures.push(
        `${filename}: expected ${width}x${height}, received ${actualWidth}x${actualHeight}`,
      )
    }

    const actualHash = createHash('sha256').update(bytes).digest('hex')
    if (actualHash !== sha256) {
      failures.push(`${filename}: SHA-256 does not match the immutable export`)
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    failures.push(`${filename}: ${reason}`)
  }
}

if (failures.length > 0) {
  console.error('Figma reference verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exitCode = 1
} else {
  console.log(`Verified ${manifest.references.length} immutable Figma references.`)
}
