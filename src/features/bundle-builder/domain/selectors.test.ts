import { describe, expect, it } from 'vitest'
import {
  bundleReducer,
  createSeedBundleState,
  selectIsProductSelected,
  selectProductQuantity,
  selectReviewGroups,
  selectReviewLines,
  selectStepCount,
  selectTotals,
} from './index'

describe('bundle selectors', () => {
  it('derives the authoritative seeded counts and exact integer-cent totals', () => {
    const state = createSeedBundleState()

    expect(selectStepCount(state, 'cameras')).toBe(2)
    expect(selectStepCount(state, 'plan')).toBe(1)
    expect(selectStepCount(state, 'sensors')).toBe(2)
    expect(selectStepCount(state, 'accessories')).toBe(1)
    expect(selectTotals(state)).toEqual({
      merchandiseTotalCents: 18_789,
      compareAtTotalCents: 23_881,
      savingsCents: 5_092,
      shippingCents: 0,
      shippingCompareAtCents: 599,
      totalCents: 18_789,
    })
  })

  it('counts distinct products even when several variants are selected', () => {
    let state = createSeedBundleState()
    state = bundleReducer(state, {
      type: 'set-quantity',
      sku: 'cam-v4-grey',
      quantity: 2,
    })

    expect(selectStepCount(state, 'cameras')).toBe(2)
    expect(selectProductQuantity(state, 'cam-v4')).toBe(3)
    expect(selectIsProductSelected(state, 'cam-v4')).toBe(true)

    const camV4Lines = selectReviewLines(state).filter(
      (line) => line.productId === 'cam-v4',
    )
    expect(camV4Lines).toHaveLength(2)
    expect(camV4Lines.map((line) => [line.variantLabel, line.quantity])).toEqual([
      ['White', 1],
      ['Grey', 2],
    ])
  })

  it('orders populated review groups by review metadata and omits empty groups', () => {
    const groups = selectReviewGroups(createSeedBundleState())
    expect(groups.map((group) => group.label)).toEqual([
      'Cameras',
      'Sensors',
      'Accessories',
      'Plan',
    ])
    expect(groups[0]?.lines.map((line) => line.sku)).toEqual([
      'cam-v4-white',
      'cam-pan-v3-white',
    ])
  })

  it('returns a coherent empty state with zero totals', () => {
    const seed = createSeedBundleState()
    const empty = {
      ...seed,
      quantityBySku: Object.fromEntries(
        Object.keys(seed.quantityBySku).map((sku) => [sku, 0]),
      ),
    }

    expect(selectReviewGroups(empty)).toEqual([])
    expect(selectTotals(empty)).toEqual({
      merchandiseTotalCents: 0,
      compareAtTotalCents: 0,
      savingsCents: 0,
      shippingCents: 0,
      shippingCompareAtCents: 599,
      totalCents: 0,
    })
  })
})
