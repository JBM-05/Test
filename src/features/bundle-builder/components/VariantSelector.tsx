import { Check } from 'lucide-react'

import type { VariantViewModel } from './ui-types'

interface VariantSelectorProps {
  productId: string
  productName: string
  variants: readonly VariantViewModel[]
  activeSku: string
  onChange: (sku: string) => void
}

export function VariantSelector({
  productId,
  productName,
  variants,
  activeSku,
  onChange,
}: VariantSelectorProps) {
  if (variants.length <= 1) {
    return null
  }

  return (
    <fieldset className="mt-5 xl:mt-1.5">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#6f6a75] xl:sr-only">
        Color
      </legend>
      <div className="flex flex-wrap gap-2 xl:gap-1" role="radiogroup">
        {variants.map((variant) => {
          const isActive = variant.sku === activeSku

          return (
            <label
              key={variant.sku}
              className={[
                'relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border bg-white px-3 py-2 text-sm font-medium transition-[border-color,box-shadow,background-color] has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#5130d7] has-[:focus-visible]:ring-offset-2 xl:min-h-7 xl:gap-1 xl:rounded-sm xl:px-2 xl:py-1 xl:text-[9px]',
                isActive
                  ? 'border-[#00a88f] bg-[#effbf8] text-[#007f6d] shadow-[0_0_0_1px_#00a88f]'
                  : 'border-[#d9d6de] text-[#4d4853] hover:border-[#9a92a2]',
              ].join(' ')}
            >
              <input
                className="sr-only"
                type="radio"
                name={`variant-${productId}`}
                value={variant.sku}
                checked={isActive}
                onChange={() => onChange(variant.sku)}
                aria-label={`${productName}, ${variant.label}`}
              />
              {variant.imageSrc ? (
                <span className="size-5 overflow-hidden rounded-full border border-black/10 bg-white xl:size-4">
                  <img
                    className="size-full object-cover"
                    src={variant.imageSrc}
                    alt=""
                    width={20}
                    height={20}
                  />
                </span>
              ) : (
                <span
                  className="size-5 rounded-full border border-black/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)] xl:size-4"
                  style={{ backgroundColor: variant.swatch ?? '#e9e7ec' }}
                  aria-hidden="true"
                />
              )}
              <span>{variant.label}</span>
              {isActive ? (
                <Check aria-hidden="true" className="text-[#008c78] xl:hidden" size={15} strokeWidth={2.5} />
              ) : null}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
