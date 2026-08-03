import {
  bundleCatalog,
  getProductById,
  getProductBySku,
  getProductSkus,
  getVariantBySku,
  isKnownStepId,
} from './catalog'
import type {
  BundleAction,
  BundleProduct,
  BundleState,
  ProductId,
  Sku,
  VariantProduct,
} from './types'

export const seedBundleState: BundleState = bundleCatalog.seed

export function cloneBundleState(state: BundleState): BundleState {
  return {
    openStepId: state.openStepId,
    activeVariantByProductId: { ...state.activeVariantByProductId },
    quantityBySku: { ...state.quantityBySku },
  }
}

export function createSeedBundleState(): BundleState {
  return cloneBundleState(seedBundleState)
}

function productHasQuantity(product: BundleProduct, state: BundleState): boolean {
  return getProductSkus(product).some(
    (sku) => (state.quantityBySku[sku] ?? 0) > 0,
  )
}

export function enforceRequiredProductInvariants(
  state: BundleState,
): BundleState {
  let quantityBySku: Record<Sku, number> | undefined

  for (const product of bundleCatalog.products) {
    if (product.selection.mode !== 'required' || product.kind !== 'single') {
      continue
    }

    const isTriggered = product.selection.triggerProductIds.some((productId) => {
      const triggerProduct = getProductById(productId)
      return triggerProduct !== undefined && productHasQuantity(triggerProduct, state)
    })
    const requiredQuantity = isTriggered ? product.selection.quantity : 0
    const currentQuantity =
      quantityBySku?.[product.sku] ?? state.quantityBySku[product.sku] ?? 0

    if (currentQuantity !== requiredQuantity) {
      quantityBySku ??= { ...state.quantityBySku }
      quantityBySku[product.sku] = requiredQuantity
    }
  }

  return quantityBySku === undefined ? state : { ...state, quantityBySku }
}

function setQuantity(state: BundleState, sku: Sku, requested: number): BundleState {
  const product = getProductBySku(sku)
  if (
    product === undefined ||
    product.selection.mode === 'required' ||
    !Number.isSafeInteger(requested)
  ) {
    return state
  }

  const normalized =
    product.selection.mode === 'binary'
      ? Math.min(1, Math.max(0, requested))
      : Math.max(0, requested)
  const current = state.quantityBySku[sku] ?? 0
  const productSkus = getProductSkus(product)
  const needsOtherBinarySkusCleared =
    product.selection.mode === 'binary' &&
    normalized === 1 &&
    productSkus.some(
      (productSku) =>
        productSku !== sku && (state.quantityBySku[productSku] ?? 0) !== 0,
    )

  if (current === normalized && !needsOtherBinarySkusCleared) return state

  const quantityBySku: Record<Sku, number> = {
    ...state.quantityBySku,
    [sku]: normalized,
  }
  if (product.selection.mode === 'binary' && normalized === 1) {
    for (const productSku of productSkus) {
      if (productSku !== sku) quantityBySku[productSku] = 0
    }
  }

  return enforceRequiredProductInvariants({ ...state, quantityBySku })
}

function selectVariant(
  state: BundleState,
  productId: ProductId,
  sku: Sku,
): BundleState {
  const product = getProductById(productId)
  if (
    product?.kind !== 'variant' ||
    getVariantBySku(product as VariantProduct, sku) === undefined ||
    state.activeVariantByProductId[productId] === sku
  ) {
    return state
  }
  return {
    ...state,
    activeVariantByProductId: {
      ...state.activeVariantByProductId,
      [productId]: sku,
    },
  }
}

export function bundleReducer(
  state: BundleState,
  action: BundleAction,
): BundleState {
  switch (action.type) {
    case 'toggle-step': {
      if (!isKnownStepId(action.stepId)) return state
      return {
        ...state,
        openStepId: state.openStepId === action.stepId ? null : action.stepId,
      }
    }
    case 'open-step': {
      if (
        action.stepId !== null &&
        !isKnownStepId(action.stepId)
      ) {
        return state
      }
      return state.openStepId === action.stepId
        ? state
        : { ...state, openStepId: action.stepId }
    }
    case 'select-variant':
      return selectVariant(state, action.productId, action.sku)
    case 'set-quantity':
      return setQuantity(state, action.sku, action.quantity)
    case 'increment-quantity': {
      const current = state.quantityBySku[action.sku] ?? 0
      if (current >= Number.MAX_SAFE_INTEGER) return state
      return setQuantity(state, action.sku, current + 1)
    }
    case 'decrement-quantity': {
      const current = state.quantityBySku[action.sku] ?? 0
      return setQuantity(state, action.sku, Math.max(0, current - 1))
    }
    case 'toggle-product': {
      const current = state.quantityBySku[action.sku] ?? 0
      return setQuantity(state, action.sku, current > 0 ? 0 : 1)
    }
  }
}
