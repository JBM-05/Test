import { describe, expect, it } from 'vitest'

import { formatCurrency } from './currency'

describe('formatCurrency', () => {
  it('formats integer cents using the catalog currency', () => {
    expect(formatCurrency(18_789)).toBe('$187.89')
  })

  it('formats zero without dropping decimal places', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })
})
