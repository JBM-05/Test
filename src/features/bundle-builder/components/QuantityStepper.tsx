import { bundleBuilderAssets } from './assets'

interface QuantityStepperProps {
  label: string
  quantity: number
  onChange: (quantity: number) => void
  disabled?: boolean
  min?: number
  max?: number
  size?: 'compact' | 'default'
  testId?: string
}

interface QuantityButtonProps {
  type: 'minus' | 'plus'
  label: string
  disabled: boolean
  compact: boolean
  onClick: () => void
}

function QuantityButton({
  type,
  label,
  disabled,
  compact,
  onClick,
}: QuantityButtonProps) {
  const isMinus = type === 'minus'
  const source = compact
    ? disabled
      ? isMinus
        ? bundleBuilderAssets.quantity.minusDisabled
        : bundleBuilderAssets.quantity.plusDisabled
      : isMinus
        ? bundleBuilderAssets.quantity.minus
        : bundleBuilderAssets.quantity.plus
    : disabled
      ? isMinus
        ? bundleBuilderAssets.quantity.cardMinusMuted
        : bundleBuilderAssets.quantity.cardPlusMuted
      : isMinus
        ? bundleBuilderAssets.quantity.cardMinus
        : bundleBuilderAssets.quantity.cardPlus

  return (
    <button
      type="button"
      className={[
        'absolute top-[-8px] z-10 flex size-11 items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 disabled:cursor-not-allowed xl:top-0 xl:size-7',
        isMinus ? 'left-[-12px] xl:left-[-4px]' : 'right-[-12px] xl:right-[-4px]',
      ].join(' ')}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <span
        className={[
          'flex size-5 items-center justify-center rounded-[4px]',
          compact
            ? disabled
              ? 'border border-gray-400 bg-[#f1f1f2]'
              : 'bg-white'
            : disabled
              ? 'border-2 border-gray-200 bg-gray-200'
              : isMinus
                ? 'border-2 border-gray-300 bg-white'
                : 'bg-gray-200',
        ].join(' ')}
        aria-hidden="true"
        data-control-surface={compact ? 'compact' : 'default'}
      >
        <img className="size-2 object-contain" src={source} alt="" />
      </span>
    </button>
  )
}

export function QuantityStepper({
  label,
  quantity,
  onChange,
  disabled = false,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  size = 'default',
  testId,
}: QuantityStepperProps) {
  const canDecrease = !disabled && quantity > min
  const canIncrease = !disabled && quantity < max
  const compact = size === 'compact'

  return (
    <div
      className={[
        'relative h-7 shrink-0',
        compact ? 'w-[72px]' : 'w-20',
      ].join(' ')}
      role="group"
      aria-label={`${label} quantity`}
    >
      <QuantityButton
        type="minus"
        label={`Decrease ${label}`}
        disabled={!canDecrease}
        compact={compact}
        onClick={() => onChange(Math.max(min, quantity - 1))}
      />

      <output
        className={[
          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-center font-medium tabular-nums text-ink',
          compact ? 'text-sm leading-4' : 'text-base leading-5',
        ].join(' ')}
        aria-live="polite"
        aria-label={`${label} quantity: ${quantity}`}
        data-testid={testId}
      >
        {quantity}
      </output>

      <QuantityButton
        type="plus"
        label={`Increase ${label}`}
        disabled={!canIncrease}
        compact={compact}
        onClick={() => onChange(Math.min(max, quantity + 1))}
      />
    </div>
  )
}
