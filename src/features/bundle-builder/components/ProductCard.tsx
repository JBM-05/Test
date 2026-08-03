import { Check, LockKeyhole } from 'lucide-react'
import { useRef } from 'react'

import { formatCurrency } from './format'
import { gsap, useGSAP } from './motion'
import { QuantityStepper } from './QuantityStepper'
import type { ProductCardViewModel } from './ui-types'
import { VariantSelector } from './VariantSelector'

interface ProductCardProps {
  product: ProductCardViewModel
  priority?: boolean
  onVariantChange: (productId: string, sku: string) => void
  onQuantityChange: (sku: string, quantity: number) => void
  onLearnMore: (productId: string) => void
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

  if (!activeVariant) {
    return null
  }

  const quantityLabel =
    product.variants.length > 1
      ? `${product.title}, ${activeVariant.label}`
      : product.title

  return (
    <article
      ref={cardRef}
      className={[
        'relative flex min-w-0 flex-col overflow-hidden rounded-[10px] border bg-white p-4 transition-[border-color,box-shadow] sm:p-5 xl:grid xl:min-h-[164px] xl:grid-cols-[112px_minmax(0,1fr)] xl:gap-3 xl:p-3',
        isSelected
          ? 'border-[#6436e8] shadow-[0_0_0_1px_#6436e8,0_8px_18px_rgba(50,29,94,0.07)]'
          : 'border-[#dedbe2] shadow-[0_4px_16px_rgba(31,26,38,0.04)] hover:border-[#bbb6c0]',
      ].join(' ')}
      aria-labelledby={`product-title-${product.id}`}
      data-selected={isSelected ? 'true' : 'false'}
    >
      <div className="flex min-h-7 items-start justify-between gap-3 xl:absolute xl:inset-x-3 xl:top-3 xl:z-10 xl:min-h-0">
        {product.badge ? (
          <span className="inline-flex rounded-full bg-[#ede6ff] px-3 py-1 text-xs font-bold text-[#5a2bc7] xl:px-2 xl:py-0.5 xl:text-[8px]">
            {product.badge}
          </span>
        ) : (
          <span aria-hidden="true" />
        )}
        {isSelected ? (
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-[#6436e8] text-white xl:hidden">
            <Check aria-hidden="true" size={16} strokeWidth={2.6} />
            <span className="sr-only">Selected</span>
          </span>
        ) : null}
      </div>

      <div className="mx-auto flex h-44 w-full max-w-[240px] items-center justify-center p-3 sm:h-48 xl:col-start-1 xl:row-start-1 xl:h-[140px] xl:max-w-none xl:self-center xl:p-2 xl:pt-7">
        <img
          className="max-h-full max-w-full object-contain"
          src={activeVariant.imageSrc ?? product.imageSrc}
          alt={activeVariant.imageAlt ?? product.imageAlt}
          width={product.imageWidth}
          height={product.imageHeight}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
        />
      </div>

      <div className="flex flex-1 flex-col xl:col-start-2 xl:row-start-1 xl:min-h-[140px]">
        <h3
          id={`product-title-${product.id}`}
          className="text-xl font-bold leading-tight tracking-[-0.02em] text-[#1d1a21] xl:text-[15px] xl:leading-5"
        >
          {product.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#69636e] xl:mt-0.5 xl:line-clamp-2 xl:text-[10px] xl:leading-[14px]">
          {product.description}
        </p>
        <button
          type="button"
          className="mt-1 inline-flex min-h-11 w-fit items-center rounded text-sm font-semibold text-[#5630c4] underline decoration-[#aa98da] underline-offset-4 hover:text-[#3f1e9b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5130d7] focus-visible:ring-offset-2 xl:min-h-0 xl:text-[10px] xl:leading-4"
          onClick={() => onLearnMore(product.id)}
        >
          Learn More
        </button>

        <VariantSelector
          productId={product.id}
          productName={product.title}
          variants={product.variants}
          activeSku={product.activeSku}
          onChange={(sku) => onVariantChange(product.id, sku)}
        />

        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-6 xl:flex-row-reverse xl:flex-nowrap xl:gap-2 xl:pt-1.5">
          <div>
            {activeVariant.compareAtCents !== undefined &&
            activeVariant.compareAtCents > activeVariant.currentCents ? (
              <span className="mr-2 text-sm text-[#bd3442] line-through xl:mr-1 xl:text-[10px]">
                {formatCurrency(activeVariant.compareAtCents)}
              </span>
            ) : null}
            <span className="text-lg font-bold tracking-[-0.01em] text-[#1d1a21] xl:text-[13px]">
              {activeVariant.currentCents === 0
                ? 'FREE'
                : formatCurrency(activeVariant.currentCents)}
            </span>
            {activeVariant.suffix ? (
              <span className="ml-1 text-sm font-medium text-[#69636e] xl:text-[10px]">
                {activeVariant.suffix}
              </span>
            ) : null}
          </div>

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
              className={[
                'min-h-11 rounded-full border px-5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5130d7] focus-visible:ring-offset-2',
                activeQuantity > 0
                  ? 'border-[#6436e8] bg-[#f4efff] text-[#4f27b5] hover:bg-[#ece3ff]'
                  : 'border-[#1d1a21] bg-[#1d1a21] text-white hover:bg-[#37313d]',
              ].join(' ')}
              aria-pressed={activeQuantity > 0}
              onClick={() => onQuantityChange(product.activeSku, activeQuantity > 0 ? 0 : 1)}
            >
              {activeQuantity > 0 ? 'Remove' : 'Add to system'}
            </button>
          ) : null}

          {product.control === 'locked' ? (
            <div className="flex min-h-11 items-center gap-2 rounded-full bg-[#f2f0f4] px-4 text-sm font-semibold text-[#5d5662]">
              <LockKeyhole aria-hidden="true" size={16} />
              Included
            </div>
          ) : null}
        </div>

        {product.helperText ? (
          <p className="mt-3 text-xs leading-5 text-[#746e79] xl:hidden">{product.helperText}</p>
        ) : null}
      </div>
    </article>
  )
}
