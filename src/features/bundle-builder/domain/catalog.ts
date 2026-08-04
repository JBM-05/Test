import rawCatalog from '../data/bundle-catalog.json'
import type {
  BillingCadence,
  BundleCatalog,
  BundleProduct,
  BundleReviewMetadata,
  BundleState,
  BundleStep,
  CardDisplayPrice,
  ProductId,
  ProductImage,
  ProductSelection,
  ProductVariant,
  ReviewCategory,
  ReviewCategoryId,
  SingleProduct,
  Sku,
  StepIcon,
  StepId,
  VariantProduct,
} from './types'

type UnknownRecord = Record<string, unknown>

const STEP_ICONS = new Set<StepIcon>([
  'camera',
  'plan',
  'sensor',
  'accessory',
])
const BILLING_CADENCES = new Set<BillingCadence>(['one-time', 'month'])

export class CatalogValidationError extends Error {
  constructor(message: string) {
    super(`Invalid bundle catalog: ${message}`)
    this.name = 'CatalogValidationError'
  }
}

function fail(path: string, expectation: string): never {
  throw new CatalogValidationError(`${path} must be ${expectation}`)
}

function record(value: unknown, path: string): UnknownRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return fail(path, 'an object')
  }
  return value as UnknownRecord
}

function array(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) return fail(path, 'an array')
  return value
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    return fail(path, 'a non-empty string')
  }
  return value
}

function optionalString(value: unknown, path: string): string | undefined {
  return value === undefined ? undefined : string(value, path)
}

function optionalBoolean(value: unknown, path: string): boolean | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'boolean') return fail(path, 'a boolean')
  return value
}

function integer(value: unknown, path: string, minimum = 0): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum) {
    return fail(path, `a safe integer greater than or equal to ${minimum}`)
  }
  return value as number
}

function literalOne(value: unknown, path: string): 1 {
  if (value !== 1) return fail(path, '1')
  return 1
}

function parseImage(value: unknown, path: string): ProductImage {
  const source = record(value, path)
  return {
    src: string(source.src, `${path}.src`),
    alt: string(source.alt, `${path}.alt`),
    width: integer(source.width, `${path}.width`, 1),
    height: integer(source.height, `${path}.height`, 1),
  }
}

function parseCardDisplayPrice(
  value: unknown,
  path: string,
): CardDisplayPrice | undefined {
  if (value === undefined) return undefined

  const source = record(value, path)
  const priceCents = integer(source.priceCents, `${path}.priceCents`)
  const compareAtCents =
    source.compareAtCents === undefined
      ? undefined
      : integer(source.compareAtCents, `${path}.compareAtCents`)

  if (compareAtCents !== undefined && compareAtCents < priceCents) {
    return fail(`${path}.compareAtCents`, 'greater than or equal to priceCents')
  }

  return {
    priceCents,
    ...(compareAtCents === undefined ? {} : { compareAtCents }),
  }
}

function parseSelection(value: unknown, path: string): ProductSelection {
  const source = record(value, path)
  const mode = string(source.mode, `${path}.mode`)

  if (mode === 'quantity' || mode === 'binary') return { mode }
  if (mode !== 'required') {
    return fail(`${path}.mode`, '"quantity", "binary", or "required"')
  }

  const triggerProductIds = array(
    source.triggerProductIds,
    `${path}.triggerProductIds`,
  ).map((id, index) =>
    string(id, `${path}.triggerProductIds[${index}]`),
  )
  if (triggerProductIds.length === 0) {
    return fail(`${path}.triggerProductIds`, 'a non-empty array')
  }

  return {
    mode,
    triggerProductIds,
    quantity: literalOne(source.quantity, `${path}.quantity`),
  }
}

function parseVariant(value: unknown, path: string): ProductVariant {
  const source = record(value, path)
  const priceCents = integer(source.priceCents, `${path}.priceCents`)
  const compareAtCents =
    source.compareAtCents === undefined
      ? undefined
      : integer(source.compareAtCents, `${path}.compareAtCents`)
  if (compareAtCents !== undefined && compareAtCents < priceCents) {
    return fail(`${path}.compareAtCents`, 'greater than or equal to priceCents')
  }
  const cardDisplayPrice = parseCardDisplayPrice(
    source.cardDisplayPrice,
    `${path}.cardDisplayPrice`,
  )

  return {
    sku: string(source.sku, `${path}.sku`),
    label: string(source.label, `${path}.label`),
    swatch: string(source.swatch, `${path}.swatch`),
    priceCents,
    ...(compareAtCents === undefined ? {} : { compareAtCents }),
    ...(cardDisplayPrice === undefined ? {} : { cardDisplayPrice }),
    ...(source.image === undefined
      ? {}
      : { image: parseImage(source.image, `${path}.image`) }),
    ...(source.selectorImage === undefined
      ? {}
      : {
          selectorImage: parseImage(
            source.selectorImage,
            `${path}.selectorImage`,
          ),
        }),
    ...(source.reviewImage === undefined
      ? {}
      : { reviewImage: parseImage(source.reviewImage, `${path}.reviewImage`) }),
  }
}

