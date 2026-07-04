import { describe, it, expect } from 'vitest'
import { getCurrentTaxYear, DEFAULT_TAX_YEAR, TAX_RULES } from './index'

describe('getCurrentTaxYear', () => {
  it('rolls over on 6 April', () => {
    expect(getCurrentTaxYear(new Date(2026, 3, 5))).toBe('2025-26') // 5 Apr 2026
    expect(getCurrentTaxYear(new Date(2026, 3, 6))).toBe('2026-27') // 6 Apr 2026
    expect(getCurrentTaxYear(new Date(2026, 6, 2))).toBe('2026-27') // 2 Jul 2026
    expect(getCurrentTaxYear(new Date(2027, 0, 31))).toBe('2026-27') // 31 Jan 2027
  })

  it('defaults to a year we have rules for', () => {
    expect(TAX_RULES[DEFAULT_TAX_YEAR]).toBeDefined()
  })
})
