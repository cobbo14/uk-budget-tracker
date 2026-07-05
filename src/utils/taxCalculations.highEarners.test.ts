import { describe, it, expect } from 'vitest'
import { calculateTax } from './taxCalculations'
import rules2526 from '@/taxRules/2025-26'
import rules2627 from '@/taxRules/2026-27'
import type { IncomeSource, AppSettings } from '@/types'

// ─── Independent reference implementation (statutory rules) ─────────────────
//
// Personal Allowance: £12,570, tapered £1 per £2 of adjusted net income over
// £100,000 (gone at £125,140).
// Income tax bands on TAXABLE income (ITA 2007 s.10): basic rate limit
// £37,700, higher rate limit £125,140. The additional rate starts at £125,140
// of taxable income regardless of how much personal allowance remains.
// NI (2025/26 & 2026/27): 8% between £12,570 and £50,270, 2% above.

const PA = 12570
const TAPER_START = 100000
const BASIC_LIMIT = 37700
const HIGHER_LIMIT = 125140
const NI_PT = 12570
const NI_UEL = 50270

function refPersonalAllowance(adjustedNetIncome: number): number {
  return Math.max(0, PA - Math.floor(Math.max(0, adjustedNetIncome - TAPER_START) / 2))
}

function refIncomeTax(gross: number): number {
  const taxable = Math.max(0, gross - refPersonalAllowance(gross))
  const basic = Math.min(taxable, BASIC_LIMIT)
  const higher = Math.min(Math.max(0, taxable - BASIC_LIMIT), HIGHER_LIMIT - BASIC_LIMIT)
  const additional = Math.max(0, taxable - HIGHER_LIMIT)
  return basic * 0.20 + higher * 0.40 + additional * 0.45
}