function parseProduct(value: unknown, index: number): BundleProduct {
  const path = `products[${index}]`
  const source = record(value, path)
  const kind = string(source.kind, `${path}.kind`)
  const billingCadence = string(
    source.billingCadence,
    `${path}.billingCadence`,
  )
  if (!BILLING_CADENCES.has(billingCadence as BillingCadence)) {
    return fail(`${path}.billingCadence`, '"one-time" or "month"')
  }

  const base = {
    id: string(source.id, `${path}.id`),
    stepId: string(source.stepId, `${path}.stepId`),
    reviewCategory: string(
      source.reviewCategory,
      `${path}.reviewCategory`,
    ),
    name: string(source.name, `${path}.name`),
    description: string(source.description, `${path}.description`),
    details: array(source.details, `${path}.details`).map((detail, detailIndex) =>
      string(detail, `${path}.details[${detailIndex}]`),
    ),
    image: parseImage(source.image, `${path}.image`),
    ...(source.cardImage === undefined
      ? {}
      : { cardImage: parseImage(source.cardImage, `${path}.cardImage`) }),
    ...(() => {
      const cardImageIncludesBadge = optionalBoolean(
        source.cardImageIncludesBadge,
        `${path}.cardImageIncludesBadge`,
      )
      return cardImageIncludesBadge === undefined ? {} : { cardImageIncludesBadge }
    })(),
    ...(source.reviewImage === undefined
      ? {}
      : { reviewImage: parseImage(source.reviewImage, `${path}.reviewImage`) }),
    billingCadence: billingCadence as BillingCadence,
    selection: parseSelection(source.selection, `${path}.selection`),
    ...(() => {
      const badge = optionalString(source.badge, `${path}.badge`)
      return badge === undefined ? {} : { badge }
    })(),
  }

  if (kind === 'variant') {
    const variants = array(source.variants, `${path}.variants`).map(
      (variant, variantIndex) =>
        parseVariant(variant, `${path}.variants[${variantIndex}]`),
    )
    if (variants.length === 0) return fail(`${path}.variants`, 'non-empty')
    const product: VariantProduct = { kind, ...base, variants }
    return product
  }

  if (kind === 'single') {
    const priceCents = integer(source.priceCents, `${path}.priceCents`)
    const compareAtCents =
      source.compareAtCents === undefined
        ? undefined
        : integer(source.compareAtCents, `${path}.compareAtCents`)
    if (compareAtCents !== undefined && compareAtCents < priceCents) {
      return fail(
        `${path}.compareAtCents`,
        'greater than or equal to priceCents',
      )
    }
    const cardDisplayPrice = parseCardDisplayPrice(
      source.cardDisplayPrice,
      `${path}.cardDisplayPrice`,
    )
    const product: SingleProduct = {
      kind,
      ...base,
      sku: string(source.sku, `${path}.sku`),
      priceCents,
      ...(compareAtCents === undefined ? {} : { compareAtCents }),
      ...(cardDisplayPrice === undefined ? {} : { cardDisplayPrice }),
    }
    return product
  }

  return fail(`${path}.kind`, '"single" or "variant"')
}

function parseStep(value: unknown, index: number): BundleStep {
  const path = `steps[${index}]`
  const source = record(value, path)
  const icon = string(source.icon, `${path}.icon`)
  if (!STEP_ICONS.has(icon as StepIcon)) {
    return fail(`${path}.icon`, 'a supported step icon')
  }
  return {
    id: string(source.id, `${path}.id`),
    order: integer(source.order, `${path}.order`, 1),
    eyebrow: string(source.eyebrow, `${path}.eyebrow`),
    title: string(source.title, `${path}.title`),
    icon: icon as StepIcon,
    nextLabel: string(source.nextLabel, `${path}.nextLabel`),
  }
}

