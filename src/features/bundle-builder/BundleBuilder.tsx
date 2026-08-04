import { AccordionStep } from './components/AccordionStep'
import { bundleBuilderAssets } from './components/assets'
import { ModalDialog } from './components/ModalDialog'
import { ProductCard } from './components/ProductCard'
import { ReviewPanel } from './components/ReviewPanel'
import { bundleCatalog, getProductsForStep } from './domain'
import { formatCurrency } from './formatting/currency'
import { useBundleBuilder } from './hooks/useBundleBuilder'

const STEP_ICONS = bundleBuilderAssets.steps

export function BundleBuilder() {
  const builder = useBundleBuilder()

  return (
    <main className="min-h-dvh bg-white px-0 pb-0 pt-[31px] text-copy sm:px-6 sm:pt-10 xl:px-0 xl:pt-[49.36px]" data-testid="bundle-builder">
      <header className="mx-auto h-[35px] w-[calc(100%-42px)] max-w-[348px] text-center xl:sr-only">
        <p className="sr-only">
          Build your bundle
        </p>
        <h1 className="text-[31.875px] font-bold leading-[1.1] tracking-[-0.064px] text-[#1f1f1f]">
          Let’s get started!
        </h1>
        <p className="sr-only">
          Choose what fits your home. Your system and savings update as you go.
        </p>
      </header>

      <div className="mx-auto mt-5 grid w-full min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-0 sm:mt-8 sm:max-w-[1024px] sm:gap-6 xl:mt-0 xl:max-w-[1196px] xl:grid-cols-[768px_399px] xl:gap-[29px]">
        <section className="flex min-w-0 w-full flex-col gap-0 sm:gap-4 xl:gap-[13px]" aria-label="Build your system">
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
                iconSrc={STEP_ICONS[step.icon]}
                selectedCount={builder.selectedCountForStep(step.id)}
                isOpen={builder.state.openStepId === step.id}
                buttonRef={(node) => builder.setStepButtonRef(step.id, node)}
                onToggle={() => builder.toggleStep(step.id)}
                nextLabel={isFinalStep ? 'Review your system' : step.nextLabel}
                onNext={() => builder.advanceFromStep(index)}
              >
                <div
                  data-testid={`product-grid-${step.id}`}
                  className={
                    products.length > 1
                      ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5 lg:gap-[15px] xl:grid-cols-2 xl:gap-[15px]'
                      : 'grid grid-cols-1 gap-4 xl:gap-[15px]'
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
                        className={[
                          'h-full',
                          centerOddFinalCard
                            ? 'md:col-span-2 md:mx-auto md:w-[calc(50%-0.5rem)] lg:col-span-1 lg:mx-0 lg:w-full xl:col-span-2 xl:mx-auto xl:w-[360px]'
                            : '',
                        ].join(' ')}
                      >
                        <ProductCard
                          product={builder.productCardFor(product)}
                          priority={index === 0 && productIndex < 2}
                          onVariantChange={builder.selectVariant}
                          onQuantityChange={builder.setQuantity}
                          onLearnMore={builder.openProductDetails}
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
          groups={builder.reviewGroups}
          copy={{
            description: bundleCatalog.review.description,
            shippingLabel: bundleCatalog.review.shipping.label,
            freeShippingLabel: bundleCatalog.review.shipping.freeLabel,
            guaranteeTitle: bundleCatalog.review.guarantee.title,
            guaranteeDescription: bundleCatalog.review.guarantee.description,
            financingDescription: bundleCatalog.review.financing.description,
          }}
          totals={{
            totalCents: builder.reviewTotals.totalCents,
            compareAtCents: builder.reviewTotals.compareAtCents,
            savingsCents: builder.reviewTotals.savingsCents,
            shippingCents: builder.reviewTotals.shippingCents,
            shippingCompareAtCents: builder.reviewTotals.shippingCompareAtCents,
          }}
          saveState={builder.saveState}
          panelRef={builder.reviewPanelRef}
          onQuantityChange={builder.setQuantity}
          onCheckout={builder.openCheckout}
          onSave={builder.save}
        />
      </div>

      <ModalDialog
        open={Boolean(builder.detailsProduct)}
        eyebrow="Product details"
        title={
          builder.detailsProduct
            ? `About ${builder.detailsProduct.name}`
            : 'Product details'
        }
        onClose={builder.closeProductDetails}
      >
        {builder.detailsProduct ? (
          <div className="sm:grid sm:grid-cols-[140px_1fr] sm:gap-6">
            <div className="mx-auto flex size-36 items-center justify-center rounded-2xl bg-[#f5f4f6] p-3 sm:mx-0">
              <img
                className="max-h-full max-w-full object-contain"
                src={builder.detailsProduct.image.src}
                alt={builder.detailsProduct.image.alt}
                width={builder.detailsProduct.image.width}
                height={builder.detailsProduct.image.height}
              />
            </div>
            <div className="mt-5 sm:mt-0">
              <p>{builder.detailsProduct.description}</p>
              <ul className="mt-4 space-y-2" role="list">
                {builder.detailsProduct.details.map((detail) => (
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
        open={builder.checkoutOpen}
        eyebrow="Prototype checkout"
        title="Ready to check out?"
        onClose={builder.closeCheckout}
        footer={
          <button
            type="button"
            className="min-h-12 w-full rounded-full bg-[#1d1a21] px-6 text-sm font-bold text-white hover:bg-[#37313d]"
            onClick={builder.closeCheckout}
          >
            Continue building
          </button>
        }
      >
        <p>
          Your system has {builder.selectedLineItemCount} selected line items totaling{' '}
          <strong className="font-bold text-[#28222d]">
            {formatCurrency(builder.reviewTotals.totalCents)}
          </strong>
          .
        </p>
        <p className="mt-3">
          Checkout is intentionally a confirmation in this prototype—no payment details are collected.
        </p>
      </ModalDialog>
    </main>
  )
}
