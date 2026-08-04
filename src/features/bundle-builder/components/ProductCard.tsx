import { LockKeyhole } from 'lucide-react'
import { useRef } from 'react'

import { formatCurrency } from '../formatting/currency'
import { gsap, useGSAP } from './motion'
import { QuantityStepper } from './QuantityStepper'
import type { ProductCardViewModel } from '../view-models'
import { VariantSelector } from './VariantSelector'

interface ProductCardProps {
  product: ProductCardViewModel
  priority?: boolean
  onVariantChange: (productId: string, sku: string) => void
  onQuantityChange: (sku: string, quantity: number) => void
  onLearnMore: (productId: string) => void
}

interface ProductCardLayout {
  readonly mediaHeightClassName: string
  readonly desktopImageWidthClassName?: string
  readonly desktopContentWidthClassName?: string
  readonly desktopGapClassName?: string
}

const DEFAULT_PRODUCT_CARD_LAYOUT: ProductCardLayout = {
  mediaHeightClassName: 'md:h-48 lg:h-[154px] xl:h-[137px]',
}

const PRODUCT_CARD_LAYOUTS: Readonly<Record<string, ProductCardLayout>> = {
  'cam-v4': {
    mediaHeightClassName: 'md:h-[176px] lg:h-[154px] xl:h-[137px]',
    desktopContentWidthClassName: 'xl:w-[219.5px]',
    desktopGapClassName: 'xl:gap-[19px]',
  },
  'cam-pan-v3': {
    mediaHeightClassName: 'md:h-[192px] lg:h-[168px] xl:h-[137px]',
    desktopGapClassName: 'xl:gap-[19px]',
  },
  'floodlight-v2': {
    mediaHeightClassName: 'md:h-[188px] lg:h-[164px] xl:h-[151px]',
    desktopImageWidthClassName: 'xl:w-[100px]',
  },
  'duo-cam-doorbell': {
    mediaHeightClassName: 'md:h-[192px] lg:h-[169px] xl:h-[151px]',
  },
  'battery-cam-pro': {
    mediaHeightClassName: 'md:h-[152px] lg:h-[125px] xl:h-[143px]',
  },
}

