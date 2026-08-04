import { describe, expect, it } from 'vitest'

import {
  bundleCatalog,
  bundleReducer,
  createSeedBundleState,
} from '../domain'
import type { StorageLike } from '../domain'
import {
  BUNDLE_STORAGE_KEY,
  createInitialBundleState,
  createSavedBundleSnapshot,
  loadBundleState,
  saveBundleState,
  validateSavedBundleSnapshot,
} from './index'

function createMemoryStorage(): StorageLike & { values: Map<string, string> } {
  const values = new Map<string, string>()
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}

describe('bundle snapshot validation', () => {
  it('rejects stale catalog versions', () => {
    const snapshot = createSavedBundleSnapshot(createSeedBundleState())

    expect(
      validateSavedBundleSnapshot({
        ...snapshot,
        catalogVersion: bundleCatalog.catalogVersion + 1,
      }),
    ).toBeNull()
  })

  it('rejects unknown IDs, invalid variants, non-integers, and binary overflow', () => {
    const valid = createSavedBundleSnapshot(createSeedBundleState())

    expect(
      validateSavedBundleSnapshot({
        ...valid,
        state: {
          ...valid.state,
          quantityBySku: { ...valid.state.quantityBySku, unknown: 1 },
        },
      }),
    ).toBeNull()

    expect(
      validateSavedBundleSnapshot({
        ...valid,
        state: {
          ...valid.state,
          activeVariantByProductId: {
            ...valid.state.activeVariantByProductId,
            'cam-v4': 'cam-pan-v3-black',
          },
        },
      }),
    ).toBeNull()

    expect(
      validateSavedBundleSnapshot({
        ...valid,
        state: {
          ...valid.state,
          quantityBySku: {
            ...valid.state.quantityBySku,
            'motion-sensor': 1.5,
          },
        },
      }),
    ).toBeNull()

    expect(
      validateSavedBundleSnapshot({
        ...valid,
        state: {
          ...valid.state,
          quantityBySku: {
            ...valid.state.quantityBySku,
            'cam-unlimited': 2,
          },
        },
      }),
    ).toBeNull()
  })

  it('rejects snapshots that violate the required-hub invariant', () => {
    const valid = createSavedBundleSnapshot(createSeedBundleState())
    const invalid = {
      ...valid,
      state: {
        ...valid.state,
        quantityBySku: {
          ...valid.state.quantityBySku,
          'sense-hub': 0,
        },
      },
    }

    expect(validateSavedBundleSnapshot(invalid)).toBeNull()
  })
})

describe('local bundle storage', () => {
  it('round-trips the complete configuration only when explicitly saved', () => {
    const storage = createMemoryStorage()
    let state = createSeedBundleState()
    state = bundleReducer(state, { type: 'open-step', stepId: null })
    state = bundleReducer(state, {
      type: 'select-variant',
      productId: 'cam-v4',
      sku: 'cam-v4-black',
    })
    state = bundleReducer(state, {
      type: 'set-quantity',
      sku: 'cam-v4-black',
      quantity: 3,
    })

    expect(loadBundleState(storage)).toBeNull()
    expect(saveBundleState(state, storage)).toEqual({ ok: true })
    expect(loadBundleState(storage)).toEqual(state)
    expect(createInitialBundleState(storage)).toEqual(state)
  })

  it('falls back to the seed for missing or malformed data', () => {
    const missing = createMemoryStorage()
    expect(createInitialBundleState(missing)).toEqual(createSeedBundleState())

    const malformed = createMemoryStorage()
    malformed.values.set(BUNDLE_STORAGE_KEY, '{bad json')
    expect(createInitialBundleState(malformed)).toEqual(createSeedBundleState())
  })

  it('handles inaccessible storage without throwing', () => {
    const inaccessible: StorageLike = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }

    expect(loadBundleState(inaccessible)).toBeNull()
    expect(saveBundleState(createSeedBundleState(), inaccessible)).toEqual({
      ok: false,
      error: 'storage-write-failed',
    })
    expect(saveBundleState(createSeedBundleState(), null)).toEqual({
      ok: false,
      error: 'storage-unavailable',
    })
  })
})
