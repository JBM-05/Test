import { Minus, Plus } from 'lucide-react'

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
  const buttonClassName =
    size === 'compact'
      ? 'flex size-[45px] shrink-0 items-center justify-center rounded-full text-[#28252d] transition-colors hover:bg-[#f1eff5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5130d7] disabled:cursor-not-allowed disabled:text-[#b8b5bd] disabled:hover:bg-transparent sm:size-11 lg:size-9 xl:size-7 xl:rounded-md xl:border xl:border-[#e2e1e4] xl:bg-white'
      : 'flex size-[45px] shrink-0 items-center justify-center rounded-full text-[#28252d] transition-colors hover:bg-[#f1eff5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5130d7] disabled:cursor-not-allowed disabled:text-[#b8b5bd] disabled:hover:bg-transparent sm:size-11 xl:size-7 xl:rounded-md xl:border xl:border-[#e2e1e4] xl:bg-white'

  return (
    <div
      className="inline-flex min-h-11 items-center rounded-full border border-[#d9d6de] bg-white p-0.5 shadow-[0_1px_1px_rgba(20,16,28,0.03)] xl:min-h-7 xl:gap-1 xl:rounded-none xl:border-0 xl:bg-transparent xl:p-0 xl:shadow-none"
      role="group"
      aria-label={`${label} quantity`}
    >
      <button
        type="button"
        className={buttonClassName}
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={!canDecrease}
        aria-label={`Decrease ${label}`}
      >
        <Minus aria-hidden="true" size={16} strokeWidth={2.25} />
      </button>
      <output
        className="min-w-7 select-none text-center text-sm font-semibold tabular-nums text-[#1c1921] xl:min-w-4 xl:text-xs"
        aria-live="polite"
        aria-label={`${label} quantity: ${quantity}`}
        data-testid={testId}
      >
        {quantity}
      </output>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={!canIncrease}
        aria-label={`Increase ${label}`}
      >
        <Plus aria-hidden="true" size={16} strokeWidth={2.25} />
      </button>
    </div>
  )
}
