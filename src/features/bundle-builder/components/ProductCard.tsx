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

const DESKTOP_IMAGE_HEIGHT: Readonly<Record<string, string>> = {
  'cam-v4': 'xl:h-[137px]',
  'cam-pan-v3': 'xl:h-[137px]',
  'floodlight-v2': 'xl:h-[151px]',
  'duo-cam-doorbell': 'xl:h-[151px]',
  'battery-cam-pro': 'xl:h-[143px]',
}

const DESKTOP_IMAGE_WIDTH: Readonly<Record<string, string>> = {
  'floodlight-v2': 'xl:w-[100px]',
}

const DESKTOP_CONTENT_WIDTH: Readonly<Record<string, string>> = {
  'cam-v4': 'xl:w-[219.5px]',
}

const DESKTOP_GAP_CLASS: Readonly<Record<string, string>> = {
  'cam-v4': 'xl:gap-[19px]',
  'cam-pan-v3': 'xl:gap-[19px]',
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
        'relative flex min-w-0 flex-col overflow-hidden rounded-[10px] bg-white p-4 sm:p-5 xl:h-full xl:flex-row xl:items-center xl:p-[11px]',
        DESKTOP_GAP_CLASS[product.id] ?? 'xl:gap-[13px]',
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
          data-visual-exception={product.id === 'cam-pan-v3' ? 'cam-pan-badge' : undefined}
        >
          {product.badge}
        </span>
      ) : null}

      <div
        className={[
          'mx-auto flex h-44 w-full max-w-[240px] shrink-0 items-center justify-center sm:h-48 xl:mx-0 xl:max-w-none',
          DESKTOP_IMAGE_WIDTH[product.id] ?? 'xl:w-[101px]',
          DESKTOP_IMAGE_HEIGHT[product.id] ?? 'xl:h-[137px]',
        ].join(' ')}
      >
        <picture className="block size-full">
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
          DESKTOP_CONTENT_WIDTH[product.id] ?? 'xl:w-[205px]',
        ].join(' ')}
        data-testid={`product-content-${product.id}`}
      >
        <h3
          id={`product-title-${product.id}`}
          className="text-xl font-semibold leading-tight text-copy xl:text-base xl:leading-none xl:tracking-[0.6px]"
        >
          {product.title}
        </h3>

        <p
          className="mt-2 text-sm leading-6 text-muted xl:mt-[5px] xl:text-xs xl:leading-[1.3] xl:tracking-[0.6px]"
          data-testid={`product-description-${product.id}`}
        >
          {product.description}{' '}
          <button
            type="button"
            className="inline min-h-11 rounded text-sm font-medium text-brand underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 xl:min-h-0 xl:text-xs"
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
            'mt-auto flex flex-wrap items-end justify-between gap-4 pt-6 xl:flex-nowrap xl:gap-2 xl:pt-[10px]',
            hasColorOptions ? '' : 'xl:mt-0',
          ].join(' ')}
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
            className="ml-auto text-right text-base leading-none tracking-[0.6px] text-muted"
            data-visual-exception={product.id === 'cam-pan-v3' ? 'cam-pan-price' : undefined}
          >
            {activeVariant.compareAtCents !== undefined &&
            activeVariant.compareAtCents > activeVariant.currentCents ? (
              <span
                className="block text-sm text-danger line-through xl:text-base"
                data-figma-contrast-exception="compare-price"
              >
                {formatCurrency(activeVariant.compareAtCents)}
              </span>
            ) : null}
            <span className="block font-normal xl:text-base">
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
