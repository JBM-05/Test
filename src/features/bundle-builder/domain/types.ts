export type StepId = string
export type ProductId = string
export type Sku = string
export type ReviewCategoryId = string
export type MoneyCents = number

export type BillingCadence = 'one-time' | 'month'
export type StepIcon = 'camera' | 'plan' | 'sensor' | 'accessory'

export interface ProductImage {
  readonly src: string
  readonly alt: string
  readonly width: number
  readonly height: number
}

export interface CardDisplayPrice {
  readonly priceCents: MoneyCents
  readonly compareAtCents?: MoneyCents
}

export interface QuantitySelection {
  readonly mode: 'quantity'
}

export interface BinarySelection {
  readonly mode: 'binary'
}

export interface RequiredSelection {
  readonly mode: 'required'
  readonly triggerProductIds: readonly ProductId[]
  readonly quantity: 1
}

export type ProductSelection =
  | QuantitySelection
  | BinarySelection
  | RequiredSelection

export interface ProductVariant {
  readonly sku: Sku
  readonly label: string
  readonly swatch: string
  readonly priceCents: MoneyCents
  readonly compareAtCents?: MoneyCents
  readonly cardDisplayPrice?: CardDisplayPrice
  readonly image?: ProductImage
  readonly selectorImage?: ProductImage
  readonly reviewImage?: ProductImage
}

interface ProductBase {
  readonly id: ProductId
  readonly stepId: StepId
  readonly reviewCategory: ReviewCategoryId
  readonly name: string
  readonly description: string
  readonly details: readonly string[]
  readonly image: ProductImage
  readonly cardImage?: ProductImage
  readonly cardImageIncludesBadge?: boolean
  readonly reviewImage?: ProductImage
  readonly badge?: string
  readonly billingCadence: BillingCadence
  readonly selection: ProductSelection
}

export interface SingleProduct extends ProductBase {
  readonly kind: 'single'
  readonly sku: Sku
  readonly priceCents: MoneyCents
  readonly compareAtCents?: MoneyCents
  readonly cardDisplayPrice?: CardDisplayPrice
}

export interface VariantProduct extends ProductBase {
  readonly kind: 'variant'
  readonly variants: readonly ProductVariant[]
}

export type BundleProduct = SingleProduct | VariantProduct

export interface BundleStep {
  readonly id: StepId
  readonly order: number
  readonly eyebrow: string
  readonly title: string
  readonly icon: StepIcon
  readonly nextLabel: string
}

export interface ReviewCategory {
  readonly id: ReviewCategoryId
  readonly label: string
  readonly order: number
}

export interface BundleReviewMetadata {
  readonly description: string
  readonly categories: readonly ReviewCategory[]
  readonly shipping: {
    readonly label: string
    readonly priceCents: MoneyCents
    readonly compareAtCents: MoneyCents
    readonly freeLabel: string
  }
  readonly guarantee: {
    readonly title: string
    readonly description: string
  }
  readonly financing: {
    readonly description: string
    readonly learnMoreLabel: string
  }
}

export interface BundleState {
  readonly openStepId: StepId | null
  readonly activeVariantByProductId: Readonly<Record<ProductId, Sku>>
  readonly quantityBySku: Readonly<Record<Sku, number>>
}

export interface BundleCatalog {
  readonly catalogVersion: number
  readonly currency: string
  readonly steps: readonly BundleStep[]
  readonly review: BundleReviewMetadata
  readonly products: readonly BundleProduct[]
  readonly seed: BundleState
}

export type BundleAction =
  | { readonly type: 'toggle-step'; readonly stepId: StepId }
  | { readonly type: 'open-step'; readonly stepId: StepId | null }
  | {
      readonly type: 'select-variant'
      readonly productId: ProductId
      readonly sku: Sku
    }
  | { readonly type: 'set-quantity'; readonly sku: Sku; readonly quantity: number }
  | { readonly type: 'increment-quantity'; readonly sku: Sku }
  | { readonly type: 'decrement-quantity'; readonly sku: Sku }
  | { readonly type: 'toggle-product'; readonly sku: Sku }

export interface ReviewLine {
  readonly key: Sku
  readonly sku: Sku
  readonly productId: ProductId
  readonly productName: string
  readonly displayName: string
  readonly variantLabel?: string
  readonly category: ReviewCategoryId
  readonly image: ProductImage
  readonly quantity: number
  readonly unitPriceCents: MoneyCents
  readonly compareAtUnitPriceCents: MoneyCents
  readonly lineTotalCents: MoneyCents
  readonly compareAtLineTotalCents: MoneyCents
  readonly billingCadence: BillingCadence
  readonly selectionMode: ProductSelection['mode']
  readonly isRequired: boolean
}

export interface ReviewGroup {
  readonly id: ReviewCategoryId
  readonly label: string
  readonly lines: readonly ReviewLine[]
}

export interface BundleTotals {
  readonly merchandiseTotalCents: MoneyCents
  readonly compareAtTotalCents: MoneyCents
  readonly savingsCents: MoneyCents
  readonly shippingCents: MoneyCents
  readonly shippingCompareAtCents: MoneyCents
  readonly totalCents: MoneyCents
}

export interface SavedBundleSnapshot {
  readonly schemaVersion: 1
  readonly catalogVersion: number
  readonly state: BundleState
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type SaveBundleResult =
  | { readonly ok: true }
  | {
      readonly ok: false
      readonly error: 'storage-unavailable' | 'storage-write-failed'
    }
