import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { expect, test } from '@playwright/test'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

interface IgnoreRectangle {
  x: number
  y: number
  width: number
  height: number
}

interface VisualTarget {
  reference: string
  viewport: { width: number; height: number }
  ignoredContent: readonly IgnoreRectangle[]
}

const TARGETS: Readonly<Record<string, VisualTarget>> = {
  'figma-desktop': {
    reference: 'desktop-1440x1077.png',
    viewport: { width: 1440, height: 1077 },
    ignoredContent: [
      { x: 529, y: 156, width: 52, height: 15 },
      { x: 795, y: 252, width: 76, height: 42 },
    ],
  },
  'figma-mobile': {
    reference: 'mobile-390x1252.png',
    viewport: { width: 390, height: 1252 },
    ignoredContent: [],
  },
}

function ignoreApprovedContent(
  actual: PNG,
  expected: PNG,
  rectangles: readonly IgnoreRectangle[],
) {
  for (const rectangle of rectangles) {
    for (let y = rectangle.y; y < rectangle.y + rectangle.height; y += 1) {
      for (let x = rectangle.x; x < rectangle.x + rectangle.width; x += 1) {
        const offset = (y * expected.width + x) * 4
        expected.data.copy(actual.data, offset, offset, offset + 4)
      }
    }
  }
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/')
  await expect(page.getByTestId('bundle-builder')).toBeVisible()
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(Array.from(document.images, (image) => image.decode()))
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
  })

  const failedImages = await page.locator('img').evaluateAll((elements) =>
    elements
      .map((element) => element as HTMLImageElement)
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src),
  )
  expect(failedImages, 'Every rendered image must decode successfully').toEqual([])
})

test('matches the immutable Figma reference', async ({ page }, testInfo) => {
  const target = TARGETS[testInfo.project.name]
  expect(target, `Missing visual target for ${testInfo.project.name}`).toBeDefined()

  if (testInfo.project.name === 'figma-mobile') {
    const camerasStep = page.getByRole('button', {
      name: 'Step 1: Choose your cameras',
      exact: true,
    })
    await camerasStep.click()
    await expect(camerasStep).toHaveAttribute('aria-expanded', 'false')
  }

  await page.evaluate(() => window.scrollTo(0, 0))
  expect(page.viewportSize()).toEqual(target.viewport)

  const documentSize = await page.evaluate(() => ({
    clientHeight: document.documentElement.clientHeight,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(documentSize.scrollWidth).toBe(documentSize.clientWidth)
  expect(documentSize.scrollHeight).toBe(documentSize.clientHeight)

  if (testInfo.project.name === 'figma-mobile') {
    const stepHeights = await page
      .locator('section[aria-label="Build your system"] > section')
      .evaluateAll((steps) => steps.map((step) => step.getBoundingClientRect().height))
    expect(stepHeights).toEqual([75, 85, 80, 80])
    await expect(page.getByTestId('review-panel')).toHaveCSS('width', '390px')
  }

  const actualBuffer = await page.screenshot({
    animations: 'disabled',
    caret: 'hide',
    fullPage: true,
    scale: 'css',
  })
  const referencePath = path.resolve('e2e', 'figma-reference', target.reference)
  const expectedBuffer = await readFile(referencePath)
  const actual = PNG.sync.read(actualBuffer)
  const expected = PNG.sync.read(expectedBuffer)

  expect({ width: actual.width, height: actual.height }).toEqual({
    width: expected.width,
    height: expected.height,
  })

  const comparableActual = PNG.sync.read(actualBuffer)
  ignoreApprovedContent(comparableActual, expected, target.ignoredContent)

  const diff = new PNG({ width: expected.width, height: expected.height })
  const mismatchedPixels = pixelmatch(
    expected.data,
    comparableActual.data,
    diff.data,
    expected.width,
    expected.height,
    {
      includeAA: false,
      threshold: 0.1,
    },
  )

  const actualPath = testInfo.outputPath('browser-actual.png')
  const diffPath = testInfo.outputPath('figma-diff.png')
  await writeFile(actualPath, actualBuffer)
  await writeFile(diffPath, PNG.sync.write(diff))
  await testInfo.attach('figma-reference', {
    path: referencePath,
    contentType: 'image/png',
  })
  await testInfo.attach('browser-actual', {
    path: actualPath,
    contentType: 'image/png',
  })
  await testInfo.attach('figma-diff', {
    path: diffPath,
    contentType: 'image/png',
  })

  expect(
    mismatchedPixels,
    `${mismatchedPixels} non-antialiasing pixels differ from ${target.reference}`,
  ).toBe(0)
})
