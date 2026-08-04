import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const storageKey = 'wyze-bundle-builder:v1'

function behaviorBaseUrl() {
  const url = process.env.BEHAVIOR_BASE_URL
  if (!url) throw new Error('Behavior test server URL was not initialized')
  return url
}

function getStep(page: Page, number: number, title: string) {
  return page.getByRole('button', {
    name: `Step ${number}: ${title}`,
    exact: true,
  })
}

function getProductCard(page: Page, name: string) {
  return page.getByRole('article', { name, exact: true })
}

async function openApp(page: Page) {
  await page.goto(behaviorBaseUrl())
  await expect(page.getByTestId('bundle-builder')).toBeVisible()
}

async function openStableVisualApp(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(behaviorBaseUrl())
  await expect(page.getByTestId('bundle-builder')).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(
      Array.from(document.images, (image) => image.decode().catch(() => undefined)),
    )
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
  })
}

test.describe('bundle builder', () => {
  test('supports the core configure-and-review flow', async ({ page }) => {
    await openApp(page)

    await expect(
      page.getByRole('heading', { name: 'Your security system' }),
    ).toBeVisible()

    const camerasStep = getStep(page, 1, 'Choose your cameras')
    const planStep = getStep(page, 2, 'Choose your plan')

    await expect(camerasStep).toHaveAttribute('aria-expanded', 'true')
    await expect(planStep).toHaveAttribute('aria-expanded', 'false')

    const total = page.getByTestId('bundle-total')
    await expect(total).toContainText('$187.89')

    const camPanCard = page.getByRole('article', {
      name: 'Wyze Cam Pan v3',
    })
    await expect(camPanCard.getByText('Save 12%')).toBeVisible()
    await expect(camPanCard.getByText('$39.98')).toBeVisible()
    await expect(camPanCard.getByText('$34.98')).toBeVisible()

    const seededCamPanReviewLine = page.getByRole('article', {
      name: 'Wyze Cam Pan v3, White',
    })
    await expect(seededCamPanReviewLine.getByText('$57.98')).toBeVisible()
    await expect(seededCamPanReviewLine.getByText('$47.98')).toBeVisible()

    const card = getProductCard(page, 'Wyze Cam Floodlight v2')
    await card.getByText('Black', { exact: true }).click()
    await card
      .getByRole('button', {
        name: /Increase Wyze Cam Floodlight v2.*Black/i,
      })
      .click()

    await expect(page.getByTestId('quantity-floodlight-v2-black')).toHaveText(
      '1',
    )

    const review = page.getByTestId('review-panel')
    const reviewLine = review.getByRole('article', {
      name: /Wyze Cam Floodlight v2.*Black/i,
    })
    await expect(reviewLine).toBeVisible()
    await expect(total).not.toContainText('$187.89')

    await reviewLine
      .getByRole('button', {
        name: /Decrease Wyze Cam Floodlight v2.*Black/i,
      })
      .click()

    await expect(reviewLine).toHaveCount(0)
    await expect(page.getByTestId('quantity-floodlight-v2-black')).toHaveText(
      '0',
    )
    await expect(total).toContainText('$187.89')

    await page
      .getByRole('button', { name: 'Next: Choose your plan', exact: true })
      .click()
    await expect(camerasStep).toHaveAttribute('aria-expanded', 'false')
    await expect(planStep).toHaveAttribute('aria-expanded', 'true')
    await expect(planStep).toBeFocused()
  })

  test('persists only after Save my system for later is activated', async ({
    page,
  }) => {
    await openApp(page)

    let card = getProductCard(page, 'Wyze Cam v4')
    await card.getByText('Grey', { exact: true }).click()
    await card
      .getByRole('button', { name: /Increase Wyze Cam v4.*Grey/i })
      .click()

    const greyReviewLine = () =>
      page.getByTestId('review-panel').getByRole('article', {
        name: /Wyze Cam v4.*Grey/i,
      })

    await expect(greyReviewLine()).toBeVisible()

    // Unsaved edits intentionally do not survive a reload.
    await page.reload()
    await expect(page.getByTestId('bundle-builder')).toBeVisible()
    await expect(greyReviewLine()).toHaveCount(0)

    card = getProductCard(page, 'Wyze Cam v4')
    await card.getByText('Grey', { exact: true }).click()
    const increaseGrey = card.getByRole('button', {
      name: /Increase Wyze Cam v4.*Grey/i,
    })
    await increaseGrey.click()
    await increaseGrey.click()

    const sensorsStep = getStep(page, 3, 'Choose your sensors')
    await sensorsStep.click()
    await expect(sensorsStep).toHaveAttribute('aria-expanded', 'true')

    await page
      .getByRole('button', { name: 'Save my system for later', exact: true })
      .click()
    await expect(page.getByTestId('save-status')).toContainText(/saved/i)

    const savedValue = await page.evaluate(
      (key) => localStorage.getItem(key),
      storageKey,
    )
    expect(savedValue).not.toBeNull()

    await page.reload()
    await expect(page.getByTestId('bundle-builder')).toBeVisible()
    await expect(sensorsStep).toHaveAttribute('aria-expanded', 'true')
    await expect(greyReviewLine()).toBeVisible()

    await getStep(page, 1, 'Choose your cameras').click()
    await expect(page.getByTestId('quantity-cam-v4-grey')).toHaveText('2')
  })

  test('has a keyboard-dismissable checkout dialog', async ({ page }) => {
    await openApp(page)

    const checkout = page.getByRole('button', { name: 'Checkout', exact: true })
    await checkout.click()

    const dialog = page.getByRole('dialog', { name: 'Ready to check out?' })
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(checkout).toBeFocused()
  })

  test('stays within the viewport and keeps phone controls touch-friendly', async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openApp(page)

    const dimensions = await page.evaluate<{
      clientWidth: number
      scrollWidth: number
    }>(`({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    })`)
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)

    const viewportWidth = testInfo.project.use.viewport?.width
    if (viewportWidth === 1440) {
      const cardControls = [
        ['cam-v4', 'quantity-cam-v4-white'],
        ['cam-pan-v3', 'quantity-cam-pan-v3-white'],
        ['floodlight-v2', 'quantity-floodlight-v2-white'],
        ['duo-cam-doorbell', 'quantity-duo-cam-doorbell'],
        ['battery-cam-pro', 'quantity-battery-cam-pro-white'],
      ] as const

      for (const [productId, quantityTestId] of cardControls) {
        const card = page.locator(`[data-product-id="${productId}"]`)
        const quantity = card.getByTestId(quantityTestId)
        const cardBox = await card.boundingBox()
        const controlSurfaces = await quantity
          .locator('xpath=..')
          .locator('[data-control-surface="default"]')
          .all()

        expect(cardBox).not.toBeNull()
        expect(controlSurfaces).toHaveLength(2)
        for (const surface of controlSurfaces) {
          const surfaceBox = await surface.boundingBox()
          expect(surfaceBox).not.toBeNull()
          expect(
            (surfaceBox?.y ?? 0) + (surfaceBox?.height ?? 0),
          ).toBeLessThanOrEqual((cardBox?.y ?? 0) + (cardBox?.height ?? 0))
        }
      }

      for (const [firstProductId, secondProductId] of [
        ['cam-v4', 'cam-pan-v3'],
        ['floodlight-v2', 'duo-cam-doorbell'],
      ] as const) {
        const [firstCardBox, secondCardBox] = await Promise.all([
          page.locator(`[data-product-id="${firstProductId}"]`).boundingBox(),
          page.locator(`[data-product-id="${secondProductId}"]`).boundingBox(),
        ])

        expect(firstCardBox).not.toBeNull()
        expect(secondCardBox).not.toBeNull()
        expect(firstCardBox?.y).toBeCloseTo(secondCardBox?.y ?? 0, 3)
        expect(firstCardBox?.height).toBeCloseTo(secondCardBox?.height ?? 0, 3)
      }

      const duoCard = page.locator('[data-product-id="duo-cam-doorbell"]')
      await expect(
        page.getByTestId('variant-selector-duo-cam-doorbell'),
      ).toHaveCount(0)
      await expect(
        page.getByTestId('variant-selector-spacer-duo-cam-doorbell'),
      ).toHaveCount(0)

      const [duoCardBox, duoContentBox, duoDescriptionBox, duoQuantityBox] =
        await Promise.all([
          duoCard.boundingBox(),
          duoCard
            .getByTestId('product-content-duo-cam-doorbell')
            .boundingBox(),
          duoCard
            .getByTestId('product-description-duo-cam-doorbell')
            .boundingBox(),
          duoCard
            .getByTestId('quantity-duo-cam-doorbell')
            .locator('xpath=..')
            .boundingBox(),
        ])

      expect(duoCardBox).not.toBeNull()
      expect(duoContentBox).not.toBeNull()
      expect(duoDescriptionBox).not.toBeNull()
      expect(duoQuantityBox).not.toBeNull()

      const descriptionToQuantityGap =
        (duoQuantityBox?.y ?? 0) -
        ((duoDescriptionBox?.y ?? 0) + (duoDescriptionBox?.height ?? 0))
      expect(descriptionToQuantityGap).toBeGreaterThanOrEqual(9)
      expect(descriptionToQuantityGap).toBeLessThanOrEqual(11)

      const cardCenter =
        (duoCardBox?.y ?? 0) + (duoCardBox?.height ?? 0) / 2
      const contentCenter =
        (duoContentBox?.y ?? 0) + (duoContentBox?.height ?? 0) / 2
      expect(contentCenter).toBeCloseTo(cardCenter, 1)
    }

    if (viewportWidth === 1024) {
      const productIds = [
        'cam-v4',
        'cam-pan-v3',
        'floodlight-v2',
        'duo-cam-doorbell',
        'battery-cam-pro',
      ] as const
      const productGrid = page.getByTestId('product-grid-cameras')
      const gridBox = await productGrid.boundingBox()
      const cardBoxes = await Promise.all(
        productIds.map((productId) =>
          page.locator(`[data-product-id="${productId}"]`).boundingBox(),
        ),
      )

      expect(gridBox).not.toBeNull()
      expect(cardBoxes.every((box) => box !== null)).toBe(true)

      const firstCardBox = cardBoxes[0]
      for (const cardBox of cardBoxes) {
        expect(cardBox?.y).toBeCloseTo(firstCardBox?.y ?? 0, 1)
        expect(cardBox?.height).toBeCloseTo(firstCardBox?.height ?? 0, 1)
        expect(
          (cardBox?.y ?? 0) + (cardBox?.height ?? 0),
        ).toBeCloseTo(
          (firstCardBox?.y ?? 0) + (firstCardBox?.height ?? 0),
          1,
        )
        expect(cardBox?.x ?? 0).toBeGreaterThanOrEqual(gridBox?.x ?? 0)
        expect(
          (cardBox?.x ?? 0) + (cardBox?.width ?? 0),
        ).toBeLessThanOrEqual(
          (gridBox?.x ?? 0) + (gridBox?.width ?? 0),
        )
      }

      const duoCard = page.locator('[data-product-id="duo-cam-doorbell"]')
      await expect(
        page.getByTestId('variant-selector-duo-cam-doorbell'),
      ).toHaveCount(0)
      await expect(
        page.getByTestId('variant-selector-spacer-duo-cam-doorbell'),
      ).toHaveCount(0)

      const [
        duoContentBox,
        duoTitleBox,
        duoDescriptionBox,
        duoQuantityBox,
        duoControlsBox,
      ] = await Promise.all([
        duoCard.getByTestId('product-content-duo-cam-doorbell').boundingBox(),
        duoCard.locator('#product-title-duo-cam-doorbell').boundingBox(),
        duoCard
          .getByTestId('product-description-duo-cam-doorbell')
          .boundingBox(),
        duoCard
          .getByTestId('quantity-duo-cam-doorbell')
          .locator('xpath=..')
          .boundingBox(),
        duoCard.getByTestId('product-controls-duo-cam-doorbell').boundingBox(),
      ])

      expect(duoContentBox).not.toBeNull()
      expect(duoTitleBox).not.toBeNull()
      expect(duoDescriptionBox).not.toBeNull()
      expect(duoQuantityBox).not.toBeNull()
      expect(duoControlsBox).not.toBeNull()

      const descriptionToQuantityGap =
        (duoQuantityBox?.y ?? 0) -
        ((duoDescriptionBox?.y ?? 0) + (duoDescriptionBox?.height ?? 0))
      expect(descriptionToQuantityGap).toBeGreaterThanOrEqual(9)
      expect(descriptionToQuantityGap).toBeLessThanOrEqual(11)

      for (const productId of [
        'cam-v4',
        'cam-pan-v3',
        'floodlight-v2',
      ] as const) {
        const card = page.locator(`[data-product-id="${productId}"]`)
        const [badgeBox, imageFrameBox] = await Promise.all([
          card.getByTestId(`product-badge-${productId}`).boundingBox(),
          card.getByTestId(`product-image-frame-${productId}`).boundingBox(),
        ])

        expect(badgeBox).not.toBeNull()
        expect(imageFrameBox).not.toBeNull()
        expect(
          (imageFrameBox?.y ?? 0) -
            ((badgeBox?.y ?? 0) + (badgeBox?.height ?? 0)),
        ).toBeGreaterThanOrEqual(4)
      }

      for (const productId of productIds) {
        const card = page.locator(`[data-product-id="${productId}"]`)
        const cardBox = await card.boundingBox()
        const controlBoxes = await card
          .locator('[data-control-surface="default"]')
          .evaluateAll((surfaces) =>
            surfaces.map((surface) => {
              const box = surface.getBoundingClientRect()
              return { bottom: box.bottom }
            }),
          )

        expect(controlBoxes).toHaveLength(2)
        for (const controlBox of controlBoxes) {
          expect(controlBox.bottom).toBeLessThanOrEqual(
            (cardBox?.y ?? 0) + (cardBox?.height ?? 0),
          )
        }
      }
    }

    if (viewportWidth === 768 || viewportWidth === 1024) {
      const productIds = [
        'cam-v4',
        'cam-pan-v3',
        'floodlight-v2',
        'duo-cam-doorbell',
        'battery-cam-pro',
      ] as const
      const expectedTitleOffsets =
        viewportWidth === 768
          ? {
              'cam-v4': 196,
              'cam-pan-v3': 212,
              'floodlight-v2': 208,
              'duo-cam-doorbell': 212,
              'battery-cam-pro': 172,
            }
          : {
              'cam-v4': 165,
              'cam-pan-v3': 179,
              'floodlight-v2': 175,
              'duo-cam-doorbell': 180,
              'battery-cam-pro': 136,
            }
      const titleToDescriptionGap = viewportWidth === 768 ? 5 : 4

      for (const productId of productIds) {
        const card = page.locator(`[data-product-id="${productId}"]`)
        const [
          cardBox,
          imageBox,
          titleBox,
          descriptionBox,
          selectorBox,
          controlsBox,
          quantityBox,
        ] = await Promise.all([
          card.boundingBox(),
          card.getByTestId(`product-image-frame-${productId}`).boundingBox(),
          card.locator(`#product-title-${productId}`).boundingBox(),
          card.getByTestId(`product-description-${productId}`).boundingBox(),
          productId === 'duo-cam-doorbell'
            ? Promise.resolve(null)
            : card.getByTestId(`variant-selector-${productId}`).boundingBox(),
          card.getByTestId(`product-controls-${productId}`).boundingBox(),
          card
            .locator('[role="group"][aria-label$=" quantity"]')
            .boundingBox(),
        ])

        expect(cardBox).not.toBeNull()
        expect(imageBox).not.toBeNull()
        expect(titleBox).not.toBeNull()
        expect(descriptionBox).not.toBeNull()
        expect(controlsBox).not.toBeNull()
        expect(quantityBox).not.toBeNull()

        expect((titleBox?.y ?? 0) - (cardBox?.y ?? 0)).toBeCloseTo(
          expectedTitleOffsets[productId],
          1,
        )
        expect(titleBox?.y).toBeCloseTo(
          (imageBox?.y ?? 0) + (imageBox?.height ?? 0),
          1,
        )
        expect(
          (descriptionBox?.y ?? 0) -
            ((titleBox?.y ?? 0) + (titleBox?.height ?? 0)),
        ).toBeCloseTo(titleToDescriptionGap, 1)

        const precedingBox = selectorBox ?? descriptionBox
        if (selectorBox !== null) {
          expect(
            selectorBox.y -
              ((descriptionBox?.y ?? 0) + (descriptionBox?.height ?? 0)),
          ).toBeCloseTo(10, 1)
        }
        const precedingToQuantityGap =
          (quantityBox?.y ?? 0) -
          ((precedingBox?.y ?? 0) + (precedingBox?.height ?? 0))
        expect(precedingToQuantityGap).toBeGreaterThanOrEqual(10)
        expect(precedingToQuantityGap).toBeLessThanOrEqual(18)
        expect(controlsBox?.y ?? 0).toBeGreaterThanOrEqual(
          precedingBox?.y ?? 0,
        )
        expect(
          (controlsBox?.y ?? 0) + (controlsBox?.height ?? 0),
        ).toBeLessThanOrEqual(
          (cardBox?.y ?? 0) + (cardBox?.height ?? 0),
        )
      }

      if (viewportWidth === 1024) {
        const camV4VariantRows = await page
          .locator('[data-product-id="cam-v4"] input[type="radio"]')
          .evaluateAll((inputs) => [
            ...new Set(
              inputs.map((input) =>
                Math.round(
                  input.closest('label')?.getBoundingClientRect().top ?? 0,
                ),
              ),
            ),
          ])
        expect(camV4VariantRows).toHaveLength(1)
      }

      if (viewportWidth === 768) {
        for (const [firstProductId, secondProductId] of [
          ['cam-v4', 'cam-pan-v3'],
          ['floodlight-v2', 'duo-cam-doorbell'],
        ] as const) {
          const [firstCardBox, secondCardBox] = await Promise.all([
            page.locator(`[data-product-id="${firstProductId}"]`).boundingBox(),
            page.locator(`[data-product-id="${secondProductId}"]`).boundingBox(),
          ])

          expect(firstCardBox?.y).toBeCloseTo(secondCardBox?.y ?? 0, 1)
          expect(firstCardBox?.height).toBeCloseTo(
            secondCardBox?.height ?? 0,
            1,
          )
        }
      }
    }

    if (viewportWidth !== undefined && viewportWidth <= 390) {
      const increaseButton = page
        .getByRole('button', { name: /^Increase / })
        .first()
      const box = await increaseButton.boundingBox()

      expect(
        box,
        'a visible quantity control should have a bounding box',
      ).not.toBeNull()
      expect(box?.width).toBeGreaterThanOrEqual(44)
      expect(box?.height).toBeGreaterThanOrEqual(44)

      const mobileSteps = [
        [1, 'Choose your cameras', 75],
        [2, 'Choose your plan', 85],
        [3, 'Choose your sensors', 80],
        [4, 'Add extra protection', 80],
      ] as const

      const firstStep = getStep(page, 1, 'Choose your cameras')
      if ((await firstStep.getAttribute('aria-expanded')) === 'true') {
        await firstStep.click()
      }

      for (const [number, title, referenceStepHeight] of mobileSteps) {
        const step = getStep(page, number, title)
        const buttonBox = await step.boundingBox()
        expect(buttonBox?.width).toBe(viewportWidth)
        expect(buttonBox?.height).toBeGreaterThanOrEqual(44)

        if (viewportWidth === 390) {
          const sectionBox = await step.locator('xpath=../..').boundingBox()
          expect(sectionBox?.height).toBe(referenceStepHeight)
        }
      }

      const review = page.getByTestId('review-panel')
      const compactIncrease = review
        .getByRole('article', { name: 'Wyze Cam v4, White', exact: true })
        .getByRole('button', {
          name: 'Increase Wyze Cam v4, White',
          exact: true,
        })
      const compactButtonBox = await compactIncrease.boundingBox()
      const compactSurfaceBox = await compactIncrease
        .locator('[data-control-surface="compact"]')
        .boundingBox()

      expect(compactButtonBox?.width).toBeGreaterThanOrEqual(44)
      expect(compactButtonBox?.height).toBeGreaterThanOrEqual(44)
      expect(compactSurfaceBox?.width).toBeCloseTo(20, 3)
      expect(compactSurfaceBox?.height).toBeCloseTo(20, 3)

      if (viewportWidth === 320) {
        const lineLayouts = await review
          .getByRole('article')
          .evaluateAll((articles) =>
            articles.flatMap((article) => {
              const name = article.querySelector<HTMLElement>(
                '[data-testid="review-line-name"]',
              )
              const quantity = article.querySelector<HTMLElement>(
                '[role="group"][aria-label$=" quantity"]',
              )
              if (!name || !quantity) return []

              const nameBox = name.getBoundingClientRect()
              const quantityBox = quantity.getBoundingClientRect()
              return [
                {
                  nameRight: nameBox.right,
                  overflowX: getComputedStyle(name).overflowX,
                  quantityLeft: quantityBox.left,
                },
              ]
            }),
          )

        expect(lineLayouts.length).toBeGreaterThan(0)
        for (const layout of lineLayouts) {
          expect(layout.nameRight).toBeLessThanOrEqual(layout.quantityLeft)
          expect(layout.overflowX).toBe('hidden')
        }
      }

      const checkoutBox = await review
        .getByRole('button', { name: 'Checkout', exact: true })
        .boundingBox()
      expect(checkoutBox?.x).toBe(20)
      expect(checkoutBox?.width).toBe(viewportWidth - 40)
      expect(checkoutBox?.height).toBe(48)
    }
  })

  test('keeps checkout reachable for a larger valid bundle', async ({ page }) => {
    await openApp(page)

    for (const productName of [
      'Wyze Cam Floodlight v2',
      'Wyze Duo Cam Doorbell',
      'Wyze Battery Cam Pro',
    ]) {
      const card = getProductCard(page, productName)
      await card
        .getByRole('button', {
          name: new RegExp(`^Increase ${productName}`),
        })
        .click()
    }

    const review = page.getByTestId('review-panel')
    const scrollRegion = page.getByTestId('review-scroll-region')
    const dimensions = await scrollRegion.evaluate((region) => ({
      clientHeight: region.clientHeight,
      scrollHeight: region.scrollHeight,
    }))

    expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight)

    const checkout = review.getByRole('button', {
      name: 'Checkout',
      exact: true,
    })
    await checkout.scrollIntoViewIfNeeded()
    await expect(checkout).toBeVisible()
  })

  test('has no detectable WCAG A/AA violations beyond exact Figma contrast tokens', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openApp(page)

    const semanticResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['color-contrast'])
      .analyze()

    // The source Figma uses three deliberately low-contrast visual tokens. Keep
    // contrast coverage everywhere else instead of disabling the rule globally.
    const contrastResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .exclude('[data-figma-contrast-exception]')
      .analyze()

    const violations = [...semanticResults.violations, ...contrastResults.violations].map((violation) => {
      const targets = violation.nodes
        .flatMap((node) => node.target)
        .join(', ')

      return `${violation.id} (${violation.impact ?? 'unknown impact'}): ${targets}`
    })

    expect(violations).toEqual([])
  })

  test('matches the authoritative seeded visual state', async ({
    page,
  }, testInfo) => {
    const screenshotNameByProject: Readonly<Record<string, string>> = {
      'desktop-chromium': 'seeded-desktop.png',
      'tablet-chromium': 'seeded-tablet.png',
      'tablet-wide-chromium': 'seeded-tablet-wide.png',
      'mobile-chromium': 'collapsed-mobile.png',
    }
    const screenshotName = screenshotNameByProject[testInfo.project.name]
    const isMobile = testInfo.project.name === 'mobile-chromium'

    test.skip(
      screenshotName === undefined,
      'Visual baselines cover the Figma and tablet alignment viewport sizes.',
    )
    if (screenshotName === undefined) return

    await openStableVisualApp(page)

    if (isMobile) {
      const camerasStep = getStep(page, 1, 'Choose your cameras')
      await camerasStep.click()
      await expect(camerasStep).toHaveAttribute('aria-expanded', 'false')
    }

    await page.evaluate('window.scrollTo(0, 0)')

    await expect(page).toHaveScreenshot(
      screenshotName,
      {
        animations: 'disabled',
        caret: 'hide',
        fullPage: false,
        maxDiffPixelRatio: 0.015,
      },
    )
  })
})
