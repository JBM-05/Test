import {
  Check,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Truck,
  WalletCards,
} from 'lucide-react'
import type { Ref } from 'react'
import { useRef } from 'react'

import { formatCurrency } from './format'
import { gsap, useGSAP } from './motion'
import { QuantityStepper } from './QuantityStepper'
import { SaveStatus, type SaveState } from './SaveStatus'
import type { ReviewGroupViewModel, ReviewLineViewModel } from './ui-types'

interface ReviewTotalsViewModel {
  totalCents: number
  compareAtCents: number
  savingsCents: number
  shippingCents: number
  shippingCompareAtCents?: number
}

interface ReviewCopyViewModel {
  description: string
  shippingLabel: string
  freeShippingLabel: string
  guaranteeTitle: string
  guaranteeDescription: string
  financingDescription: string
}

interface ReviewPanelProps {
  groups: readonly ReviewGroupViewModel[]
  totals: ReviewTotalsViewModel
  copy: ReviewCopyViewModel
  saveState: SaveState
  panelRef?: Ref<HTMLElement>
  onQuantityChange: (sku: string, quantity: number) => void
  onCheckout: () => void
  onSave: () => void
}

interface ReviewLineProps {
  line: ReviewLineViewModel
  onQuantityChange: (sku: string, quantity: number) => void
  onRemovedWhileFocused: () => void
}

function ReviewLine({
  line,
  onQuantityChange,
  onRemovedWhileFocused,
}: ReviewLineProps) {
  const rowRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (!rowRef.current) return

      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(rowRef.current, { opacity: 1, y: 0 })
      })
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          rowRef.current,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.26, ease: 'power2.out' },
        )
      })

      return () => media.revert()
    },
    { scope: rowRef },
  )

  const accessibleName = line.variantLabel
    ? `${line.name}, ${line.variantLabel}`
    : line.name
  const priceSuffix = line.suffix ? ` ${line.suffix}` : ''

  function updateQuantity(quantity: number) {
    const shouldRestoreFocus =
      quantity === 0 && rowRef.current?.contains(document.activeElement)
    onQuantityChange(line.sku, quantity)

    if (shouldRestoreFocus) {
      requestAnimationFrame(onRemovedWhileFocused)
    }
  }

  return (
    <article ref={rowRef} className="py-0" aria-label={accessibleName}>
      <div className="flex gap-3 xl:gap-2">
        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#f5f4f6] p-1 xl:size-10">
          <img
            className="max-h-full max-w-full object-contain"
            src={line.imageSrc}
            alt={line.imageAlt}
            width={64}
            height={64}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="flex min-h-11 items-center justify-between gap-2 xl:min-h-10">
            <div className="min-w-0 min-[380px]:pr-[116px] xl:pr-[78px]">
              <h4 className="text-[11px] font-bold leading-4 text-[#211e25]">{line.name}</h4>
              {line.variantLabel ? (
                <p className="text-[9px] text-[#625b68]">{line.variantLabel}</p>
              ) : null}
            </div>
            <p className="shrink-0 text-right text-[11px] font-bold text-[#5630c4]">
              {line.compareAtCents !== undefined && line.compareAtCents > line.currentCents ? (
                <span className="block text-[9px] font-medium text-[#625a67] line-through">
                  {formatCurrency(line.compareAtCents)}
                </span>
              ) : null}
              {line.currentCents === 0 ? 'FREE' : formatCurrency(line.currentCents)}
              {priceSuffix ? (
                <span className="block text-[9px] font-medium text-[#625b68]">{priceSuffix}</span>
              ) : null}
            </p>
          </div>

          <div className="mt-1 flex min-h-11 items-center justify-end gap-2 min-[380px]:absolute min-[380px]:right-[58px] min-[380px]:top-1/2 min-[380px]:mt-0 min-[380px]:-translate-y-1/2 xl:right-[54px] xl:min-h-7">
            {line.control === 'quantity' ? (
              <QuantityStepper
                label={accessibleName}
                quantity={line.quantity}
                onChange={updateQuantity}
                size="compact"
                testId={`review-quantity-${line.sku}`}
              />
            ) : null}

            {line.control === 'binary' ? (
              <button
                type="button"
                className="min-h-11 rounded-full border border-[#d8d4dc] px-4 text-xs font-bold text-[#514a57] transition-colors hover:border-[#958d9b] hover:bg-[#f7f5f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5130d7] focus-visible:ring-offset-2 xl:min-h-7 xl:px-2 xl:text-[9px]"
                onClick={() => updateQuantity(0)}
                aria-label={`Remove ${accessibleName} from system`}
                aria-pressed={true}
              >
                Remove
              </button>
            ) : null}

            {line.control === 'locked' ? (
              <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#f2f0f4] px-3 text-xs font-semibold text-[#615a66] xl:min-h-7 xl:px-2 xl:text-[9px]">
                <LockKeyhole aria-hidden="true" size={14} />
                Required
              </span>
            ) : null}
          </div>

          {line.helperText ? (
            <p className="sr-only">{line.helperText}</p>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function AnimatedTotal({ cents }: { cents: number }) {
  const totalRef = useRef<HTMLParagraphElement>(null)

  useGSAP(
    () => {
      if (!totalRef.current) return

      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(totalRef.current, { opacity: 1, scale: 1 })
      })
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          totalRef.current,
          { opacity: 0.62, scale: 0.985 },
          { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' },
        )
      })

      return () => media.revert()
    },
    { dependencies: [cents], scope: totalRef },
  )

  return (
    <p
      ref={totalRef}
      className="text-[28px] font-extrabold tracking-[-0.035em] text-[#5630c4] xl:text-[22px]"
      data-testid="bundle-total"
    >
      {formatCurrency(cents)}
    </p>
  )
}