function refNI(gross: number): number {
  const lower = Math.max(0, Math.min(gross, NI_UEL) - NI_PT)
  const upper = Math.max(0, gross - NI_UEL)
  return lower * 0.08 + upper * 0.02
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function job(grossAmount: number, bonus = 0): IncomeSource {
  return { id: '1', name: 'Job', type: 'employment', grossAmount, ...(bonus > 0 ? { bonus } : {}) }
}

describe('high earners £90k–£150k (salary + bonus)', () => {
  // ── Published worked examples (widely verified figures) ──────────────────
  it.each([
    // [gross, expected income tax, expected NI]
    [90000, 23432.00, 3810.60],
    [100000, 27432.00, 4010.60],
    [110000, 33432.00, 4210.60],   // 60% zone: PA £7,570
    [120000, 39432.00, 4410.60],
    [125140, 42516.00, 4513.40],   // PA fully gone, still no 45%
    [130000, 44703.00, 4610.60],   // 45% on £4,860 only
    [150000, 53703.00, 5010.60],
  ])('gross £%d → IT £%f, NI £%f', (gross, expectedIT, expectedNI) => {
    const r = calculateTax([job(gross)], baseSettings, rules2627)
    expect(r.incomeTax).toBeCloseTo(expectedIT, 2)
    expect(r.nationalInsurance).toBeCloseTo(expectedNI, 2)
  })

  // ── Full sweep against the reference implementation ──────────────────────
  it('matches the statutory reference for every £500 step from £90,000 to £150,000', () => {
    const failures: string[] = []
    for (let gross = 90000; gross <= 150000; gross += 500) {
      const r = calculateTax([job(gross)], baseSettings, rules2627)
      const expIT = refIncomeTax(gross)
      const expNI = refNI(gross)
      if (Math.abs(r.incomeTax - expIT) > 0.005) {
        failures.push(`£${gross}: IT ${r.incomeTax.toFixed(2)} ≠ ${expIT.toFixed(2)}`)
      }
      if (Math.abs(r.nationalInsurance - expNI) > 0.005) {
        failures.push(`£${gross}: NI ${r.nationalInsurance.toFixed(2)} ≠ ${expNI.toFixed(2)}`)
      }
    }
    expect(failures, failures.slice(0, 10).join('; ')).toEqual([])
  })

  it('2025/26 gives identical results (rUK thresholds frozen)', () => {
    for (let gross = 90000; gross <= 150000; gross += 5000) {
      const r = calculateTax([job(gross)], { ...baseSettings, taxYear: '2025-26' }, rules2526)
      expect(r.incomeTax, `IT at £${gross}`).toBeCloseTo(refIncomeTax(gross), 2)
      expect(r.nationalInsurance, `NI at £${gross}`).toBeCloseTo(refNI(gross), 2)
    }
  })

  // ── Salary/bonus split invariance ─────────────────────────────────────────
  it('salary/bonus split never changes total tax (same job, same annual total)', () => {
    for (const total of [95000, 105000, 118000, 126000, 140000, 150000]) {
      const allSalary = calculateTax([job(total)], baseSettings, rules2627)
      const withBonus = calculateTax([job(total - 20000, 20000)], baseSettings, rules2627)
      const bigBonus = calculateTax([job(90000, total - 90000)], baseSettings, rules2627)
      expect(withBonus.incomeTax, `IT split at £${total}`).toBeCloseTo(allSalary.incomeTax, 2)
      expect(withBonus.nationalInsurance, `NI split at £${total}`).toBeCloseTo(allSalary.nationalInsurance, 2)
      expect(bigBonus.incomeTax, `IT big bonus at £${total}`).toBeCloseTo(allSalary.incomeTax, 2)
      expect(bigBonus.nationalInsurance, `NI big bonus at £${total}`).toBeCloseTo(allSalary.nationalInsurance, 2)
      expect(withBonus.grossIncome).toBeCloseTo(total, 2)
    }
  })

  // ── Marginal rate structure ───────────────────────────────────────────────
  it('marginal income tax is 60% throughout the taper zone and 45% above £125,140', () => {
    // £100k–£125,140: 40% band + 20% from PA withdrawal = 60%
    for (const gross of [101000, 110000, 118000, 124000]) {
      const lo = calculateTax([job(gross)], baseSettings, rules2627)
      const hi = calculateTax([job(gross + 100)], baseSettings, rules2627)
      expect(hi.incomeTax - lo.incomeTax, `marginal at £${gross}`).toBeCloseTo(60, 2)
    }
    // Above £125,140: flat 45%
    for (const gross of [126000, 135000, 149000]) {
      const lo = calculateTax([job(gross)], baseSettings, rules2627)
      const hi = calculateTax([job(gross + 100)], baseSettings, rules2627)
      expect(hi.incomeTax - lo.incomeTax, `marginal at £${gross}`).toBeCloseTo(45, 2)
    }
  })

  it('personal allowance taper uses whole pounds (£1 per full £2 over)', () => {
    // £100,001 over by £1 → floor(1/2) = 0 reduction
    const r1 = calculateTax([job(100001)], baseSettings, rules2627)
    expect(r1.effectivePersonalAllowance).toBe(12570)
    // £100,003 over by £3 → reduction £1
    const r3 = calculateTax([job(100003)], baseSettings, rules2627)
    expect(r3.effectivePersonalAllowance).toBe(12569)
  })

  // ── SIPP restores the personal allowance in the taper zone ───────────────
  it('a gross £10,000 SIPP contribution at £110,000 restores the full PA', () => {
    // ANI = 110,000 − 10,000 = 100,000 → full PA. Taxable stays 110,000 − 12,570
    // = 97,430, but basic band extends to 47,700: 47,700×20% + 49,730×40% = £29,432
    const r = calculateTax(
      [job(110000)],
      { ...baseSettings, sippContribution: 8000 }, // £8,000 net = £10,000 gross
      rules2627,
    )
    expect(r.effectivePersonalAllowance).toBe(12570)
    expect(r.incomeTax).toBeCloseTo(47700 * 0.20 + 49730 * 0.40, 2)
  })

  // ── HICBC is fully clawed back everywhere in this income range ────────────
  it('child benefit is fully clawed back above £80,000', () => {
    const settings = { ...baseSettings, childBenefitClaiming: true, numberOfChildren: 2 }
    for (const gross of [90000, 110000, 150000]) {
      const r = calculateTax([job(gross)], settings, rules2627)
      expect(r.hicbc, `HICBC at £${gross}`).toBe(Math.round(r.childBenefitAnnual))
    }
  })
})
