import { describe, it, expect } from 'vitest'
import { calculateTax } from './taxCalculations'
import {
  getThresholdAlerts, getPensionRecommendations, solveMaxContribution, compareContributionMethods,
} from './planningUtils'
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

// ─── Pension recommendations ─────────────────────────────────────────────────
// Scenario throughout: £110,000 salary, 2 children claiming Child Benefit,
// employer matches 100% up to 5% of pay, no current contributions (2026/27).
// Baseline: PA £7,570, IT £33,432, NI £4,210.60, HICBC £2,337 → total £39,979.60.

const richSettings: AppSettings = {
  ...baseSettings,
  childBenefitClaiming: true,
  numberOfChildren: 2,
  employerMatchRate: 100,
  employerMatchCapPercent: 5,
}

describe('getPensionRecommendations', () => {
  it('produces the expected ranked set at £110k with children and a match', () => {
    const recs = getPensionRecommendations([employment(110000)], richSettings, rules2627)
    expect(recs.map(r => r.id)).toEqual([
      'employer-match', 'keep-childcare', 'keep-child-benefit', 'use-annual-allowance',
    ])

    // Match: shortfall = 5% × £110,000 = £5,500; £1-for-£1 bonus £5,500;
    // tax saved in the 60% zone = £3,300 → net cost £2,200
    const match = recs[0]
    expect(match.extraContribution).toBe(5500)
    expect(match.employerBonus).toBeCloseTo(5500, 2)
    expect(match.taxSaved).toBeCloseTo(3300, 2)
    expect(match.netCost).toBeCloseTo(2200, 2)
    expect(match.effectiveReliefRate).toBeCloseTo((3300 + 5500) / 5500, 4) // 160%

    // Childcare/60% zone: extra £10,000 → tax saved £6,000 (60% relief)
    const childcare = recs[1]
    expect(childcare.extraContribution).toBe(10000)
    expect(childcare.taxSaved).toBeCloseTo(6000, 2)
    expect(childcare.effectiveReliefRate).toBeCloseTo(0.6, 4)
    expect(childcare.reason).toContain('Tax-Free Childcare')

    // Child Benefit: extra £50,000 → IT falls £22,000 + HICBC £2,337 removed
    const cb = recs[2]
    expect(cb.extraContribution).toBe(50000)
    expect(cb.taxSaved).toBeCloseTo(24337, 0)
    expect(cb.aaWarning).toBe(false) // within the £60k AA

    // AA: full £60,000 headroom available
    expect(recs[3].extraContribution).toBe(60000)
  })

  it('flags expiring carry-forward and omits irrelevant recommendations', () => {
    const recs = getPensionRecommendations(
      [employment(55000)],
      { ...baseSettings, pensionCarryForward: { threeYearsAgo: 8000, twoYearsAgo: 0, oneYearAgo: 0 } },
      rules2627,
    )
    // £55k, no children/CB/match: only stay-basic-rate and use-annual-allowance
    expect(recs.map(r => r.id)).toEqual(['stay-basic-rate', 'use-annual-allowance'])
    expect(recs[0].extraContribution).toBe(55000 - 50270)
    const aa = recs[1]
    expect(aa.expiringCarryForward).toBe(8000)
    expect(aa.reason).toContain('5 April 2027')
    // £55k income can't absorb £68k of allowance — capped at remaining eligible income
    expect(aa.extraContribution).toBe(55000)
  })
})

describe('solveMaxContribution', () => {
  it('finds the exact largest contribution that keeps the take-home target', () => {
    // £110k (no Child Benefit), target £60,000/yr take-home. Baseline net
    // £72,357.40. Net cost is 40p/£ up to £10k (60% zone) then 60p/£:
    // 68,357.40 − 0.6(c − 10,000) ≥ 60,000 → c = £23,929
    const result = solveMaxContribution(60000, [employment(110000)], baseSettings, rules2627)
    expect(result).not.toBeNull()
    expect(result!.contribution).toBe(23929)
    expect(result!.summary.netIncome).toBeGreaterThanOrEqual(60000)
  })

  it('returns null when the target is unreachable even now', () => {
    const result = solveMaxContribution(90000, [employment(110000)], baseSettings, rules2627)
    expect(result).toBeNull()
  })
})

describe('compareContributionMethods', () => {
  it('sacrifice beats net pay by exactly the NI saving; SIPP matches net pay', () => {
    // £110k, extra £10,000 gross via each route
    const [sacrifice, netPay, sipp] = compareContributionMethods(
      10000, [employment(110000)], baseSettings, rules2627,
    )
    expect(sacrifice.method).toBe('salary-sacrifice')
    expect(sacrifice.netCost).toBeCloseTo(3800, 2)   // 60% IT + 2% NI relief
    expect(netPay.method).toBe('net-pay')
    expect(netPay.netCost).toBeCloseTo(4000, 2)      // 60% IT relief only
    expect(sipp.method).toBe('sipp')
    expect(sipp.cashPaid).toBeCloseTo(8000, 2)       // provider adds the other £2,000
    expect(sipp.netCost).toBeCloseTo(4000, 2)        // tax-equivalent to net pay
  })

  it('only workplace routes capture an employer match', () => {
    const [sacrifice, netPay, sipp] = compareContributionMethods(
      5500, [employment(110000)], richSettings, rules2627,
    )
    expect(sacrifice.employerBonus).toBeCloseTo(5500, 2)
    expect(netPay.employerBonus).toBeCloseTo(5500, 2)
    expect(sipp.employerBonus).toBe(0)
  })
})
