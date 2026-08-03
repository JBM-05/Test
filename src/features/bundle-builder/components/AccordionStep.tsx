import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ReactNode, Ref } from 'react'
import { useRef } from 'react'

import { gsap, useGSAP } from './motion'

interface AccordionStepProps {
  stepId: string
  stepNumber: number
  totalSteps: number
  title: string
  icon: ReactNode
  selectedCount: number
  isOpen: boolean
  buttonRef?: Ref<HTMLButtonElement>
  onToggle: () => void
  nextLabel?: string
  onNext?: () => void
  children: ReactNode
}

export function AccordionStep({
  stepId,
  stepNumber,
  totalSteps,
  title,
  icon,
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

  return (
    <section
      ref={rootRef}
      className={[
        'overflow-hidden rounded-none border border-x-0 border-[#d9dce4] shadow-none transition-colors sm:rounded-xl sm:border-x sm:shadow-[0_3px_14px_rgba(32,25,41,0.03)] xl:rounded-md',
        isOpen ? 'bg-[#eef4ff]' : 'bg-white',
      ].join(' ')}
    >
      <h2 id={headerId}>
        <button
          ref={buttonRef}
          type="button"
          className="flex min-h-12 w-full items-center gap-2 rounded-none px-3 py-2 text-left transition-colors hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5130d7] sm:gap-3 sm:rounded-xl sm:px-5 sm:py-3 xl:rounded-md xl:px-3 xl:py-3"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-label={`Step ${stepNumber}: ${title}`}
        >
          <span className="flex size-7 shrink-0 items-center justify-center text-[#625b68]">
            {icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[8px] font-bold uppercase tracking-[0.13em] text-[#625b68] sm:text-[9px]">
              Step {stepNumber} of {totalSteps}
            </span>
            <span className="mt-0.5 block text-sm font-bold tracking-[-0.01em] text-[#211e25] sm:text-base xl:text-sm">
              {title}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span
              className={[
                'hidden text-[10px] font-bold text-[#5630c4] min-[340px]:inline sm:text-xs',
                isOpen ? '' : 'xl:hidden',
              ].join(' ')}
            >
              {selectionLabel}
            </span>
            {isOpen ? (
              <ChevronUp aria-hidden="true" size={16} />
            ) : (
              <ChevronDown aria-hidden="true" size={16} />
            )}
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
        className={isOpen ? 'overflow-hidden' : 'pointer-events-none overflow-hidden'}
        style={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
      >
        <div className="border-t border-[#d9dfeb] px-4 pb-5 pt-5 sm:px-5 sm:pb-5 sm:pt-5 xl:px-3 xl:pb-4 xl:pt-3">
          {children}
          {onNext && nextLabel ? (
            <div className="mt-6 flex justify-center pt-5 xl:mt-4 xl:pt-2">
              <button
                type="button"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-[#6436e8] bg-white px-7 text-sm font-bold text-[#5630c4] transition-[background-color,transform] hover:bg-[#f4efff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5130d7] focus-visible:ring-offset-2 active:scale-[0.99] sm:w-auto xl:min-h-10 xl:text-xs"
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
