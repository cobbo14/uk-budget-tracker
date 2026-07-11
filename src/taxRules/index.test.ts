import { describe, it, expect } from 'vitest'
import {
  getCurrentTaxYear, DEFAULT_TAX_YEAR, TAX_RULES,
  getPriorTaxYears, getCarryForwardCaps, formatTaxYearLabel,
} from './index'

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

describe('carry-forward year helpers', () => {
  it('lists the three prior years oldest first', () => {
    expect(getPriorTaxYears('2025-26')).toEqual(['2022-23', '2023-24', '2024-25'])
    expect(getPriorTaxYears('2026-27')).toEqual(['2023-24', '2024-25', '2025-26'])
  })

  it('caps each carry-forward year at its historic Annual Allowance', () => {
    // 2022/23 AA was £40,000; £60,000 from 2023/24
    expect(getCarryForwardCaps('2025-26')).toEqual({ threeYearsAgo: 40000, twoYearsAgo: 60000, oneYearAgo: 60000 })
    expect(getCarryForwardCaps('2026-27')).toEqual({ threeYearsAgo: 60000, twoYearsAgo: 60000, oneYearAgo: 60000 })
  })

  it('formats tax year labels for display', () => {
    expect(formatTaxYearLabel('2022-23')).toBe('2022/23')
  })
})
