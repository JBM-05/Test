import { cloneBundleState, createSeedBundleState } from '../domain/state'
import type {
  BundleState,
  SaveBundleResult,
  StorageLike,
} from '../domain/types'
import {
  createSavedBundleSnapshot,
  validateSavedBundleSnapshot,
} from './snapshot'

export const BUNDLE_STORAGE_KEY = 'wyze-bundle-builder:v1'

function defaultStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function loadBundleState(
  storage: StorageLike | null = defaultStorage(),
): BundleState | null {
  if (storage === null) return null
  try {
    const serialized = storage.getItem(BUNDLE_STORAGE_KEY)
    if (serialized === null) return null
    const snapshot = validateSavedBundleSnapshot(JSON.parse(serialized))
    return snapshot === null ? null : cloneBundleState(snapshot.state)
  } catch {
    return null
  }
}

export function saveBundleState(
  state: BundleState,
  storage: StorageLike | null = defaultStorage(),
): SaveBundleResult {
  if (storage === null) return { ok: false, error: 'storage-unavailable' }
  try {
    storage.setItem(
      BUNDLE_STORAGE_KEY,
      JSON.stringify(createSavedBundleSnapshot(state)),
    )
    return { ok: true }
  } catch {
    return { ok: false, error: 'storage-write-failed' }
  }
}

export function createInitialBundleState(
  storage: StorageLike | null = defaultStorage(),
): BundleState {
  return loadBundleState(storage) ?? createSeedBundleState()
}
