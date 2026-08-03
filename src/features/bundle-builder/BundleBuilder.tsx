import { Camera, CirclePlus, RadioTower, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { useReducer, useRef, useState } from 'react'

import {
  bundleCatalog,
  bundleReducer,
  getProductById,
  getProductSkus,
  getProductsForStep,
  loadBundleState,
  saveBundleState,
  seedBundleState,
  selectActiveSku,
  selectReviewGroups,
  selectSkuQuantity,
  selectStepCount,
  selectTotals,
  type BundleAction,
  type BundleProduct,
  type BundleState,
} from './domain'
import { AccordionStep } from './components/AccordionStep'
import { formatCurrency } from './components/format'
import { ModalDialog } from './components/ModalDialog'
import { ProductCard } from './components/ProductCard'
import { ReviewPanel } from './components/ReviewPanel'
import type { SaveState } from './components/SaveStatus'
import type {
  ProductCardViewModel,
  ProductControl,
  ReviewGroupViewModel,
} from './components/ui-types'

const STEP_ICONS: Readonly<Record<string, ReactNode>> = {
  camera: <Camera aria-hidden="true" size={22} />,
  plan: <ShieldCheck aria-hidden="true" size={22} />,
  sensor: <RadioTower aria-hidden="true" size={22} />,
  accessory: <CirclePlus aria-hidden="true" size={22} />,
}

function toControl(product: BundleProduct): ProductControl {
  if (product.selection.mode === 'required') return 'locked'
  if (product.selection.mode === 'binary') return 'binary'
  return 'quantity'
}

function toProductCard(product: BundleProduct, state: BundleState): ProductCardViewModel {
  const variants =
    product.kind === 'variant'
      ? product.variants.map((variant) => ({
          sku: variant.sku,
          label: variant.label,
          swatch: variant.swatch,
          imageSrc: variant.image?.src,
          imageAlt: variant.image?.alt,
          currentCents: variant.priceCents,
          compareAtCents: variant.compareAtCents,
          suffix: product.billingCadence === 'month' ? '/mo' : undefined,
        }))
      : [
          {
            sku: product.sku,
            label: product.name,
            currentCents: product.priceCents,
            compareAtCents: product.compareAtCents,
            suffix: product.billingCadence === 'month' ? '/mo' : undefined,
          },
        ]
  const activeSku = selectActiveSku(state, product.id) ?? variants[0]?.sku ?? ''
  const quantityBySku = Object.fromEntries(
    getProductSkus(product).map((sku) => [sku, selectSkuQuantity(state, sku)]),
  )

  return {
    id: product.id,
    title: product.name,
    description: product.description,
    details: product.details.join(' '),
    badge: product.badge,
    imageSrc: product.image.src,
    imageAlt: product.image.alt,
    imageWidth: product.image.width,
    imageHeight: product.image.height,
    activeSku,
    quantityBySku,
    variants,
    control: toControl(product),
    helperText:
      product.selection.mode === 'required'
        ? 'Automatically included when you add at least one sensor.'
        : undefined,
  }
}

export function BundleBuilder() {
  const [restoredState] = useState(() => loadBundleState())
  const [state, dispatch] = useReducer(bundleReducer, restoredState ?? seedBundleState)
  const [saveState, setSaveState] = useState<SaveState>(restoredState ? 'restored' : 'idle')
  const [detailsProductId, setDetailsProductId] = useState<string | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const stepButtonRefs = useRef(new Map<string, HTMLButtonElement>())
  const reviewPanelRef = useRef<HTMLElement>(null)

  const reviewGroups = selectReviewGroups(state)
  const totals = selectTotals(state)
  const detailsProduct = detailsProductId ? getProductById(detailsProductId) : undefined

  const reviewViewModels: ReviewGroupViewModel[] = reviewGroups.map((group) => ({
    id: group.id,
    label: group.label,
    lines: group.lines.map((line) => ({
      sku: line.sku,
      name: line.productName,
      variantLabel: line.variantLabel,
      imageSrc: line.image.src,
      imageAlt: line.image.alt,
      quantity: line.quantity,
      currentCents: line.lineTotalCents,
      compareAtCents: line.compareAtLineTotalCents,
      suffix: line.billingCadence === 'month' ? '/mo' : undefined,
      control: line.isRequired
        ? 'locked'
        : line.selectionMode === 'binary'
          ? 'binary'
          : 'quantity',
      helperText: line.isRequired ? 'Required for your selected sensors.' : undefined,
    })),
  }))

  function update(action: BundleAction) {
    dispatch(action)
    setSaveState('unsaved')
  }

  function moveToStep(index: number) {
    const nextStep = bundleCatalog.steps[index + 1]

    if (!nextStep) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      reviewPanelRef.current?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      })
      requestAnimationFrame(() => {
        const heading = reviewPanelRef.current?.querySelector<HTMLElement>('#review-title')
        heading?.focus()
      })
      return
    }

    update({ type: 'open-step', stepId: nextStep.id })
    requestAnimationFrame(() => stepButtonRefs.current.get(nextStep.id)?.focus())
  }

  function handleSave() {
    const result = saveBundleState(state)
    setSaveState(result.ok ? 'saved' : 'error')
  }

  return (
    <main className="min-h-dvh bg-white px-0 pb-14 pt-8 text-[#211e25] sm:px-6 sm:pt-10 xl:pt-7" data-testid="bundle-builder">
      <header className="mx-auto max-w-[620px] text-center xl:sr-only">
        <p className="sr-only">
          Build your bundle
        </p>
        <h1 className="text-[24px] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#151218] sm:text-[32px]">
          Let’s get started!
        </h1>
        <p className="sr-only">
          Choose what fits your home. Your system and savings update as you go.
        </p>
      </header>

      <div className="mx-auto mt-5 grid w-full max-w-[1204px] items-start gap-0 sm:mt-8 sm:gap-6 xl:mt-0 xl:grid-cols-[minmax(0,780px)_400px] xl:gap-6">
        <section className="space-y-0 sm:space-y-4" aria-label="Build your system">
          {bundleCatalog.steps.map((step, index) => {
            const products = getProductsForStep(step.id)
            const isFinalStep = index === bundleCatalog.steps.length - 1

            return (
              <AccordionStep
                key={step.id}
                stepId={step.id}
                stepNumber={index + 1}
                totalSteps={bundleCatalog.steps.length}
                title={step.title}
                icon={STEP_ICONS[step.icon]}
                selectedCount={selectStepCount(state, step.id)}
                isOpen={state.openStepId === step.id}
                buttonRef={(node) => {
                  if (node) stepButtonRefs.current.set(step.id, node)
                  else stepButtonRefs.current.delete(step.id)
                }}
                onToggle={() => update({ type: 'toggle-step', stepId: step.id })}
                nextLabel={isFinalStep ? 'Review your system' : step.nextLabel}
                onNext={() => moveToStep(index)}
              >
                <div
                  className={
                    products.length > 1
                      ? 'grid grid-cols-1 gap-4 md:grid-cols-2'
                      : 'grid grid-cols-1 gap-4'
                  }
                >
                  {products.map((product, productIndex) => {
                    const centerOddFinalCard =
                      products.length > 1 &&
                      products.length % 2 === 1 &&
                      productIndex === products.length - 1

                    return (
                      <div
                        key={product.id}
                        className={
                          centerOddFinalCard
                            ? 'md:col-span-2 md:mx-auto md:w-[calc(50%-0.5rem)]'
                            : undefined
                        }
                      >
                        <ProductCard
                          product={toProductCard(product, state)}
                          priority={index === 0 && productIndex < 2}
                          onVariantChange={(productId, sku) =>
                            update({ type: 'select-variant', productId, sku })
                          }
                          onQuantityChange={(sku, quantity) =>
                            update({ type: 'set-quantity', sku, quantity })
                          }
                          onLearnMore={setDetailsProductId}
                        />
                      </div>
                    )
                  })}
                </div>
              </AccordionStep>
            )
          })}
        </section>

        <ReviewPanel
          groups={reviewViewModels}
          copy={{
            description: bundleCatalog.review.description,
            shippingLabel: bundleCatalog.review.shipping.label,
            freeShippingLabel: bundleCatalog.review.shipping.freeLabel,
            guaranteeTitle: bundleCatalog.review.guarantee.title,
            guaranteeDescription: bundleCatalog.review.guarantee.description,
            financingDescription: bundleCatalog.review.financing.description,
          }}
          totals={{
            totalCents: totals.totalCents,
            compareAtCents: totals.compareAtTotalCents,
            savingsCents: totals.savingsCents,
            shippingCents: totals.shippingCents,
            shippingCompareAtCents: totals.shippingCompareAtCents,
          }}
          saveState={saveState}
          panelRef={reviewPanelRef}
          onQuantityChange={(sku, quantity) =>
            update({ type: 'set-quantity', sku, quantity })
          }
          onCheckout={() => setCheckoutOpen(true)}
          onSave={handleSave}
        />
      </div>

      <ModalDialog
        open={Boolean(detailsProduct)}
        eyebrow="Product details"
        title={detailsProduct ? `About ${detailsProduct.name}` : 'Product details'}
        onClose={() => setDetailsProductId(null)}
      >
        {detailsProduct ? (
          <div className="sm:grid sm:grid-cols-[140px_1fr] sm:gap-6">
            <div className="mx-auto flex size-36 items-center justify-center rounded-2xl bg-[#f5f4f6] p-3 sm:mx-0">
              <img
                className="max-h-full max-w-full object-contain"
                src={detailsProduct.image.src}
                alt={detailsProduct.image.alt}
                width={detailsProduct.image.width}
                height={detailsProduct.image.height}
              />
            </div>
            <div className="mt-5 sm:mt-0">
              <p>{detailsProduct.description}</p>
              <ul className="mt-4 space-y-2" role="list">
                {detailsProduct.details.map((detail) => (
                  <li key={detail} className="flex gap-2">
                    <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[#6737d4]" aria-hidden="true" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </ModalDialog>

      <ModalDialog
        open={checkoutOpen}
        eyebrow="Prototype checkout"
        title="Ready to check out?"
        onClose={() => setCheckoutOpen(false)}
        footer={
          <button
            type="button"
            className="min-h-12 w-full rounded-full bg-[#1d1a21] px-6 text-sm font-bold text-white hover:bg-[#37313d]"
            onClick={() => setCheckoutOpen(false)}
          >
            Continue building
          </button>
        }
      >
        <p>
          Your system has {reviewViewModels.reduce((count, group) => count + group.lines.length, 0)} selected line items totaling{' '}
          <strong className="font-bold text-[#28222d]">{formatCurrency(totals.totalCents)}</strong>.
        </p>
        <p className="mt-3">
          Checkout is intentionally a confirmation in this prototype—no payment details are collected.
        </p>
      </ModalDialog>
    </main>
  )
}
