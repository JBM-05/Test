import type { ReactNode, Ref } from 'react'
import { useRef } from 'react'

import { bundleBuilderAssets } from './assets'
import { gsap, useGSAP } from './motion'

interface AccordionStepProps {
  stepId: string
  stepNumber: number
  totalSteps: number
  title: string
  iconSrc: string
  selectedCount: number
  isOpen: boolean
  buttonRef?: Ref<HTMLButtonElement>
  onToggle: () => void
  nextLabel?: string
  onNext?: () => void
  children: ReactNode
}

const STEP_ICON_CLASS: Readonly<Record<string, string>> = {
  cameras: 'size-5 xl:size-[26px]',
  plan: 'h-[25px] w-6 xl:h-[27px] xl:w-[26px]',
  sensors: 'size-5 xl:size-[26px]',
  accessories: 'h-5 w-5 xl:h-5 xl:w-[26px]',
}

const STEP_ICON_IMAGE_CLASS: Readonly<Record<string, string>> = {
  sensors: 'h-[21.55px] w-[21.55px] max-w-none xl:size-[26px]',
  accessories: 'h-[21.5px] w-[19.4704px] max-w-none xl:h-5 xl:w-[17.9704px]',
}

const STEP_ROW_CLASS: Readonly<Record<string, string>> = {
  cameras: 'h-[60px]',
  plan: 'h-[65px]',
  sensors: 'h-[60px]',
  accessories: 'h-[60px]',
}

const DESKTOP_COLLAPSED_STEP_ROW_CLASS: Readonly<Record<string, string>> = {
  cameras: 'xl:h-[66px]',
  plan: 'xl:h-[67px]',
  sensors: 'xl:h-[66px]',
  accessories: 'xl:h-[66px]',
}

export function AccordionStep({
  stepId,
  stepNumber,
  totalSteps,
  title,
  iconSrc,
  selectedCount,
  isOpen,
  buttonRef,
  onToggle,
  nextLabel,
  onNext,
  children,
}: AccordionStepProps) {
  const rootRef = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const headerId = `step-header-${stepId}`
  const panelId = `step-panel-${stepId}`

  useGSAP(
    () => {
      if (!panelRef.current) return

      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(panelRef.current, {
          height: isOpen ? 'auto' : 0,
          autoAlpha: isOpen ? 1 : 0,
        })
      })
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to(panelRef.current, {
          height: isOpen ? 'auto' : 0,
          autoAlpha: isOpen ? 1 : 0,
          duration: 0.34,
          ease: 'power2.inOut',
          overwrite: true,
        })
      })

      return () => media.revert()
    },
    { dependencies: [isOpen], scope: rootRef },
  )

  const selectionLabel = `${selectedCount} selected`
  const mobileCollapsedCaret = stepNumber % 2 === 0 ? 'up' : 'down'
  const caretDirection = isOpen ? 'up' : mobileCollapsedCaret
  const mobileCaretDown = caretDirection === 'down'
  const desktopCaretDown = !isOpen
  const caretRotation = mobileCaretDown
    ? desktopCaretDown
      ? 'rotate-180'
      : 'rotate-180 xl:rotate-0'
    : desktopCaretDown
      ? 'rotate-0 xl:rotate-180'
      : 'rotate-0'

  return (
    <section
      ref={rootRef}
      className={[
        'flex min-w-0 w-full flex-col gap-[5px]',
        stepNumber === 1 ? '' : 'pt-[5px] sm:pt-0',
        isOpen
          ? 'overflow-hidden bg-panel xl:rounded-[10px] xl:pt-[15px]'
          : 'overflow-visible bg-white',
      ].join(' ')}
      data-step-number={stepNumber}
    >
      <div
        className={[
          'flex h-[10px] w-full items-center px-[15px]',
          isOpen ? 'xl:h-3' : 'xl:h-[10px]',
        ].join(' ')}
      >
        <span
          className={[
            'text-[10px] font-medium uppercase leading-none tracking-[1.6px] text-[#484848]',
            isOpen ? 'xl:text-xs' : 'xl:text-[10px]',
          ].join(' ')}
        >
          Step {stepNumber} of {totalSteps}
        </span>
      </div>

      <h2 id={headerId}>
        <button
          ref={buttonRef}
          type="button"
          className={[
            'flex w-full items-center justify-between border-y-[0.5px] border-[rgba(31,31,31,0.5)] px-[15px] py-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand',
            STEP_ROW_CLASS[stepId] ?? 'h-[60px]',
            isOpen
              ? 'xl:h-[46px] xl:border-b-0 xl:pb-0 xl:pt-5'
              : `${DESKTOP_COLLAPSED_STEP_ROW_CLASS[stepId] ?? 'xl:h-[66px]'} xl:relative xl:border-b-0 xl:border-t-[0.5px] xl:py-5 xl:after:absolute xl:after:inset-x-0 xl:after:-bottom-px xl:after:h-0.5 xl:after:border-b xl:after:border-[#acacac] xl:after:bg-[#e3e3e3] xl:after:content-['']`,
          ].join(' ')}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-label={`Step ${stepNumber}: ${title}`}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={`flex shrink-0 items-center justify-center ${STEP_ICON_CLASS[stepId] ?? 'size-5 xl:size-[26px]'}`}
              aria-hidden="true"
            >
              <img
                className={STEP_ICON_IMAGE_CLASS[stepId] ?? 'size-full object-contain'}
                src={iconSrc}
                alt=""
              />
            </span>
            <span className="min-w-0 text-[18px] font-semibold leading-none text-ink xl:text-[22px]">
              {title}
            </span>
          </span>

          <span className="ml-3 flex shrink-0 items-center gap-1">
            <span
              className={[
                'text-center text-sm font-medium leading-4 text-brand',
                isOpen ? '' : 'xl:hidden',
              ].join(' ')}
            >
              {selectionLabel}
            </span>
            <span className="flex size-3 items-center justify-center" aria-hidden="true">
              <img
                className={`h-[6.63977px] w-[9.05857px] max-w-none object-contain ${caretRotation}`}
                src={bundleBuilderAssets.carets.up}
                alt=""
              />
            </span>
          </span>
        </button>
      </h2>

      <div
        ref={panelRef}
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={isOpen ? '-mt-[5px] overflow-hidden' : 'pointer-events-none -mt-[5px] overflow-hidden'}
        style={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
      >
        <div className="px-[15px] pb-5 pt-[15px]">
          {children}
          {onNext && nextLabel ? (
            <div className="mt-[15px] flex justify-center">
              <button
                type="button"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-[7px] border border-brand bg-[#f4f8ff] px-6 text-sm font-semibold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:w-auto xl:h-[39px] xl:min-h-[39px] xl:text-[18px] xl:leading-6"
                onClick={onNext}
              >
                {nextLabel}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
