import {
  bundleCatalog,
  getProductSkus,
  isKnownSku,
  isKnownStepId,
} from '../domain/catalog'
import {
  cloneBundleState,
  enforceRequiredProductInvariants,
} from '../domain/state'
import type {
  BundleState,
  SavedBundleSnapshot,
} from '../domain/types'

export const BUNDLE_SNAPSHOT_SCHEMA_VERSION = 1 as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactKeys(
  value: Readonly<Record<string, unknown>>,
  expectedKeys: readonly string[],
): boolean {
  const actualKeys = Object.keys(value)
  return (
    actualKeys.length === expectedKeys.length &&
    actualKeys.every((key) => expectedKeys.includes(key))
  )
}

function validateState(value: unknown): BundleState | null {
  if (!isRecord(value)) return null

  const openStepId = value.openStepId
  if (
    openStepId !== null &&
    (typeof openStepId !== 'string' || !isKnownStepId(openStepId))
  ) {
    return null
  }

  const activeVariants = value.activeVariantByProductId
  const quantities = value.quantityBySku
  if (!isRecord(activeVariants) || !isRecord(quantities)) return null

  const variantProducts = bundleCatalog.products.filter(
    (product) => product.kind === 'variant',
  )
  const variantProductIds = variantProducts.map((product) => product.id)
  if (!hasExactKeys(activeVariants, variantProductIds)) return null
  for (const product of variantProducts) {
    const activeSku = activeVariants[product.id]
    if (
      typeof activeSku !== 'string' ||
      !product.variants.some((variant) => variant.sku === activeSku)
    ) {
      return null
    }
  }

  const knownSkus = bundleCatalog.products.flatMap(getProductSkus)
  if (!hasExactKeys(quantities, knownSkus)) return null
  for (const [sku, quantity] of Object.entries(quantities)) {
    if (
      !isKnownSku(sku) ||
      !Number.isSafeInteger(quantity) ||
      (quantity as number) < 0
    ) {
      return null
    }
  }

  const state: BundleState = {
    openStepId,
    activeVariantByProductId: activeVariants as Record<string, string>,
    quantityBySku: quantities as Record<string, number>,
  }

  for (const product of bundleCatalog.products) {
    if (product.selection.mode !== 'binary') continue
    const total = getProductSkus(product).reduce(
      (sum, sku) => sum + (state.quantityBySku[sku] ?? 0),
      0,
    )
    if (total > 1) return null
  }

  const invariantState = enforceRequiredProductInvariants(state)
  for (const product of bundleCatalog.products) {
    if (product.selection.mode !== 'required') continue
    for (const sku of getProductSkus(product)) {
      if (state.quantityBySku[sku] !== invariantState.quantityBySku[sku]) {
        return null
      }
    }
  }

  return cloneBundleState(state)
}

export function validateSavedBundleSnapshot(
  value: unknown,
): SavedBundleSnapshot | null {
  if (!isRecord(value)) return null
  if (
    value.schemaVersion !== BUNDLE_SNAPSHOT_SCHEMA_VERSION ||
    value.catalogVersion !== bundleCatalog.catalogVersion
  ) {
    return null
  }
  const state = validateState(value.state)
  if (state === null) return null
  return {
    schemaVersion: BUNDLE_SNAPSHOT_SCHEMA_VERSION,
    catalogVersion: bundleCatalog.catalogVersion,
    state,
  }
}

export function createSavedBundleSnapshot(
  state: BundleState,
): SavedBundleSnapshot {
  return {
    schemaVersion: BUNDLE_SNAPSHOT_SCHEMA_VERSION,
    catalogVersion: bundleCatalog.catalogVersion,
    state: cloneBundleState(state),
  }
}