export function ReviewPanel({
  groups,
  totals,
  copy,
  saveState,
  panelRef,
  onQuantityChange,
  onCheckout,
  onSave,
}: ReviewPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const hasItems = groups.some((group) => group.lines.length > 0)
  const hasSavings = totals.savingsCents > 0

  return (
    <aside
      ref={panelRef}
      className="rounded-none border border-x-0 border-[#d9dce4] bg-[#eef4ff] p-4 shadow-none sm:rounded-xl sm:border-x sm:p-5 sm:shadow-[0_10px_28px_rgba(34,45,74,0.08)] xl:sticky xl:top-6 xl:rounded-md xl:p-4 xl:shadow-none"
      aria-label="Review your system"
      data-testid="review-panel"
    >
      <div className="flex items-start border-b border-[#e9e6eb] pb-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#615a66] xl:text-[8px]">
            Review your bundle
          </p>
          <h2
            ref={headingRef}
            id="review-title"
            className="text-xl font-bold tracking-[-0.02em] text-[#211e25] outline-none xl:text-base"
            tabIndex={-1}
          >
            Your security system
          </h2>
          <p className="mt-1 max-w-[320px] text-[10px] leading-4 text-[#625b68] xl:text-[9px] xl:leading-3.5">
            {copy.description}
          </p>
        </div>
      </div>

      {hasItems ? (
        <div className="divide-y divide-[#eeebef]">
          {groups
            .filter((group) => group.lines.length > 0)
            .map((group) => (
              <section key={group.id} className="py-0" aria-labelledby={`review-group-${group.id}`}>
                <h3
                  id={`review-group-${group.id}`}
                  className="pt-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#5f5866] xl:text-[8px]"
                >
                  {group.label}
                </h3>
                <ul className="divide-y divide-[#f0edf1]" role="list">
                  {group.lines.map((line) => (
                    <li key={line.sku}>
                      <ReviewLine
                        line={line}
                        onQuantityChange={onQuantityChange}
                        onRemovedWhileFocused={() => headingRef.current?.focus()}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center px-5 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-[#f1ecff] text-[#6033d8]">
            <Sparkles aria-hidden="true" size={21} />
          </span>
          <h3 className="mt-4 text-base font-bold text-[#211e25]">Your system is ready to build</h3>
          <p className="mt-1 max-w-[260px] text-sm leading-6 text-[#716b75]">
            Add a product from any step and it will appear here instantly.
          </p>
        </div>
      )}

      <div className="border-t border-[#e9e6eb] pt-3">
        <div className="flex items-center justify-between gap-4 text-sm xl:text-[11px]">
          <span className="flex items-center gap-2 font-medium text-[#504a55]">
            <Truck aria-hidden="true" size={17} />
            {copy.shippingLabel}
          </span>
          <span className="text-right font-bold text-[#0b6b3e]">
            {totals.shippingCompareAtCents !== undefined &&
            totals.shippingCompareAtCents > totals.shippingCents ? (
              <span className="block text-[10px] font-medium text-[#665e6a] line-through">
                {formatCurrency(totals.shippingCompareAtCents)}
              </span>
            ) : null}
            <span>
              {totals.shippingCents === 0
                ? copy.freeShippingLabel
                : formatCurrency(totals.shippingCents)}
            </span>
          </span>
        </div>
        <div className="mt-2 flex items-start gap-2 rounded-md bg-[#f5f2fc] p-2">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#6033d8]" size={20} />
          <p className="text-[10px] leading-4 text-[#5e5765] xl:text-[9px] xl:leading-3.5">
            <strong className="font-bold text-[#302a35]">{copy.guaranteeTitle}.</strong>{' '}
            <span className="xl:hidden">{copy.guaranteeDescription}</span>
          </p>
        </div>
        <p className="mt-2 flex items-center gap-2 text-[10px] leading-4 text-[#716b75] xl:text-[9px]">
          <WalletCards aria-hidden="true" className="shrink-0" size={17} />
          {copy.financingDescription}
        </p>
      </div>

      <div className="mt-3 border-t border-[#e9e6eb] pt-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#3e3844] xl:text-xs">Total</p>
            {totals.compareAtCents > totals.totalCents ? (
              <p className="mt-0.5 text-sm text-[#665e6a] line-through xl:text-xs">
                {formatCurrency(totals.compareAtCents)}
              </p>
            ) : null}
          </div>
          <AnimatedTotal cents={totals.totalCents} />
        </div>

        {hasSavings ? (
          <p className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-[#e1f8f3] px-3 py-1 text-[10px] font-bold text-[#006b5c] xl:text-[9px]">
            <Check aria-hidden="true" size={15} strokeWidth={2.6} />
            You save {formatCurrency(totals.savingsCents)}
          </p>
        ) : null}

        <button
          type="button"
          className="mt-2 min-h-12 w-full rounded-sm bg-[#6436e8] px-6 text-sm font-bold text-white shadow-[0_8px_18px_rgba(100,54,232,0.2)] transition-[background-color,transform,box-shadow] hover:bg-[#5428d2] hover:shadow-[0_10px_22px_rgba(100,54,232,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5130d7] focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#c8c3ce] disabled:shadow-none xl:min-h-10 xl:text-xs"
          onClick={onCheckout}
          disabled={!hasItems}
        >
          Checkout
        </button>
        <button
          type="button"
          className="mx-auto mt-1 inline-flex min-h-11 w-full items-center justify-center rounded px-1 text-sm font-bold text-[#5630c4] underline decoration-[#a99bce] underline-offset-4 hover:text-[#3f1e9b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5130d7] xl:min-h-7 xl:text-[9px]"
          onClick={onSave}
        >
          Save my system for later
        </button>
        <SaveStatus state={saveState} />
      </div>
    </aside>
  )
}
