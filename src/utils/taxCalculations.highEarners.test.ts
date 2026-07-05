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

// ─── Pension contributions in the £90k–£150k range ───────────────────────────

function sacrificeJob(grossAmount: number, pensionSacrifice: number): IncomeSource {
  return {
    id: '1', name: 'Job', type: 'employment', grossAmount,
    salarySacrificeItems: [
      { id: 's1', type: 'pension', name: 'Pension', annualAmount: pensionSacrifice, amountType: 'flat' },
    ],
  }
}

describe('pension contributions £90k–£150k', () => {
  it('net-pay gross £G and SIPP net £0.8G are exactly tax-equivalent', () => {
    // Same gross funding via either route must give identical net position,
    // personal allowance, adjusted net income and Annual Allowance funding.
    for (let salary = 95000; salary <= 150000; salary += 5000) {
      for (const grossContribution of [5000, 10000, 20000]) {
        const netPay = calculateTax(
          [job(salary)],
          { ...baseSettings, pensionContributionType: 'flat', pensionContributionValue: grossContribution },
          rules2627,
        )
        const ras = calculateTax(
          [job(salary)],
          { ...baseSettings, sippContribution: grossContribution * 0.8 },
          rules2627,
        )
        const at = `£${salary} / £${grossContribution}`
        expect(ras.netIncome, `netIncome ${at}`).toBeCloseTo(netPay.netIncome, 2)
        expect(ras.effectivePersonalAllowance, `PA ${at}`).toBeCloseTo(netPay.effectivePersonalAllowance, 2)
        expect(ras.adjustedNetIncome, `ANI ${at}`).toBeCloseTo(netPay.adjustedNetIncome, 2)
        expect(ras.totalPensionFunding, `AA funding ${at}`).toBeCloseTo(netPay.totalPensionFunding, 2)
      }
    }
  })

  it('a net-pay contribution in the taper zone earns 60% relief', () => {
    // £110,000: an extra £1,000 gross saves £400 tax + £200 via PA restoration
    const base = calculateTax([job(110000)], baseSettings, rules2627)
    const withPension = calculateTax(
      [job(110000)],
      { ...baseSettings, pensionContributionType: 'flat', pensionContributionValue: 1000 },
      rules2627,
    )
    expect(base.totalTax - withPension.totalTax).toBeCloseTo(600, 2)
  })

  it('salary sacrifice in the taper zone earns 62% relief (60% IT + 2% NI)', () => {
    const base = calculateTax([job(110000)], baseSettings, rules2627)
    const sacrificed = calculateTax([sacrificeJob(110000, 1000)], baseSettings, rules2627)
    expect(base.incomeTax - sacrificed.incomeTax).toBeCloseTo(600, 2)
    expect(base.nationalInsurance - sacrificed.nationalInsurance).toBeCloseTo(20, 2)
    expect(base.totalTax - sacrificed.totalTax).toBeCloseTo(620, 2)
  })

  it('£10,000 gross via net pay or salary sacrifice at £110k restores the full PA', () => {
    const netPay = calculateTax(
      [job(110000)],
      { ...baseSettings, pensionContributionType: 'flat', pensionContributionValue: 10000 },
      rules2627,
    )
    expect(netPay.effectivePersonalAllowance).toBe(12570)
    expect(netPay.incomeTax).toBeCloseTo(37700 * 0.20 + 49730 * 0.40, 2)  // £27,432

    const sacrificed = calculateTax([sacrificeJob(110000, 10000)], baseSettings, rules2627)
    expect(sacrificed.effectivePersonalAllowance).toBe(12570)
    expect(sacrificed.incomeTax).toBeCloseTo(27432, 2)
    expect(sacrificed.nationalInsurance).toBeCloseTo(37700 * 0.08 + 49730 * 0.02, 2) // £4,010.60
  })

  it('SIPP band extension interacts correctly with the additional rate at £150k', () => {
    // £16,000 SIPP → £20,000 gross. ANI £130k → PA still £0. Bands extend to
    // £57,700 / £145,140: 57,700×20% + 87,440×40% + 4,860×45% = £48,703
    const r = calculateTax(
      [job(150000)],
      { ...baseSettings, sippContribution: 16000 },
      rules2627,
    )
    expect(r.effectivePersonalAllowance).toBe(0)
    expect(r.incomeTax).toBeCloseTo(48703, 2)
  })

  it('pension contributions restore Child Benefit through the HICBC taper', () => {
    const cb = { ...baseSettings, childBenefitClaiming: true, numberOfChildren: 2 }
    const pension = (value: number) =>
      ({ ...cb, pensionContributionType: 'flat' as const, pensionContributionValue: value })
    // £95,000, CB (2 children) = £2,337.40/year
    const none = calculateTax([job(95000)], cb, rules2627)
    expect(none.hicbc).toBe(2337) // ANI £95k > £80k → full clawback
    const mid = calculateTax([job(95000)], pension(20001), rules2627)
    expect(mid.hicbc).toBe(Math.round(2337.40 * 0.74)) // ANI £74,999 → 74% charge
    const full = calculateTax([job(95000)], pension(35001), rules2627)
    expect(full.hicbc).toBe(0) // ANI £59,999 → below the £60k threshold
  })

  it('Annual Allowance excess is charged at the marginal rate on top of income', () => {
    // £130,000 salary, £70,000 net-pay contribution: ANI £60k → full PA,
    // taxable £47,430; excess £10,000 over the £60k AA → charged at 40%
    const s = { ...baseSettings, pensionContributionType: 'flat' as const, pensionContributionValue: 70000 }
    const r = calculateTax([job(130000)], s, rules2627)
    expect(r.effectivePersonalAllowance).toBe(12570)
    expect(r.incomeTax).toBeCloseTo(37700 * 0.20 + 9730 * 0.40, 2) // £11,432
    expect(r.annualAllowanceExcess).toBe(10000)
    expect(r.annualAllowanceCharge).toBeCloseTo(4000, 2)
    // £10,000 carry-forward absorbs the excess entirely
    const withCF = calculateTax(
      [job(130000)],
      { ...s, pensionCarryForward: { threeYearsAgo: 0, twoYearsAgo: 0, oneYearAgo: 10000 } },
      rules2627,
    )
    expect(withCF.annualAllowanceExcess).toBe(0)
    expect(withCF.annualAllowanceCharge).toBe(0)
  })

  it('employer contributions on qualifying earnings use the £6,240–£50,270 band per job', () => {
    const qualifying = (value: number) => ({
      ...baseSettings,
      employerPensionContributionType: 'qualifying' as const,
      employerPensionContributionValue: value,
    })
    // £95,000 salary: qualifying earnings capped at £50,270 − £6,240 = £44,030
    const single = calculateTax([job(95000)], qualifying(3), rules2627)
    expect(single.employerPensionFunding).toBeCloseTo(44030 * 0.03, 2) // £1,320.90
    expect(single.totalPensionFunding).toBeCloseTo(1320.90, 2)
    // Employer contributions never change the employee's own tax
    const base = calculateTax([job(95000)], baseSettings, rules2627)
    expect(single.incomeTax).toBeCloseTo(base.incomeTax, 2)
    expect(single.nationalInsurance).toBeCloseTo(base.nationalInsurance, 2)

    // Two jobs get a band each: £44,030 + (£30,000 − £6,240) = £67,790
    const twoJobs = calculateTax(
      [job(95000), { id: '2', name: 'Second job', type: 'employment', grossAmount: 30000 }],
      qualifying(3), rules2627,
    )
    expect(twoJobs.employerPensionFunding).toBeCloseTo(67790 * 0.03, 2) // £2,033.70

    // A job paying under £6,240 has no qualifying earnings
    const tinyJob = calculateTax(
      [job(95000), { id: '2', name: 'Side job', type: 'employment', grossAmount: 5000 }],
      qualifying(3), rules2627,
    )
    expect(tinyJob.employerPensionFunding).toBeCloseTo(44030 * 0.03, 2)

    // Salary sacrifice reduces qualifying pay: £95,000 − £50,000 = £45,000
    // → £45,000 − £6,240 = £38,760
    const sacrificed = calculateTax([sacrificeJob(95000, 50000)], qualifying(3), rules2627)
    expect(sacrificed.employerPensionFunding).toBeCloseTo(38760 * 0.03, 2) // £1,162.80
  })

  it('salary sacrifice on qualifying earnings resolves against pre-sacrifice pay incl. bonus', () => {
    // £90,000 salary + £10,000 bonus → QE = £50,270 − £6,240 = £44,030 (capped);
    // 5% sacrifice = £2,201.50
    const source: IncomeSource = {
      id: '1', name: 'Job', type: 'employment', grossAmount: 90000, bonus: 10000,
      salarySacrificeItems: [
        { id: 's1', type: 'pension', name: 'Pension', annualAmount: 5, amountType: 'qualifying' },
      ],
    }
    const base = calculateTax([job(90000, 10000)], baseSettings, rules2627)
    const r = calculateTax([source], baseSettings, rules2627)
    expect(r.salarySacrificeTotal).toBeCloseTo(2201.50, 2)
    expect(r.salarySacrificePension).toBeCloseTo(2201.50, 2)
    // Sacrifice saves NI at 2% here (pay above the UEL)
    expect(base.nationalInsurance - r.nationalInsurance).toBeCloseTo(2201.50 * 0.02, 2)
    expect(r.totalPensionFunding).toBeCloseTo(2201.50, 2)
  })

  it('SIPP as a percentage of qualifying earnings resolves to the net amount paid', () => {
    // £95,000: QE £44,030 → 3% = £1,320.90 net, £1,651.13 gross
    const r = calculateTax(
      [job(95000)],
      { ...baseSettings, sippContributionType: 'qualifying', sippContribution: 3 },
      rules2627,
    )
    expect(r.totalDeductions).toBeCloseTo(1320.90, 2)   // cash paid
    expect(r.sippNetContribution).toBeCloseTo(1320.90, 2)
    expect(r.sippGrossContribution).toBeCloseTo(1320.90 / 0.8, 2)
    expect(r.adjustedNetIncome).toBeCloseTo(95000 - 1320.90 / 0.8, 2)
    expect(r.totalPensionFunding).toBeCloseTo(1320.90 / 0.8, 2)
  })

  it('SIPP as a percentage of income resolves against pension-eligible income', () => {
    // £95,000 × 4% = £3,800 net, £4,750 gross
    const r = calculateTax(
      [job(95000)],
      { ...baseSettings, sippContributionType: 'percentage', sippContribution: 4 },
      rules2627,
    )
    expect(r.sippNetContribution).toBeCloseTo(3800, 2)
    expect(r.sippGrossContribution).toBeCloseTo(4750, 2)
  })

  it('workplace net-pay contribution on qualifying earnings', () => {
    // £95,000: QE £44,030 → 5% = £2,201.50 deducted from taxable income
    const base = calculateTax([job(95000)], baseSettings, rules2627)
    const r = calculateTax(
      [job(95000)],
      { ...baseSettings, pensionContributionType: 'qualifying', pensionContributionValue: 5 },
      rules2627,
    )
    expect(r.totalDeductions).toBeCloseTo(2201.50, 2)
    expect(base.incomeTax - r.incomeTax).toBeCloseTo(2201.50 * 0.40, 2) // 40% zone
    expect(r.nationalInsurance).toBeCloseTo(base.nationalInsurance, 2)  // no NI saving
  })

  it('caps a percentage net-pay contribution at 100% of relevant earnings', () => {
    const r = calculateTax(
      [job(110000)],
      { ...baseSettings, pensionContributionType: 'percentage', pensionContributionValue: 150 },
      rules2627,
    )
    expect(r.totalDeductions).toBeCloseTo(110000, 2) // not £165,000
    expect(r.incomeTax).toBe(0)
    expect(r.effectivePersonalAllowance).toBe(12570)
  })
})
