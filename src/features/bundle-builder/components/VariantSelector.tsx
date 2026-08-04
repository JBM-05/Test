import type { VariantViewModel } from '../view-models'

interface VariantSelectorProps {
  productId: string
  productName: string
  variants: readonly VariantViewModel[]
  activeSku: string
  isProductSelected: boolean
  onChange: (sku: string) => void
}

export function VariantSelector({
  productId,
  productName,
  variants,
  activeSku,
  isProductSelected,
  onChange,
}: VariantSelectorProps) {
  if (variants.length <= 1) {
    return null
  }

  return (
    <fieldset
      className="mt-5 xl:mt-[13px]"
      data-testid={`variant-selector-${productId}`}
    >
      <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#6f6a75] xl:sr-only">
        Color
      </legend>
      <div className="flex flex-wrap gap-2 xl:gap-[6px]" role="radiogroup">
        {variants.map((variant) => {
          const isActive = variant.sku === activeSku
          const isVisuallySelected = isActive && isProductSelected

          return (
            <label
              key={variant.sku}
              className={[
                'relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium text-[#1f1f1f] has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand has-[:focus-visible]:ring-offset-2 xl:h-[26px] xl:min-h-[26px] xl:gap-0 xl:rounded-[2px] xl:border-[0.5px] xl:py-px xl:text-[10px] xl:tracking-[0.6px]',
                isVisuallySelected
                  ? 'border-[#0aa288] bg-[#f6fffc] xl:border-[rgba(10,162,136,0.5)] xl:px-[3px]'
                  : 'border-[#cccccc] bg-white xl:border-[rgba(204,204,204,0.5)] xl:px-[5px]',
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
                <span
                  className="size-5 overflow-hidden rounded-full bg-white xl:rounded-[5px]"
                  style={{
                    width: variant.imageWidth ?? 22,
                    height: variant.imageHeight ?? 22,
                  }}
                >
                  <img
                    className="size-full object-cover"
                    src={variant.imageSrc}
                    alt=""
                    width={variant.imageWidth ?? 22}
                    height={variant.imageHeight ?? 22}
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
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
