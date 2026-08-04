import {
  getProductSkus,
  selectActiveSku,
  selectSkuQuantity,
} from './domain'
import type {
  BundleProduct,
  BundleState,
  BundleTotals,
  ReviewGroup,
} from './domain'

export type ProductControl = 'quantity' | 'binary' | 'locked'
export type SaveState = 'idle' | 'restored' | 'unsaved' | 'saved' | 'error'

export interface PriceViewModel {
  currentCents: number
  compareAtCents?: number
  suffix?: string
}

export interface VariantViewModel extends PriceViewModel {
  sku: string
  label: string
  swatch?: string
  imageSrc?: string
  imageAlt?: string
  imageWidth?: number
  imageHeight?: number
}

export interface ProductCardViewModel {
  id: string
  title: string
  description: string
  details: string
  badge?: string
  imageSrc: string
  imageAlt: string
  imageWidth: number
  imageHeight: number
  desktopImageSrc?: string
  desktopImageWidth?: number
  desktopImageHeight?: number
  desktopImageIncludesBadge?: boolean
  activeSku: string
  quantityBySku: Readonly<Record<string, number>>
  variants: readonly VariantViewModel[]
  control: ProductControl
  helperText?: string
}

export interface ReviewLineViewModel extends PriceViewModel {
  sku: string
  name: string
  variantLabel?: string
  imageSrc: string
  imageAlt: string
  quantity: number
  control: ProductControl
  helperText?: string
}

export interface ReviewGroupViewModel {
  id: string
  label: string
  lines: readonly ReviewLineViewModel[]
}

export interface ReviewTotalsViewModel {
  totalCents: number
  compareAtCents: number
  savingsCents: number
  shippingCents: number
  shippingCompareAtCents: number
}

function toControl(product: BundleProduct): ProductControl {
  if (product.selection.mode === 'required') return 'locked'
  if (product.selection.mode === 'binary') return 'binary'
  return 'quantity'
}

export function toProductCardViewModel(
  product: BundleProduct,
  state: BundleState,
): ProductCardViewModel {
  const variants =
    product.kind === 'variant'
      ? product.variants.map((variant) => {
          const cardPrice = variant.cardDisplayPrice
          return {
            sku: variant.sku,
            label: variant.label,
            swatch: variant.swatch,
            imageSrc: variant.selectorImage?.src,
            imageAlt: variant.selectorImage?.alt,
            imageWidth: variant.selectorImage?.width,
            imageHeight: variant.selectorImage?.height,
            currentCents: cardPrice?.priceCents ?? variant.priceCents,
            compareAtCents:
              cardPrice === undefined
                ? variant.compareAtCents
                : cardPrice.compareAtCents,
            suffix: product.billingCadence === 'month' ? '/mo' : undefined,
          }
        })
      : [
          {
            sku: product.sku,
            label: product.name,
            currentCents:
              product.cardDisplayPrice?.priceCents ?? product.priceCents,
            compareAtCents:
              product.cardDisplayPrice === undefined
                ? product.compareAtCents
                : product.cardDisplayPrice.compareAtCents,
            suffix: product.billingCadence === 'month' ? '/mo' : undefined,
          },
        ]
  const activeSku = selectActiveSku(state, product.id) ?? variants[0]?.sku ?? ''
  const quantityBySku = Object.fromEntries(
    getProductSkus(product).map((sku) => [sku, selectSkuQuantity(state, sku)]),
  )

  return {
    id: product.id,
    title: product.name,
    description: product.description,
    details: product.details.join(' '),
    badge: product.badge,
    imageSrc: product.image.src,
    imageAlt: product.image.alt,
    imageWidth: product.image.width,
    imageHeight: product.image.height,
    desktopImageSrc: product.cardImage?.src,
    desktopImageWidth: product.cardImage?.width,
    desktopImageHeight: product.cardImage?.height,
    desktopImageIncludesBadge: product.cardImageIncludesBadge,
    activeSku,
    quantityBySku,
    variants,
    control: toControl(product),
    helperText:
      product.selection.mode === 'required'
        ? 'Automatically included when you add at least one sensor.'
        : undefined,
  }
}

export function toReviewGroupViewModels(
  groups: readonly ReviewGroup[],
): readonly ReviewGroupViewModel[] {
  return groups.map((group) => ({
    id: group.id,
    label: group.label,
    lines: group.lines.map((line) => ({
      sku: line.sku,
      name: line.productName,
      variantLabel: line.variantLabel,
      imageSrc: line.image.src,
      imageAlt: line.image.alt,
      quantity: line.quantity,
      currentCents: line.lineTotalCents,
      compareAtCents: line.compareAtLineTotalCents,
      suffix: line.billingCadence === 'month' ? '/mo' : undefined,
      control: line.isRequired
        ? 'locked'
        : line.selectionMode === 'binary'
          ? 'binary'
          : 'quantity',
      helperText: line.isRequired
        ? 'Required for your selected sensors.'
        : undefined,
    })),
  }))
}

export function toReviewTotalsViewModel(
  totals: BundleTotals,
): ReviewTotalsViewModel {
  return {
    totalCents: totals.totalCents,
    compareAtCents: totals.compareAtTotalCents,
    savingsCents: totals.savingsCents,
    shippingCents: totals.shippingCents,
    shippingCompareAtCents: totals.shippingCompareAtCents,
  }
}
