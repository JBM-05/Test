import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const fontDirectory = path.resolve(
  scriptDirectory,
  '..',
  'public',
  'assets',
  'fonts',
)
const fontStylesheetPath = path.join(fontDirectory, 'fonts.css')
const indexPath = path.resolve(scriptDirectory, '..', 'index.html')
const requiredFonts = [
  'gilroy-regular.woff2',
  'gilroy-medium.woff2',
  'gilroy-semibold.woff2',
  'gilroy-bold.woff2',
  'gilroy-regular-italic.woff2',
  'tt-norms-pro-bold.woff2',
]

const invalidFonts = []

function validateWoff2(bytes) {
  const minimumHeaderLength = 48
  if (bytes.length < minimumHeaderLength) return 'truncated WOFF2 header'
  if (bytes.subarray(0, 4).toString('ascii') !== 'wOF2') {
    return 'not a WOFF2 file'
  }

  const declaredLength = bytes.readUInt32BE(8)
  const tableCount = bytes.readUInt16BE(12)
  const reserved = bytes.readUInt16BE(14)
  const decompressedSize = bytes.readUInt32BE(16)
  const compressedSize = bytes.readUInt32BE(20)

  if (declaredLength !== bytes.length) return 'invalid declared file length'
  if (tableCount === 0 || tableCount > 63) return 'invalid font table count'
  if (reserved !== 0) return 'invalid reserved header field'
  if (decompressedSize === 0) return 'invalid decompressed font size'
  if (compressedSize === 0 || compressedSize > bytes.length - minimumHeaderLength) {
    return 'invalid compressed font size'
  }

  return null
}

for (const filename of requiredFonts) {
  try {
    const bytes = await readFile(path.join(fontDirectory, filename))
    const validationFailure = validateWoff2(bytes)
    if (validationFailure) invalidFonts.push(`${filename} (${validationFailure})`)
  } catch (error) {
    const missing =
      error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT'
    invalidFonts.push(`${filename} (${missing ? 'missing' : 'could not be read'})`)
  }
}

try {
  const [fontStylesheet, indexHtml] = await Promise.all([
    readFile(fontStylesheetPath, 'utf8'),
    readFile(indexPath, 'utf8'),
  ])

  for (const filename of requiredFonts) {
    if (!fontStylesheet.includes(`url("./${filename}")`)) {
      invalidFonts.push(`${filename} (not referenced by fonts.css)`)
    }
  }

  if (!indexHtml.includes('href="/assets/fonts/fonts.css"')) {
    invalidFonts.push('fonts.css (not linked from index.html)')
  }
} catch {
  invalidFonts.push('font stylesheet wiring could not be verified')
}

if (invalidFonts.length > 0) {
  console.error('Licensed Figma fonts are not ready:')
  for (const font of invalidFonts) console.error(`- ${font}`)
  process.exitCode = 1
} else {
  console.log('All licensed Figma fonts are present and valid WOFF2 files.')
}
