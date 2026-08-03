import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const storageKey = 'wyze-bundle-builder:v1'

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
  await page.goto('/')
  await expect(page.getByTestId('bundle-builder')).toBeVisible()
}

async function openStableVisualApp(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByTestId('bundle-builder')).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.evaluate("document.fonts.ready")
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
    }
  })

  test('has no detectable WCAG A/AA violations in the seeded state', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openApp(page)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const violations = results.violations.map((violation) => {
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
    const isDesktop = testInfo.project.name === 'desktop-chromium'
    const isMobile = testInfo.project.name === 'mobile-chromium'

    test.skip(
      !isDesktop && !isMobile,
      'Visual baselines cover only the authoritative Figma viewport sizes.',
    )

    await openStableVisualApp(page)

    if (isMobile) {
      const camerasStep = getStep(page, 1, 'Choose your cameras')
      await camerasStep.click()
      await expect(camerasStep).toHaveAttribute('aria-expanded', 'false')
    }

    await page.evaluate('window.scrollTo(0, 0)')

    await expect(page).toHaveScreenshot(
      isDesktop ? 'seeded-desktop.png' : 'collapsed-mobile.png',
      {
        animations: 'disabled',
        caret: 'hide',
        fullPage: false,
        maxDiffPixelRatio: 0.015,
      },
    )
  })
})
