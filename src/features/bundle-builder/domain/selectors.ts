import {
  bundleCatalog,
  getProductById,
  getProductBySku,
  getProductSkus,
} from './catalog'
import type {
  BundleProduct,
  BundleState,
  BundleTotals,
  ProductId,
  ProductImage,
  ReviewGroup,
  ReviewLine,
  Sku,
  StepId,
} from './types'

interface SkuPresentation {
  readonly label?: string
  readonly priceCents: number
  readonly compareAtCents: number
  readonly image: ProductImage
}

function getSkuPresentation(
  product: BundleProduct,
  sku: Sku,
): SkuPresentation | undefined {
  if (product.kind === 'single') {
    if (product.sku !== sku) return undefined
    return {
      priceCents: product.priceCents,
      compareAtCents: product.compareAtCents ?? product.priceCents,
      image: product.reviewImage ?? product.image,
    }
  }

  const variant = product.variants.find((item) => item.sku === sku)
  if (variant === undefined) return undefined
  return {
    label: variant.label,
    priceCents: variant.priceCents,
    compareAtCents: variant.compareAtCents ?? variant.priceCents,
    image:
      variant.reviewImage ??
      product.reviewImage ??
      variant.image ??
      product.image,
  }
}

export function selectSkuQuantity(state: BundleState, sku: Sku): number {
  return state.quantityBySku[sku] ?? 0
}

export function selectActiveSku(
  state: BundleState,
  productId: ProductId,
): Sku | undefined {
  const product = getProductById(productId)
  if (product === undefined) return undefined
  if (product.kind === 'single') return product.sku

  const activeSku = state.activeVariantByProductId[productId]
  return product.variants.some((variant) => variant.sku === activeSku)
    ? activeSku
    : product.variants[0]?.sku
}

export function selectActiveProductQuantity(
  state: BundleState,
  productId: ProductId,
): number {
  const activeSku = selectActiveSku(state, productId)
  return activeSku === undefined ? 0 : selectSkuQuantity(state, activeSku)
}

export function selectProductQuantity(
  state: BundleState,
  productId: ProductId,
): number {
  const product = getProductById(productId)
  if (product === undefined) return 0
  return getProductSkus(product).reduce(
    (total, sku) => total + selectSkuQuantity(state, sku),
    0,
  )
}

export function selectIsProductSelected(
  state: BundleState,
  productId: ProductId,
): boolean {
  return selectProductQuantity(state, productId) > 0
}

export function selectStepCount(state: BundleState, stepId: StepId): number {
  return bundleCatalog.products.reduce(
    (count, product) =>
      product.stepId === stepId && selectIsProductSelected(state, product.id)
        ? count + 1
        : count,
    0,
  )
}

export function selectReviewLines(state: BundleState): readonly ReviewLine[] {
  const lines: ReviewLine[] = []

  for (const product of bundleCatalog.products) {
    for (const sku of getProductSkus(product)) {
      const quantity = selectSkuQuantity(state, sku)
      if (quantity <= 0) continue

      const presentation = getSkuPresentation(product, sku)
      if (presentation === undefined) continue
      const variantLabel = presentation.label
      lines.push({
        key: sku,
        sku,
        productId: product.id,
        productName: product.name,
        displayName:
          variantLabel === undefined
            ? product.name
            : `${product.name} - ${variantLabel}`,
        ...(variantLabel === undefined ? {} : { variantLabel }),
        category: product.reviewCategory,
        image: presentation.image,
        quantity,
        unitPriceCents: presentation.priceCents,
        compareAtUnitPriceCents: presentation.compareAtCents,
        lineTotalCents: presentation.priceCents * quantity,
        compareAtLineTotalCents: presentation.compareAtCents * quantity,
        billingCadence: product.billingCadence,
        selectionMode: product.selection.mode,
        isRequired: product.selection.mode === 'required',
      })
    }
  }

  return lines
}

export function selectReviewGroups(state: BundleState): readonly ReviewGroup[] {
  const lines = selectReviewLines(state)
  return [...bundleCatalog.review.categories]
    .sort((left, right) => left.order - right.order)
    .map((category) => ({
      id: category.id,
      label: category.label,
      lines: lines.filter((line) => line.category === category.id),
    }))
    .filter((group) => group.lines.length > 0)
}

export function selectTotals(state: BundleState): BundleTotals {
  const lines = selectReviewLines(state)
  const merchandiseTotalCents = lines.reduce(
    (total, line) => total + line.lineTotalCents,
    0,
  )
  const compareAtTotalCents = lines.reduce(
    (total, line) => total + line.compareAtLineTotalCents,
    0,
  )
  const shippingCents = bundleCatalog.review.shipping.priceCents

  return {
    merchandiseTotalCents,
    compareAtTotalCents,
    savingsCents: Math.max(0, compareAtTotalCents - merchandiseTotalCents),
    shippingCents,
    shippingCompareAtCents: bundleCatalog.review.shipping.compareAtCents,
    totalCents: merchandiseTotalCents + shippingCents,
  }
}

export function selectProductForSku(sku: Sku): BundleProduct | undefined {
  return getProductBySku(sku)
}
