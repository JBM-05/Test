import type { Ref } from 'react'
import { useRef } from 'react'

import { formatCurrency } from '../formatting/currency'
import type {
  ReviewGroupViewModel,
  ReviewLineViewModel,
  ReviewTotalsViewModel,
  SaveState,
} from '../view-models'
import { bundleBuilderAssets } from './assets'
import { gsap, useGSAP } from './motion'
import { QuantityStepper } from './QuantityStepper'
import { SaveStatus } from './SaveStatus'

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

function LinePrice({ line }: { line: ReviewLineViewModel }) {
  return (
    <div className="flex shrink-0 flex-col items-end justify-center text-right text-xs leading-4 tracking-[0.06px] xl:text-sm">
      {line.compareAtCents !== undefined && line.compareAtCents > line.currentCents ? (
        <span className="font-medium text-gray-600 line-through">
          {formatCurrency(line.compareAtCents)}
          {line.suffix ?? ''}
        </span>
      ) : null}
      <span className="font-semibold text-brand">
        {line.currentCents === 0 ? 'FREE' : formatCurrency(line.currentCents)}
        {line.suffix ?? ''}
      </span>
    </div>
  )
}

function ReviewLine({
  line,
  onQuantityChange,
  onRemovedWhileFocused,
}: ReviewLineProps) {
  const rowRef = useRef<HTMLElement>(null)
  const displayName = line.control === 'locked' ? `${line.name} (Required)` : line.name
  const accessibleName = line.variantLabel
    ? `${displayName}, ${line.variantLabel}`
    : displayName

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

  function updateQuantity(quantity: number) {
    const shouldRestoreFocus =
      quantity === 0 && rowRef.current?.contains(document.activeElement)
    onQuantityChange(line.sku, quantity)

    if (shouldRestoreFocus) requestAnimationFrame(onRemovedWhileFocused)
  }

  return (
    <article
      ref={rowRef}
      className="flex w-full items-start gap-4"
      aria-label={accessibleName}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={[
            'flex w-[41px] shrink-0 items-center justify-center overflow-hidden rounded-[5px] bg-white',
            line.sku === 'sense-hub' ? 'h-10' : 'h-[41px]',
          ].join(' ')}
        >
          <img
            className="size-full object-contain"
            src={line.imageSrc}
            alt={line.imageAlt}
            width={41}
            height={41}
            loading="lazy"
            decoding="async"
          />
        </div>

        <p
          className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-normal leading-4 tracking-0 text-ink xl:overflow-visible xl:text-clip xl:whitespace-normal xl:text-sm xl:font-medium xl:tracking-[0.07px]"
          data-testid="review-line-name"
        >
          {displayName}
          {line.variantLabel ? <span className="sr-only">, {line.variantLabel}</span> : null}
        </p>

        {line.control === 'quantity' || line.control === 'locked' ? (
          <QuantityStepper
            label={accessibleName}
            quantity={line.quantity}
            onChange={updateQuantity}
            disabled={line.control === 'locked'}
            size="compact"
            testId={`review-quantity-${line.sku}`}
          />
        ) : null}
      </div>

      <LinePrice line={line} />
      {line.helperText ? <p className="sr-only">{line.helperText}</p> : null}
    </article>
  )
}