export function ProductCard({
  product,
  priority = false,
  onVariantChange,
  onQuantityChange,
  onLearnMore,
}: ProductCardProps) {
  const cardRef = useRef<HTMLElement>(null)
  const activeVariant =
    product.variants.find((variant) => variant.sku === product.activeSku) ?? product.variants[0]
  const activeQuantity = product.quantityBySku[product.activeSku] ?? 0
  const totalQuantity = product.variants.reduce(
    (total, variant) => total + (product.quantityBySku[variant.sku] ?? 0),
    0,
  )
  const isSelected = totalQuantity > 0
  const hasColorOptions = product.variants.length > 1
  const layout = PRODUCT_CARD_LAYOUTS[product.id] ?? DEFAULT_PRODUCT_CARD_LAYOUT

  useGSAP(
    () => {
      if (!cardRef.current) return

      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(cardRef.current, { autoAlpha: 1, y: 0 })
      })
      media.add('(prefers-reduced-motion: no-preference)', () => {
        if (!isSelected) {
          gsap.set(cardRef.current, { autoAlpha: 1, y: 0 })
          return
        }

        gsap.fromTo(
          cardRef.current,
          { autoAlpha: 0.96, y: 2 },
          { autoAlpha: 1, y: 0, duration: 0.24, ease: 'power2.out' },
        )
      })

      return () => media.revert()
    },
    { dependencies: [isSelected], scope: cardRef },
  )

  if (!activeVariant) return null

  const quantityLabel =
    hasColorOptions
      ? `${product.title}, ${activeVariant.label}`
      : product.title

  return (
    <article
      ref={cardRef}
      className={[
        'relative flex h-full min-w-0 flex-col overflow-hidden rounded-[10px] bg-white p-4 sm:p-5 lg:p-[11px] xl:flex-row xl:items-center',
        layout.desktopGapClassName ?? 'xl:gap-[13px]',
        isSelected
          ? 'shadow-[inset_0_0_0_2px_#846ee0]'
          : 'shadow-none',
      ].join(' ')}
      aria-labelledby={`product-title-${product.id}`}
      data-selected={isSelected ? 'true' : 'false'}
      data-product-id={product.id}
    >
      {product.badge ? (
        <span
          className={[
            'absolute left-[11px] top-[11px] z-10 inline-flex h-[19px] items-center rounded-[10px] bg-brand px-[6px] text-xs font-semibold leading-none text-white',
            product.desktopImageIncludesBadge ? 'xl:sr-only' : '',
          ].join(' ')}
          data-testid={`product-badge-${product.id}`}
        >
          {product.badge}
        </span>
      ) : null}

      <div
        className={[
          'mx-auto flex h-44 w-full max-w-[240px] shrink-0 items-center justify-center sm:h-48 md:max-w-none xl:mx-0',
          product.badge ? 'md:pt-6 xl:pt-0' : '',
          layout.mediaHeightClassName,
          layout.desktopImageWidthClassName ?? 'xl:w-[101px]',
        ].join(' ')}
      >
        <picture
          className="block size-full"
          data-testid={`product-image-frame-${product.id}`}
        >
          {product.desktopImageSrc ? (
            <source media="(min-width: 1280px)" srcSet={product.desktopImageSrc} />
          ) : null}
          <img
            className="size-full object-contain"
            src={product.imageSrc}
            alt={product.imageAlt}
            width={product.imageWidth}
            height={product.imageHeight}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
          />
        </picture>
      </div>

      <div
        className={[
          'flex min-w-0 flex-1 flex-col xl:min-h-0 xl:flex-none',
          hasColorOptions ? 'xl:self-stretch' : 'xl:self-center',
          layout.desktopContentWidthClassName ?? 'xl:w-[205px]',
        ].join(' ')}
        data-testid={`product-content-${product.id}`}
      >
        <h3
          id={`product-title-${product.id}`}
          className="text-xl font-semibold leading-tight text-copy md:text-base md:leading-none md:tracking-[0.6px] lg:text-sm lg:tracking-[0.4px] xl:text-base xl:tracking-[0.6px]"
        >
          {product.title}
        </h3>

        <p
          className="mt-2 text-sm leading-6 text-muted md:mt-[5px] md:text-xs md:leading-[1.3] md:tracking-[0.6px] lg:mt-1 lg:text-[10px] lg:leading-[1.4] lg:tracking-[0.3px] xl:mt-[5px] xl:text-xs xl:leading-[1.3] xl:tracking-[0.6px]"
          data-testid={`product-description-${product.id}`}
        >
          {product.description}{' '}
          <button
            type="button"
            className="inline min-h-11 rounded text-sm font-medium text-brand underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 md:min-h-0 md:text-xs lg:text-[10px] xl:text-xs"
            onClick={() => onLearnMore(product.id)}
          >
            Learn More
          </button>
        </p>

        <VariantSelector
          productId={product.id}
          productName={product.title}
          variants={product.variants}
          activeSku={product.activeSku}
          isProductSelected={isSelected}
          onChange={(sku) => onVariantChange(product.id, sku)}
        />

        <div
          className={[
            'mt-auto flex flex-wrap items-end justify-between gap-4 pt-6 md:mt-0 md:flex-nowrap md:gap-2 md:pt-[10px]',
            hasColorOptions ? 'xl:mt-auto' : 'xl:mt-0',
          ].join(' ')}
          data-testid={`product-controls-${product.id}`}
        >
          {product.control === 'quantity' ? (
            <QuantityStepper
              label={quantityLabel}
              quantity={activeQuantity}
              onChange={(quantity) => onQuantityChange(product.activeSku, quantity)}
              testId={`quantity-${product.activeSku}`}
            />
          ) : null}

          {product.control === 'binary' ? (
            <button
              type="button"
              className="min-h-11 rounded border border-brand px-4 text-sm font-semibold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              aria-pressed={activeQuantity > 0}
              onClick={() => onQuantityChange(product.activeSku, activeQuantity > 0 ? 0 : 1)}
            >
              {activeQuantity > 0 ? 'Remove' : 'Add to system'}
            </button>
          ) : null}

          {product.control === 'locked' ? (
            <div className="flex min-h-11 items-center gap-2 rounded bg-gray-200 px-4 text-sm font-medium text-gray-700">
              <LockKeyhole aria-hidden="true" size={16} />
              Included
            </div>
          ) : null}

          <div
            className="ml-auto text-right text-base leading-none tracking-[0.6px] text-muted lg:text-xs xl:text-base"
          >
            {activeVariant.compareAtCents !== undefined &&
            activeVariant.compareAtCents > activeVariant.currentCents ? (
              <span
                className="block text-sm text-danger line-through lg:text-xs xl:text-base"
                data-figma-contrast-exception="compare-price"
              >
                {formatCurrency(activeVariant.compareAtCents)}
              </span>
            ) : null}
            <span className="block font-normal lg:text-xs xl:text-base">
              {activeVariant.currentCents === 0
                ? 'FREE'
                : formatCurrency(activeVariant.currentCents)}
              {activeVariant.suffix ? activeVariant.suffix : null}
            </span>
          </div>
        </div>

        {product.helperText ? <p className="sr-only">{product.helperText}</p> : null}
      </div>
    </article>
  )
}