function parseReviewCategory(value: unknown, index: number): ReviewCategory {
  const path = `review.categories[${index}]`
  const source = record(value, path)
  return {
    id: string(source.id, `${path}.id`),
    label: string(source.label, `${path}.label`),
    order: integer(source.order, `${path}.order`, 1),
  }
}

function parseReview(value: unknown): BundleReviewMetadata {
  const source = record(value, 'review')
  const shipping = record(source.shipping, 'review.shipping')
  const guarantee = record(source.guarantee, 'review.guarantee')
  const financing = record(source.financing, 'review.financing')
  return {
    description: string(source.description, 'review.description'),
    categories: array(source.categories, 'review.categories').map(
      parseReviewCategory,
    ),
    shipping: {
      label: string(shipping.label, 'review.shipping.label'),
      priceCents: integer(
        shipping.priceCents,
        'review.shipping.priceCents',
      ),
      compareAtCents: integer(
        shipping.compareAtCents,
        'review.shipping.compareAtCents',
      ),
      freeLabel: string(shipping.freeLabel, 'review.shipping.freeLabel'),
    },
    guarantee: {
      title: string(guarantee.title, 'review.guarantee.title'),
      description: string(
        guarantee.description,
        'review.guarantee.description',
      ),
    },
    financing: {
      description: string(
        financing.description,
        'review.financing.description',
      ),
      learnMoreLabel: string(
        financing.learnMoreLabel,
        'review.financing.learnMoreLabel',
      ),
    },
  }
}

function parseStringRecord(
  value: unknown,
  path: string,
): Readonly<Record<string, string>> {
  const source = record(value, path)
  return Object.fromEntries(
    Object.entries(source).map(([key, item]) => [
      key,
      string(item, `${path}.${key}`),
    ]),
  )
}

function parseQuantityRecord(
  value: unknown,
  path: string,
): Readonly<Record<string, number>> {
  const source = record(value, path)
  return Object.fromEntries(
    Object.entries(source).map(([key, item]) => [
      key,
      integer(item, `${path}.${key}`),
    ]),
  )
}

function parseSeed(value: unknown): BundleState {
  const source = record(value, 'seed')
  const openStepId = source.openStepId
  if (openStepId !== null && typeof openStepId !== 'string') {
    return fail('seed.openStepId', 'a step ID or null')
  }
  return {
    openStepId,
    activeVariantByProductId: parseStringRecord(
      source.activeVariantByProductId,
      'seed.activeVariantByProductId',
    ),
    quantityBySku: parseQuantityRecord(
      source.quantityBySku,
      'seed.quantityBySku',
    ),
  }
}

function ensureUnique(values: readonly string[], path: string): void {
  if (new Set(values).size !== values.length) return fail(path, 'unique')
}

function productSkus(product: BundleProduct): readonly Sku[] {
  return product.kind === 'single'
    ? [product.sku]
    : product.variants.map((variant) => variant.sku)
}

