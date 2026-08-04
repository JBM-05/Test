import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { BundleBuilder } from './BundleBuilder'
import { BUNDLE_STORAGE_KEY } from './persistence'

describe('BundleBuilder', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('keeps product variants and review quantities synchronized', async () => {
    const user = userEvent.setup()
    render(<BundleBuilder />)

    expect(screen.getByTestId('bundle-total')).toHaveTextContent('$187.89')

    const card = screen.getByRole('article', { name: 'Wyze Cam v4' })
    await user.click(within(card).getByRole('radio', { name: 'Wyze Cam v4, Grey' }))
    await user.click(within(card).getByRole('button', { name: 'Increase Wyze Cam v4, Grey' }))

    const review = screen.getByTestId('review-panel')
    expect(within(review).getByRole('article', { name: 'Wyze Cam v4, White' })).toBeVisible()
    const greyReviewLine = within(review).getByRole('article', {
      name: 'Wyze Cam v4, Grey',
    })
    expect(greyReviewLine).toBeVisible()
    expect(screen.getByTestId('bundle-total')).toHaveTextContent('$215.87')

    await user.click(within(card).getByRole('radio', { name: 'Wyze Cam v4, White' }))
    expect(screen.getByTestId('quantity-cam-v4-white')).toHaveTextContent('1')
    expect(greyReviewLine).toBeVisible()

    await user.click(
      within(greyReviewLine).getByRole('button', {
        name: 'Decrease Wyze Cam v4, Grey',
      }),
    )
    expect(
      within(review).queryByRole('article', { name: 'Wyze Cam v4, Grey' }),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('bundle-total')).toHaveTextContent('$187.89')

    await user.click(within(card).getByRole('radio', { name: 'Wyze Cam v4, Grey' }))
    expect(screen.getByTestId('quantity-cam-v4-grey')).toHaveTextContent('0')
  })

  it('renders required and plan items as non-destructive review summaries', () => {
    render(<BundleBuilder />)

    const review = screen.getByTestId('review-panel')
    const requiredHub = within(review).getByRole('article', {
      name: 'Wyze Sense Hub (Required)',
    })

    expect(
      within(requiredHub).queryByText('Required', { exact: true }),
    ).not.toBeInTheDocument()
    expect(
      within(requiredHub).getByRole('group', {
        name: 'Wyze Sense Hub (Required) quantity',
      }),
    ).toBeVisible()
    expect(
      within(requiredHub).getByRole('button', {
        name: 'Decrease Wyze Sense Hub (Required)',
      }),
    ).toBeDisabled()
    expect(
      within(requiredHub).getByRole('button', {
        name: 'Increase Wyze Sense Hub (Required)',
      }),
    ).toBeDisabled()
    expect(screen.getByTestId('review-quantity-sense-hub')).toHaveTextContent('1')

    const plan = within(review).getByRole('article', {
      name: 'Cam Unlimited',
    })
    expect(within(plan).queryByRole('button')).not.toBeInTheDocument()
  })

  it('keeps Figma selector thumbnails separate from product and review imagery', () => {
    render(<BundleBuilder />)

    const card = screen.getByRole('article', { name: 'Wyze Cam v4' })
    const mainImage = within(card).getByRole('img', { name: 'Wyze Cam v4' })
    expect(mainImage).toHaveAttribute('src', '/assets/figma/cam-v4.png')

    const whiteVariant = within(card).getByRole('radio', {
      name: 'Wyze Cam v4, White',
    })
    expect(whiteVariant.closest('label')?.querySelector('img')).toHaveAttribute(
      'src',
      '/assets/figma/selector-cam-v4-white.png',
    )

    const reviewLine = within(screen.getByTestId('review-panel')).getByRole(
      'article',
      { name: 'Wyze Cam v4, White' },
    )
    expect(within(reviewLine).getByRole('img', { name: 'Wyze Cam v4' })).toHaveAttribute(
      'src',
      '/assets/figma/review-cam-v4.png',
    )
  })

  it('advances the accordion and focuses the next step', async () => {
    const user = userEvent.setup()
    render(<BundleBuilder />)

    const cameraStep = screen.getByRole('button', {
      name: 'Step 1: Choose your cameras',
    })
    const planStep = screen.getByRole('button', {
      name: 'Step 2: Choose your plan',
    })

    expect(cameraStep).toHaveAttribute('aria-expanded', 'true')
    expect(planStep).toHaveAttribute('aria-expanded', 'false')

    await user.click(screen.getByRole('button', { name: 'Next: Choose your plan' }))

    expect(cameraStep).toHaveAttribute('aria-expanded', 'false')
    expect(planStep).toHaveAttribute('aria-expanded', 'true')
    await waitFor(() => expect(planStep).toHaveFocus())

    await user.click(planStep)
    expect(planStep).toHaveAttribute('aria-expanded', 'false')
  })

  it('persists only explicit saves and restores the exact accordion state', async () => {
    const user = userEvent.setup()
    const view = render(<BundleBuilder />)

    const card = screen.getByRole('article', { name: 'Wyze Cam v4' })
    await user.click(within(card).getByRole('radio', { name: 'Wyze Cam v4, Grey' }))
    await user.click(within(card).getByRole('button', { name: 'Increase Wyze Cam v4, Grey' }))

    expect(window.localStorage.getItem(BUNDLE_STORAGE_KEY)).toBeNull()
    expect(screen.getByTestId('save-status')).toHaveTextContent('unsaved changes')

    await user.click(screen.getByRole('button', { name: 'Step 1: Choose your cameras' }))
    await user.click(screen.getByRole('button', { name: 'Save my system for later' }))
    expect(window.localStorage.getItem(BUNDLE_STORAGE_KEY)).not.toBeNull()
    expect(screen.getByTestId('save-status')).toHaveTextContent('system is saved')

    view.unmount()
    render(<BundleBuilder />)

    const restoredCameraStep = screen.getByRole('button', {
      name: 'Step 1: Choose your cameras',
    })
    expect(restoredCameraStep).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByTestId('save-status')).toHaveTextContent('restored')

    await user.click(restoredCameraStep)
    expect(screen.getByTestId('quantity-cam-v4-grey')).toHaveTextContent('1')
  })

  it('opens accessible dialogs, closes with Escape, and restores trigger focus', async () => {
    const user = userEvent.setup()
    render(<BundleBuilder />)

    const card = screen.getByRole('article', { name: 'Wyze Cam v4' })
    const learnMore = within(card).getByRole('button', { name: 'Learn More' })
    await user.click(learnMore)

    expect(
      screen.getByRole('dialog', { name: 'About Wyze Cam v4' }),
    ).toBeVisible()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(learnMore).toHaveFocus())

    const checkout = screen.getByRole('button', { name: 'Checkout' })
    await user.click(checkout)
    const checkoutDialog = screen.getByRole('dialog', {
      name: 'Ready to check out?',
    })
    expect(checkoutDialog).toHaveTextContent('$187.89')
    expect(checkoutDialog).toHaveTextContent('no payment details are collected')

    await user.keyboard('{Escape}')
    await waitFor(() => expect(checkout).toHaveFocus())
  })
})