function PlanLine({ line }: { line: ReviewLineViewModel }) {
  return (
    <article className="flex w-full items-start justify-between gap-4" aria-label={line.name}>
      <div className="flex min-w-0 items-center gap-[3px]">
        <img
          className="h-[17px] w-[14px] shrink-0 object-contain xl:h-[23.704px] xl:w-5"
          src={bundleBuilderAssets.review.planShield}
          alt=""
        />
        <p className="text-sm font-bold leading-4 text-black">
          Cam <span className="text-brand">Unlimited</span>
        </p>
      </div>
      <LinePrice line={line} />
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
      className="text-right text-2xl font-bold leading-8 tracking-[-0.03px] text-brand"
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
      className="flex h-[846px] w-full flex-col items-start bg-panel pt-[15px] xl:sticky xl:top-[49.36px] xl:h-[855px] xl:w-[399px] xl:rounded-[10px]"
      aria-label="Review your system"
      data-testid="review-panel"
    >
      <div className="flex w-full flex-col gap-[5px]">
        <div className="flex h-[10px] w-full items-center px-[15px] xl:h-3">
          <span className="text-[10px] font-medium uppercase leading-none tracking-[1.6px] text-[#484848] xl:text-xs">
            Review
          </span>
        </div>

        <div
          className="flex h-[816px] w-full flex-col items-start gap-[10px] overflow-x-hidden overflow-y-auto bg-panel px-5 pb-[31px] pt-5 overscroll-contain xl:h-[823px] xl:w-[390px]"
          data-testid="review-scroll-region"
        >
          <div className="flex w-full flex-col items-start gap-[5px] tracking-[0.6px]">
            <h2
              ref={headingRef}
              id="review-title"
              className="text-[22px] font-semibold leading-none text-copy outline-none"
              tabIndex={-1}
            >
              Your security system
            </h2>
            <p className="w-full text-xs font-medium leading-4 text-[rgba(31,31,31,0.75)] xl:text-sm xl:leading-[1.3]">
              {copy.description}
            </p>
          </div>

          {hasItems ? (
            <div className="flex w-full flex-col items-start gap-[10px]">
              {groups
                .filter((group) => group.lines.length > 0)
                .map((group) => (
                  <section
                    key={group.id}
                    className="relative flex w-full flex-col items-start gap-2 pt-[15px] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gray-400 before:content-[''] xl:before:-top-px xl:before:h-0.5 xl:before:border-b xl:before:border-[#e1e8f2] xl:before:bg-[#dae1ea]"
                    aria-labelledby={`review-group-${group.id}`}
                  >
                    <h3
                      id={`review-group-${group.id}`}
                      className="text-xs font-normal uppercase leading-4 tracking-[0.36px] text-gray-500"
                      data-figma-contrast-exception="review-category"
                    >
                      {group.id === 'plan' ? (
                        <>
                          <span className="xl:hidden">Home monitoring plan</span>
                          <span className="hidden xl:inline">Plan</span>
                        </>
                      ) : (
                        group.label
                      )}
                    </h3>
                    <div
                      className={[
                        'flex w-full flex-col items-start',
                        group.id === 'sensors' ? 'gap-2' : 'gap-3',
                      ].join(' ')}
                      role="list"
                    >
                      {group.lines.map((line) => (
                        <div key={line.sku} className="w-full" role="listitem">
                          {group.id === 'plan' ? (
                            <PlanLine line={line} />
                          ) : (
                            <ReviewLine
                              line={line}
                              onQuantityChange={onQuantityChange}
                              onRemovedWhileFocused={() => headingRef.current?.focus()}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          ) : (
            <div className="border-t border-gray-400 py-10 text-center">
              <p className="font-semibold text-copy">Your system is ready to build</p>
              <p className="mt-1 text-sm text-muted">Add a product and it will appear here.</p>
            </div>
          )}

          <div className="relative flex w-full flex-col items-start pt-[15px] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gray-400 before:content-[''] xl:before:-top-px xl:before:h-0.5 xl:before:border-b xl:before:border-[#e1e8f2] xl:before:bg-[#dae1ea]">
            <div className="flex w-full items-center gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex size-[41px] shrink-0 items-center justify-center rounded-[5px] bg-white">
                  <img
                    className="size-[29px] object-contain"
                    src={bundleBuilderAssets.review.delivery}
                    alt=""
                  />
                </span>
                <span className="text-xs font-medium leading-4 text-ink xl:text-sm">
                  {copy.shippingLabel}
                </span>
              </div>
              <div className="flex flex-col items-end text-xs leading-4 xl:text-sm">
                {totals.shippingCompareAtCents !== undefined &&
                totals.shippingCompareAtCents > totals.shippingCents ? (
                  <span className="font-medium text-gray-600 line-through">
                    {formatCurrency(totals.shippingCompareAtCents)}
                  </span>
                ) : null}
                <span className="font-semibold text-brand">
                  {totals.shippingCents === 0
                    ? copy.freeShippingLabel
                    : formatCurrency(totals.shippingCents)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-2">
            <div className="flex w-full flex-col items-start">
              <div className="flex w-full flex-col items-start gap-1">
                <div className="flex w-full items-center justify-between">
                  <img
                    className="size-[78px] shrink-0 object-cover"
                    src={bundleBuilderAssets.review.satisfactionBadge}
                    alt={`${copy.guaranteeTitle}. ${copy.guaranteeDescription}`}
                  />
                  <div className="flex self-stretch items-center">
                    <div className="flex h-full flex-col items-end justify-center gap-2">
                      <span className="inline-flex h-[18px] items-center justify-center rounded-[3px] bg-brand px-2 text-xs font-medium leading-normal tracking-[-0.6px] text-white">
                        {copy.financingDescription}
                      </span>
                      <div className="flex items-baseline gap-2 whitespace-nowrap">
                        {totals.compareAtCents > totals.totalCents ? (
                          <span
                            className="text-lg font-medium leading-5 tracking-[0.045px] text-gray-600 line-through"
                            data-figma-contrast-exception="compare-total"
                          >
                            {formatCurrency(totals.compareAtCents)}
                          </span>
                        ) : null}
                        <AnimatedTotal cents={totals.totalCents} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex w-full flex-col items-start gap-1 pt-[10px]">
                  {hasSavings ? (
                    <p
                      className="w-full text-center text-xs font-semibold leading-none tracking-[-0.056px] text-success"
                      data-figma-contrast-exception="savings"
                    >
                      Congrats! You’re saving {formatCurrency(totals.savingsCents)} on your security bundle!
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className="font-checkout flex h-12 w-full items-center justify-center rounded-[4px] bg-brand px-4 text-[17px] font-bold leading-normal text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
                    onClick={onCheckout}
                    disabled={!hasItems}
                  >
                    Checkout
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="relative w-full text-center text-xs font-normal italic leading-[1.2] tracking-[-0.016px] text-[#484848] underline before:absolute before:-inset-y-3 before:inset-x-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand xl:text-sm"
              onClick={onSave}
            >
              Save my system for later
            </button>
            <SaveStatus state={saveState} />
          </div>
        </div>
      </div>
    </aside>
  )
}
