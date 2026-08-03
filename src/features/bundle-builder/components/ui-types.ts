import type { ReactNode } from 'react'

export type ProductControl = 'quantity' | 'binary' | 'locked'

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

export interface AccordionStepViewModel {
  id: string
  eyebrow: string
  title: string
  icon: ReactNode
  selectedCount: number
}