function validateRelationships(catalog: BundleCatalog): void {
  ensureUnique(
    catalog.steps.map((step) => step.id),
    'steps[].id',
  )
  ensureUnique(
    catalog.steps.map((step) => String(step.order)),
    'steps[].order',
  )
  ensureUnique(
    catalog.review.categories.map((category) => category.id),
    'review.categories[].id',
  )
  ensureUnique(
    catalog.review.categories.map((category) => String(category.order)),
    'review.categories[].order',
  )
  ensureUnique(
    catalog.products.map((product) => product.id),
    'products[].id',
  )

  const stepIds = new Set(catalog.steps.map((step) => step.id))
  const categoryIds = new Set(
    catalog.review.categories.map((category) => category.id),
  )
  const productIds = new Set(catalog.products.map((product) => product.id))
  const skus = catalog.products.flatMap(productSkus)
  const skuSet = new Set(skus)
  ensureUnique(skus, 'product SKUs')

  for (const product of catalog.products) {
    if (!stepIds.has(product.stepId)) {
      fail(`product ${product.id}.stepId`, 'a known step ID')
    }
    if (!categoryIds.has(product.reviewCategory)) {
      fail(`product ${product.id}.reviewCategory`, 'a known review category ID')
    }
    if (product.selection.mode === 'required') {
      if (product.kind !== 'single') {
        fail(`product ${product.id}`, 'single-SKU when required')
      }
      for (const triggerId of product.selection.triggerProductIds) {
        if (!productIds.has(triggerId) || triggerId === product.id) {
          fail(
            `product ${product.id}.selection.triggerProductIds`,
            'known, non-self product IDs',
          )
        }
      }
    }
  }

  if (catalog.seed.openStepId !== null && !stepIds.has(catalog.seed.openStepId)) {
    fail('seed.openStepId', 'a known step ID or null')
  }
  ensureUnique(Object.keys(catalog.seed.quantityBySku), 'seed quantity keys')
  if (
    Object.keys(catalog.seed.quantityBySku).length !== skus.length ||
    Object.keys(catalog.seed.quantityBySku).some((sku) => !skuSet.has(sku))
  ) {
    fail('seed.quantityBySku', 'an exact quantity entry for every known SKU')
  }

  const variantProducts = catalog.products.filter(
    (product): product is VariantProduct => product.kind === 'variant',
  )
  if (
    Object.keys(catalog.seed.activeVariantByProductId).length !==
    variantProducts.length
  ) {
    fail(
      'seed.activeVariantByProductId',
      'an exact active SKU for every variant product',
    )
  }
  for (const product of variantProducts) {
    const activeSku = catalog.seed.activeVariantByProductId[product.id]
    if (!product.variants.some((variant) => variant.sku === activeSku)) {
      fail(`seed.activeVariantByProductId.${product.id}`, 'one of its variant SKUs')
    }
  }

  for (const product of catalog.products) {
    if (product.selection.mode !== 'binary') continue
    const sku = productSkus(product)[0]
    if (sku === undefined || catalog.seed.quantityBySku[sku] > 1) {
      fail(`seed.quantityBySku.${sku ?? product.id}`, 'zero or one')
    }
  }

  for (const product of catalog.products) {
    if (product.selection.mode !== 'required' || product.kind !== 'single') {
      continue
    }
    const shouldBePresent = product.selection.triggerProductIds.some(
      (triggerId) => {
        const trigger = catalog.products.find((item) => item.id === triggerId)
        return (
          trigger !== undefined &&
          productSkus(trigger).some(
            (sku) => (catalog.seed.quantityBySku[sku] ?? 0) > 0,
          )
        )
      },
    )
    const expected = shouldBePresent ? product.selection.quantity : 0
    if (catalog.seed.quantityBySku[product.sku] !== expected) {
      fail(
        `seed.quantityBySku.${product.sku}`,
        `the derived required quantity ${expected}`,
      )
    }
  }
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) {
    return value
  }
  for (const child of Object.values(value)) deepFreeze(child)
  return Object.freeze(value)
}

export function parseBundleCatalog(input: unknown): BundleCatalog {
  const source = record(input, 'catalog')
  const catalog: BundleCatalog = {
    catalogVersion: integer(source.catalogVersion, 'catalogVersion', 1),
    currency: string(source.currency, 'currency'),
    steps: array(source.steps, 'steps').map(parseStep),
    review: parseReview(source.review),
    products: array(source.products, 'products').map(parseProduct),
    seed: parseSeed(source.seed),
  }
  if (catalog.steps.length === 0) fail('steps', 'non-empty')
  if (catalog.products.length === 0) fail('products', 'non-empty')
  validateRelationships(catalog)
  return deepFreeze(catalog)
}

export const bundleCatalog = parseBundleCatalog(rawCatalog)

const productById = new Map(
  bundleCatalog.products.map((product) => [product.id, product]),
)
const stepById = new Map(bundleCatalog.steps.map((step) => [step.id, step]))
const productBySku = new Map<Sku, BundleProduct>()
for (const product of bundleCatalog.products) {
  for (const sku of productSkus(product)) productBySku.set(sku, product)
}

export function getProductSkus(product: BundleProduct): readonly Sku[] {
  return productSkus(product)
}

export function getProductById(productId: ProductId): BundleProduct | undefined {
  return productById.get(productId)
}

export function getProductBySku(sku: Sku): BundleProduct | undefined {
  return productBySku.get(sku)
}

export function getStepById(stepId: StepId): BundleStep | undefined {
  return stepById.get(stepId)
}

export function getProductsForStep(stepId: StepId): readonly BundleProduct[] {
  return bundleCatalog.products.filter((product) => product.stepId === stepId)
}

export function getVariantBySku(
  product: VariantProduct,
  sku: Sku,
): ProductVariant | undefined {
  return product.variants.find((variant) => variant.sku === sku)
}

export function getReviewCategory(
  categoryId: ReviewCategoryId,
): ReviewCategory | undefined {
  return bundleCatalog.review.categories.find(
    (category) => category.id === categoryId,
  )
}

export function isKnownSku(sku: string): sku is Sku {
  return productBySku.has(sku)
}

export function isKnownStepId(stepId: string): stepId is StepId {
  return stepById.has(stepId)
}
