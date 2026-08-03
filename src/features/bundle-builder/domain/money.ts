import { bundleCatalog } from './catalog'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: bundleCatalog.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(cents: number): string {
  return currencyFormatter.format(cents / 100)
}
