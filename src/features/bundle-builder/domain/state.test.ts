import { describe, expect, it } from 'vitest'
import {
  bundleReducer,
  createSeedBundleState,
  selectActiveProductQuantity,
  selectActiveSku,
  selectSkuQuantity,
} from './index'

describe('bundleReducer', () => {
  it('tracks each variant independently and preserves inactive quantities', () => {
    let state = createSeedBundleState()

    state = bundleReducer(state, {
      type: 'select-variant',
      productId: 'cam-v4',
      sku: 'cam-v4-grey',
    })
    expect(selectActiveSku(state, 'cam-v4')).toBe('cam-v4-grey')
    expect(selectActiveProductQuantity(state, 'cam-v4')).toBe(0)

    state = bundleReducer(state, {
      type: 'set-quantity',
      sku: 'cam-v4-grey',
      quantity: 2,
    })
    expect(selectSkuQuantity(state, 'cam-v4-grey')).toBe(2)
    expect(selectSkuQuantity(state, 'cam-v4-white')).toBe(1)

    state = bundleReducer(state, {
      type: 'select-variant',
      productId: 'cam-v4',
      sku: 'cam-v4-white',
    })
    expect(selectActiveProductQuantity(state, 'cam-v4')).toBe(1)
    expect(selectSkuQuantity(state, 'cam-v4-grey')).toBe(2)
  })

  it('supports a variantless product and never permits a negative quantity', () => {
    let state = createSeedBundleState()
    state = bundleReducer(state, {
      type: 'increment-quantity',
      sku: 'duo-cam-doorbell',
    })
    expect(selectSkuQuantity(state, 'duo-cam-doorbell')).toBe(1)

    state = bundleReducer(state, {
      type: 'set-quantity',
      sku: 'duo-cam-doorbell',
      quantity: -8,
    })
    expect(selectSkuQuantity(state, 'duo-cam-doorbell')).toBe(0)

    const sameState = bundleReducer(state, {
      type: 'set-quantity',
      sku: 'duo-cam-doorbell',
      quantity: 1.5,
    })
    expect(sameState).toBe(state)
  })

  it('keeps the plan binary for every quantity action', () => {
    let state = createSeedBundleState()
    state = bundleReducer(state, {
      type: 'increment-quantity',
      sku: 'cam-unlimited',
    })
    expect(selectSkuQuantity(state, 'cam-unlimited')).toBe(1)

    state = bundleReducer(state, {
      type: 'set-quantity',
      sku: 'cam-unlimited',
      quantity: 20,
    })
    expect(selectSkuQuantity(state, 'cam-unlimited')).toBe(1)

    state = bundleReducer(state, {
      type: 'toggle-product',
      sku: 'cam-unlimited',
    })
    expect(selectSkuQuantity(state, 'cam-unlimited')).toBe(0)
  })

  it('derives the required hub from sensor selection and locks direct edits', () => {
    let state = createSeedBundleState()
    state = bundleReducer(state, {
      type: 'set-quantity',
      sku: 'motion-sensor',
      quantity: 0,
    })
    expect(selectSkuQuantity(state, 'sense-hub')).toBe(0)

    state = bundleReducer(state, {
      type: 'increment-quantity',
      sku: 'motion-sensor',
    })
    expect(selectSkuQuantity(state, 'sense-hub')).toBe(1)

    const lockedState = bundleReducer(state, {
      type: 'set-quantity',
      sku: 'sense-hub',
      quantity: 0,
    })
    expect(lockedState).toBe(state)
    expect(selectSkuQuantity(lockedState, 'sense-hub')).toBe(1)
  })

  it('opens only one step while allowing the current step to collapse', () => {
    let state = createSeedBundleState()
    state = bundleReducer(state, { type: 'toggle-step', stepId: 'cameras' })
    expect(state.openStepId).toBeNull()

    state = bundleReducer(state, { type: 'toggle-step', stepId: 'plan' })
    expect(state.openStepId).toBe('plan')

    state = bundleReducer(state, { type: 'open-step', stepId: 'sensors' })
    expect(state.openStepId).toBe('sensors')
  })

  it('ignores unknown SKUs, products, variants, and steps', () => {
    const seed = createSeedBundleState()
    expect(
      bundleReducer(seed, {
        type: 'increment-quantity',
        sku: 'not-a-sku',
      }),
    ).toBe(seed)
    expect(
      bundleReducer(seed, {
        type: 'select-variant',
        productId: 'cam-v4',
        sku: 'cam-pan-v3-black',
      }),
    ).toBe(seed)
    expect(
      bundleReducer(seed, { type: 'toggle-step', stepId: 'unknown' }),
    ).toBe(seed)
  })
})
