import { describe, it, expect } from 'vitest'
import { calculateTax } from './taxCalculations'
import { getThresholdAlerts } from './planningUtils'
import rules2627 from '@/taxRules/2026-27'
import type { IncomeSource, AppSettings } from '@/types'

const baseSettings: AppSettings = {
  taxYear: '2026-27',
  scottishTaxpayer: false,
  pensionContributionType: 'none',
  pensionContributionValue: 0,
  employerPensionContributionType: 'flat',
  employerPensionContributionValue: 0,
  sippContribution: 0,
  pensionCarryForward: { threeYearsAgo: 0, twoYearsAgo: 0, oneYearAgo: 0 },
  studentLoanPlan: 'none',
  hasPostgradLoan: false,
  giftAidDonations: 0,
  marriageAllowance: 'none',
  childBenefitClaiming: false,
  numberOfChildren: 0,
  isaContributions: { cashISA: 0, stocksAndSharesISA: 0, lisaISA: 0, innovativeFinanceISA: 0 },
  seisInvestment: 0,
  eisInvestment: 0,
  vctInvestment: 0,
  hasBlindPersonsAllowance: false,
  capitalLossCarryForward: 0,
  previousYearSaTaxBill: 0,
  badrLifetimeUsed: 0,
  partnerIncome: 0,
}

function employment(grossAmount: number): IncomeSource {
  return { id: '1', name: 'Job', type: 'employment', grossAmount }
}

describe('getThresholdAlerts — childcare £100k cliff', () => {
  const CLIFF = 'Childcare Support — £100k Cliff Edge'

  it('shows the cliff with headroom when a parent is below £100k', () => {
    const settings = { ...baseSettings, numberOfChildren: 2 }
    const t = calculateTax([employment(95000)], settings, rules2627)
    const alert = getThresholdAlerts(t, rules2627, settings).find(a => a.name === CLIFF)
    expect(alert).toBeDefined()
    expect(alert!.isOver).toBe(false)
    expect(alert!.isNear).toBe(true)
    expect(alert!.gap).toBe(5000)
  })

  it('flags the cliff as over with the pension needed to restore eligibility', () => {
    const settings = { ...baseSettings, numberOfChildren: 2 }
    const t = calculateTax([employment(105000)], settings, rules2627)
    const alert = getThresholdAlerts(t, rules2627, settings).find(a => a.name === CLIFF)
    expect(alert).toBeDefined()
    expect(alert!.isOver).toBe(true)
    expect(alert!.pensionToReach).toBe(5000)
  })

  it('does not show the cliff without children', () => {
    const t = calculateTax([employment(105000)], baseSettings, rules2627)
    const alert = getThresholdAlerts(t, rules2627, baseSettings).find(a => a.name === CLIFF)
    expect(alert).toBeUndefined()
  })
})
