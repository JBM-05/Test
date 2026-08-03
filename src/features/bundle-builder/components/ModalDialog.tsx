import { X } from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'
import { useEffect, useRef } from 'react'

import { gsap, useGSAP } from './motion'

interface ModalDialogProps {
  open: boolean
  title: string
  eyebrow?: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}

export function ModalDialog({
  open,
  title,
  eyebrow,
  children,
  footer,
  onClose,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const titleId = `dialog-title-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.showModal()
      return
    }

    if (!open && dialog.open) {
      dialog.close()
      requestAnimationFrame(() => returnFocusRef.current?.focus())
    }
  }, [open])

  useGSAP(
    () => {
      if (!open || !panelRef.current) return

      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(panelRef.current, { opacity: 1, scale: 1, y: 0 })
      })
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          panelRef.current,
          { opacity: 0, scale: 0.975, y: 10 },
          { opacity: 1, scale: 1, y: 0, duration: 0.24, ease: 'power2.out' },
        )
      })

      return () => media.revert()
    },
    { dependencies: [open], scope: dialogRef },
  )

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(92vw,560px)] max-w-none overflow-visible bg-transparent p-0 text-[#201c24] backdrop:bg-[#17131d]/55 backdrop:backdrop-blur-[2px]"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
        }
      }}
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[22px] border border-white/60 bg-white p-5 shadow-[0_28px_80px_rgba(21,15,28,0.28)] sm:p-7"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            {eyebrow ? (
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#6b35d3]">
                {eyebrow}
              </p>
            ) : null}
            <h2
              id={titleId}
              className="mt-1 text-2xl font-bold tracking-[-0.025em] text-[#201c24] sm:text-[28px]"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-[#4d4652] transition-colors hover:bg-[#f1eff3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5130d7]"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X aria-hidden="true" size={21} />
          </button>
        </div>
        <div className="mt-5 text-[15px] leading-7 text-[#625b68]">{children}</div>
        {footer ? <div className="mt-7">{footer}</div> : null}
      </div>
    </dialog>
  )
}
