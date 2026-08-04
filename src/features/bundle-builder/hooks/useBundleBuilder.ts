import { useReducer, useRef, useState } from 'react'

import {
  bundleCatalog,
  bundleReducer,
  getProductById,
  seedBundleState,
  selectReviewGroups,
  selectStepCount,
  selectTotals,
} from '../domain'
import type {
  BundleAction,
  BundleProduct,
  ProductId,
  Sku,
  StepId,
} from '../domain'
import { loadBundleState, saveBundleState } from '../persistence'
import {
  toProductCardViewModel,
  toReviewGroupViewModels,
  toReviewTotalsViewModel,
} from '../view-models'
import type { SaveState } from '../view-models'

export function useBundleBuilder() {
  const [restoredState] = useState(() => loadBundleState())
  const [state, dispatch] = useReducer(
    bundleReducer,
    restoredState ?? seedBundleState,
  )
  const [saveState, setSaveState] = useState<SaveState>(
    restoredState ? 'restored' : 'idle',
  )
  const [detailsProductId, setDetailsProductId] = useState<ProductId | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const stepButtonRefs = useRef(new Map<StepId, HTMLButtonElement>())
  const reviewPanelRef = useRef<HTMLElement>(null)

  const reviewGroups = toReviewGroupViewModels(selectReviewGroups(state))
  const reviewTotals = toReviewTotalsViewModel(selectTotals(state))
  const detailsProduct = detailsProductId
    ? getProductById(detailsProductId)
    : undefined
  const selectedLineItemCount = reviewGroups.reduce(
    (count, group) => count + group.lines.length,
    0,
  )

  function updateState(action: BundleAction) {
    dispatch(action)
    setSaveState('unsaved')
  }

  function toggleStep(stepId: StepId) {
    updateState({ type: 'toggle-step', stepId })
  }

  function selectVariant(productId: ProductId, sku: Sku) {
    updateState({ type: 'select-variant', productId, sku })
  }

  function setQuantity(sku: Sku, quantity: number) {
    updateState({ type: 'set-quantity', sku, quantity })
  }

  function advanceFromStep(index: number) {
    const nextStep = bundleCatalog.steps[index + 1]

    if (!nextStep) {
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
      reviewPanelRef.current?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      })
      requestAnimationFrame(() => {
        const heading =
          reviewPanelRef.current?.querySelector<HTMLElement>('#review-title')
        heading?.focus()
      })
      return
    }

    updateState({ type: 'open-step', stepId: nextStep.id })
    requestAnimationFrame(() => stepButtonRefs.current.get(nextStep.id)?.focus())
  }

  function setStepButtonRef(stepId: StepId, node: HTMLButtonElement | null) {
    if (node) stepButtonRefs.current.set(stepId, node)
    else stepButtonRefs.current.delete(stepId)
  }

  function save() {
    const result = saveBundleState(state)
    setSaveState(result.ok ? 'saved' : 'error')
  }

  return {
    state,
    saveState,
    detailsProduct,
    checkoutOpen,
    reviewPanelRef,
    reviewGroups,
    reviewTotals,
    selectedLineItemCount,
    productCardFor: (product: BundleProduct) =>
      toProductCardViewModel(product, state),
    selectedCountForStep: (stepId: StepId) => selectStepCount(state, stepId),
    setStepButtonRef,
    toggleStep,
    selectVariant,
    setQuantity,
    advanceFromStep,
    save,
    openProductDetails: setDetailsProductId,
    closeProductDetails: () => setDetailsProductId(null),
    openCheckout: () => setCheckoutOpen(true),
    closeCheckout: () => setCheckoutOpen(false),
  }
}
