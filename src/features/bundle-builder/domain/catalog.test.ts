import { describe, expect, it } from 'vitest'

import {
  bundleCatalog,
  CatalogValidationError,
  parseBundleCatalog,
} from './catalog'

interface MutableCardDisplayPrice {
  priceCents: number
  compareAtCents?: number
}

interface MutableCatalogProduct {
  id: string
  cardDisplayPrice?: MutableCardDisplayPrice
  variants?: Array<{
    cardDisplayPrice?: MutableCardDisplayPrice
  }>
}

interface MutableCatalog {
  products: MutableCatalogProduct[]
}

function cloneCatalog(): MutableCatalog {
  return structuredClone(bundleCatalog) as unknown as MutableCatalog
}

describe('bundle catalog card display pricing', () => {
  it('parses presentation pricing for variants and single-SKU products', () => {
    const input = cloneCatalog()
    const doorbell = input.products.find(
      (product) => product.id === 'duo-cam-doorbell',
    )
    expect(doorbell).toBeDefined()
    doorbell!.cardDisplayPrice = {
      priceCents: 6_500,
      compareAtCents: 7_000,
    }

    const parsed = parseBundleCatalog(input)
    const camPan = parsed.products.find(
      (product) => product.id === 'cam-pan-v3',
    )
    const parsedDoorbell = parsed.products.find(
      (product) => product.id === 'duo-cam-doorbell',
    )

    expect(camPan?.kind).toBe('variant')
    if (camPan?.kind === 'variant') {
      expect(camPan.variants[0]?.cardDisplayPrice).toEqual({
        priceCents: 3_498,
        compareAtCents: 3_998,
      })
    }
    expect(parsedDoorbell?.kind).toBe('single')
    if (parsedDoorbell?.kind === 'single') {
      expect(parsedDoorbell.cardDisplayPrice).toEqual({
        priceCents: 6_500,
        compareAtCents: 7_000,
      })
    }
  })

  it('rejects a card comparison price below its displayed price', () => {
    const input = cloneCatalog()
    const camPan = input.products.find(
      (product) => product.id === 'cam-pan-v3',
    )
    expect(camPan?.variants?.[0]).toBeDefined()
    camPan!.variants![0]!.cardDisplayPrice = {
      priceCents: 4_000,
      compareAtCents: 3_999,
    }

    expect(() => parseBundleCatalog(input)).toThrowError(
      new CatalogValidationError(
        'products[1].variants[0].cardDisplayPrice.compareAtCents must be greater than or equal to priceCents',
      ),
    )
  })
})
