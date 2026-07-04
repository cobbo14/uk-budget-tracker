import { describe, it, expect } from 'vitest'
import { calculateTax } from './taxCalculations'
import rules from '@/taxRules/2025-26'
import rules2627 from '@/taxRules/2026-27'
import type { IncomeSource, GainSource, AppSettings } from '@/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

const defaultSettings: AppSettings = {
  taxYear: '2025-26',
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

function settings(overrides: Partial<AppSettings> = {}): AppSettings {
  return { ...defaultSettings, ...overrides }
}

function employment(grossAmount: number, id = '1'): IncomeSource {
  return { id, name: 'Employment', type: 'employment', grossAmount }
}

function selfEmployment(
  grossAmount: number,
  allowableExpenses = 0,
  id = '1',
): IncomeSource {
  return { id, name: 'Self-employment', type: 'self-employment', grossAmount, allowableExpenses }
}

function rental(
  grossAmount: number,
  rentalExpenses = 0,
  mortgageInterestAnnual = 0,
  id = '1',
): IncomeSource {
  return { id, name: 'Rental', type: 'rental', grossAmount, rentalExpenses, mortgageInterestAnnual }
}

function dividend(grossAmount: number, fromISA = false, id = '1'): IncomeSource {
  return { id, name: 'Dividends', type: 'dividend', grossAmount, fromISA }
}

function bond(grossAmount: number, yearsHeld = 1, id = '1'): IncomeSource {
  return { id, name: 'Bond', type: 'bond', grossAmount, yearsHeld }
}

function savings(grossAmount: number, id = '1'): IncomeSource {
  return { id, name: 'Savings', type: 'savings', grossAmount }
}

function gain(
  gainAmount: number,
  allowableCosts = 0,
  isBADR = false,
  isResidentialProperty = false,
  id = '1',
): GainSource {
  return { id, name: 'Gain', gainAmount, allowableCosts, isResidentialProperty, isBADR }
}

/** 2 decimal place monetary comparison */
function expectGBP(actual: number, expected: number) {
  expect(actual).toBeCloseTo(expected, 2)
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('calculateTax — 2025/26 rules', () => {

  // ── Zero income ───────────────────────────────────────────────────────────

  describe('zero income', () => {
    it('returns all zeros when there are no income sources', () => {
      const result = calculateTax([], defaultSettings, rules)
      expect(result.grossIncome).toBe(0)
      expect(result.incomeTax).toBe(0)
      expect(result.nationalInsurance).toBe(0)
      expect(result.dividendTax).toBe(0)
      expect(result.totalTax).toBe(0)
      expect(result.netIncome).toBe(0)
      expect(result.effectiveTaxRate).toBe(0)
      expect(result.effectivePersonalAllowance).toBe(12570)
    })
  })

  // ── Employment — basic rate ───────────────────────────────────────────────

  describe('employment income — basic rate', () => {
    // £30,000 salary
    // Taxable: £30,000 − £12,570 = £17,430
    // Income tax: £17,430 × 20% = £3,486
    // NI Class 1: (£30,000 − £12,570) × 8% = £17,430 × 8% = £1,394.40
    // Total tax: £4,880.40
    it('calculates income tax at basic rate', () => {
      const result = calculateTax([employment(30000)], defaultSettings, rules)
      expectGBP(result.incomeTax, 3486)
    })

    it('calculates NI Class 1 correctly', () => {
      const result = calculateTax([employment(30000)], defaultSettings, rules)
      expectGBP(result.class1NI, 1394.40)
      expect(result.class2NI).toBe(0)
      expect(result.class4NI).toBe(0)
    })

    it('has zero dividend tax', () => {
      const result = calculateTax([employment(30000)], defaultSettings, rules)
      expect(result.dividendTax).toBe(0)
    })

    it('calculates total tax and net income correctly', () => {
      const result = calculateTax([employment(30000)], defaultSettings, rules)
      expectGBP(result.totalTax, 4880.40)
      expectGBP(result.netIncome, 25119.60)
    })

    it('uses full personal allowance when income is below £100k', () => {
      const result = calculateTax([employment(30000)], defaultSettings, rules)
      expect(result.effectivePersonalAllowance).toBe(12570)
    })
  })

  // ── Employment — higher rate ──────────────────────────────────────────────

  describe('employment income — higher rate', () => {
    // £60,000 salary
    // Taxable: £60,000 − £12,570 = £47,430
    // Income tax: £37,700 × 20% + (£47,430 − £37,700) × 40%
    //           = £7,540 + £9,730 × 40% = £7,540 + £3,892 = £11,432
    // NI Class 1:
    //   lower: (£50,270 − £12,570) × 8% = £37,700 × 8% = £3,016
    //   upper: (£60,000 − £50,270) × 2% = £9,730 × 2%  = £194.60
    //   total: £3,210.60
    it('taxes income across basic and higher rate bands', () => {
      const result = calculateTax([employment(60000)], defaultSettings, rules)
      expectGBP(result.incomeTax, 11432)
    })

    it('calculates NI with upper band correctly', () => {
      const result = calculateTax([employment(60000)], defaultSettings, rules)
      expectGBP(result.class1NI, 3210.60)
    })

    it('calculates total tax', () => {
      const result = calculateTax([employment(60000)], defaultSettings, rules)
      expectGBP(result.totalTax, 14642.60)
    })
  })

  // ── Personal allowance taper ─────────────────────────────────────────────

  describe('personal allowance taper', () => {
    it('retains full personal allowance at exactly £100,000', () => {
      const result = calculateTax([employment(100000)], defaultSettings, rules)
      expect(result.effectivePersonalAllowance).toBe(12570)
    })

    it('tapers personal allowance above £100,000', () => {
      // £110,000: taper excess = £10,000 → PA reduction = £5,000 → effective PA = £7,570
      const result = calculateTax([employment(110000)], defaultSettings, rules)
      expect(result.effectivePersonalAllowance).toBe(7570)
    })

    it('increases income tax when personal allowance is tapered', () => {
      // Taxable income: £110,000 − £7,570 = £102,430
      // Income tax: £37,700 × 20% + (£102,430 − £37,700) × 40%
      //           = £7,540 + £64,730 × 40% = £7,540 + £25,892 = £33,432
      const result = calculateTax([employment(110000)], defaultSettings, rules)
      expectGBP(result.incomeTax, 33432)
    })

    it('reaches zero personal allowance at £125,140', () => {
      // taper excess = £125,140 − £100,000 = £25,140 → floor(25140/2) = £12,570 → PA = £0
      const result = calculateTax([employment(125140)], defaultSettings, rules)
      expect(result.effectivePersonalAllowance).toBe(0)
    })

    it('keeps personal allowance at zero for income beyond £125,140', () => {
      const result = calculateTax([employment(150000)], defaultSettings, rules)
      expect(result.effectivePersonalAllowance).toBe(0)
    })

    it('taxes at additional rate for income above £112,570 of taxable income', () => {
      // At £125,140 with zero PA: taxable = £125,140
      // Income tax: £37,700 × 20% + (£112,570 − £37,700) × 40% + (£125,140 − £112,570) × 45%
      //           = £7,540 + £74,870 × 40% + £12,570 × 45%
      //           = £7,540 + £29,948 + £5,656.50 = £43,144.50
      const result = calculateTax([employment(125140)], defaultSettings, rules)
      expectGBP(result.incomeTax, 43144.50)
    })
  })

  // ── Self-employment ───────────────────────────────────────────────────────

  describe('self-employment income', () => {
    // Gross: £50,000, expenses: £10,000 → profit: £40,000
    // Taxable: £40,000 − £12,570 = £27,430
    // Income tax: £27,430 × 20% = £5,486
    // NI Class 4: (£40,000 − £12,570) × 6% = £27,430 × 6% = £1,645.80
    // NI Class 2: £0 — compulsory Class 2 abolished from April 2024
    // Total tax: £7,131.80
    it('deducts allowable expenses from taxable profit', () => {
      const result = calculateTax([selfEmployment(50000, 10000)], defaultSettings, rules)
      expect(result.selfEmploymentAllowableExpenses).toBe(10000)
      expectGBP(result.incomeTax, 5486)
    })

    it('calculates NI Class 4 on profit', () => {
      const result = calculateTax([selfEmployment(50000, 10000)], defaultSettings, rules)
      expectGBP(result.class4NI, 1645.80)
    })

    it('never charges compulsory Class 2 NI (abolished from April 2024)', () => {
      const above = calculateTax([selfEmployment(50000, 10000)], defaultSettings, rules)
      expect(above.class2NI).toBe(0)
      // Profit: £5,000 < £6,845 small profits threshold — also zero
      const below = calculateTax([selfEmployment(5000)], defaultSettings, rules)
      expect(below.class2NI).toBe(0)
    })

    it('does not charge Class 4 NI when profit is below lower threshold', () => {
      // Profit: £10,000 < £12,570
      const result = calculateTax([selfEmployment(10000)], defaultSettings, rules)
      expect(result.class4NI).toBe(0)
    })

    it('calculates total tax and net income', () => {
      const result = calculateTax([selfEmployment(50000, 10000)], defaultSettings, rules)
      expectGBP(result.totalTax, 7131.80)
      // Net: £50,000 (gross) − £10,000 (expenses) − £7,131.80 (tax) = £32,868.20
      expectGBP(result.netIncome, 32868.20)
    })
  })

  // ── Rental income ─────────────────────────────────────────────────────────

  describe('rental income', () => {
    // Gross: £30,000, expenses: £5,000, mortgage interest: £8,000
    // Rental net (before mortgage): £30,000 − max(£5,000, £1,000) = £25,000
    // Taxable: £25,000 − £12,570 = £12,430
    // Income tax: £12,430 × 20% = £2,486
    // Mortgage tax credit: £8,000 × 20% = £1,600
    // Total tax: max(0, £2,486 − £1,600) = £886
    it('uses actual expenses when higher than property allowance', () => {
      const result = calculateTax([rental(30000, 5000, 8000)], defaultSettings, rules)
      expect(result.rentalAllowableExpenses).toBe(5000)
    })

    it('calculates mortgage interest as a 20% tax credit', () => {
      const result = calculateTax([rental(30000, 5000, 8000)], defaultSettings, rules)
      expectGBP(result.mortgageTaxCredit, 1600)
    })

    it('reduces total tax by the mortgage credit', () => {
      const result = calculateTax([rental(30000, 5000, 8000)], defaultSettings, rules)
      expectGBP(result.incomeTax, 2486)
      expectGBP(result.totalTax, 886) // £2,486 − £1,600
    })

    it('uses property allowance when no expenses are claimed', () => {
      // Gross: £8,000, no expenses
      // rentalNet = £8,000 − max(0, £1,000) = £7,000
      // Taxable: £7,000 − £12,570 → £0 (below PA)
      const result = calculateTax([rental(8000, 0, 0)], defaultSettings, rules)
      expect(result.incomeTax).toBe(0)
    })
  })

  // ── Dividend income ───────────────────────────────────────────────────────

  describe('dividend income', () => {
    it('charges no dividend tax when dividends are within the £500 allowance', () => {
      const result = calculateTax([dividend(400)], defaultSettings, rules)
      expect(result.dividendTax).toBe(0)
    })

    it('charges dividend basic rate on dividends above the allowance in the basic rate band', () => {
      // Employment £20,000, dividends £5,000
      // taxableNonDividend: £20,000 − £12,570 = £7,430
      // dividendAfterAllowance: £5,000 − £500 = £4,500
      // All dividends fall in basic rate band (bandSpaceUsed = £7,430, band capacity = £37,700)
      // dividendTax: £4,500 × 8.75% = £393.75
      const result = calculateTax(
        [employment(20000), dividend(5000, false, '2')],
        defaultSettings,
        rules,
      )
      expectGBP(result.dividendTax, 393.75)
    })

    it('charges dividend higher rate when dividends push into the higher rate band', () => {
      // Employment £40,000, dividends £3,000
      // taxableNonDividend: £40,000 − £12,570 = £27,430
      // bandSpaceUsed = £27,430; basic rate band remaining = £37,700 − £27,430 = £10,270
      // dividendAfterAllowance: £3,000 − £500 = £2,500
      // All £2,500 falls in basic band → dividendTax = £2,500 × 8.75% = £218.75
      const result = calculateTax(
        [employment(40000), dividend(3000, false, '2')],
        defaultSettings,
        rules,
      )
      expectGBP(result.dividendTax, 218.75)
    })

    it('excludes ISA dividends from all calculations', () => {
      const result = calculateTax([dividend(10000, true)], defaultSettings, rules)
      expect(result.dividendGross).toBe(0)
      expect(result.dividendTax).toBe(0)
      expect(result.grossIncome).toBe(0)
    })
  })

  // ── Scottish taxpayer ─────────────────────────────────────────────────────

  describe('Scottish taxpayer', () => {
    // £30,000: taxable = £17,430
    // Scottish tax:
    //   £2,827 × 19%    = £537.13
    //   £12,094 × 20%   = £2,418.80  (£14,921 − £2,827)
    //   £2,509 × 21%    = £526.89    (£17,430 − £14,921)
    //   Total           = £3,482.82
    it('uses Scottish income tax bands', () => {
      const result = calculateTax(
        [employment(30000)],
        settings({ scottishTaxpayer: true }),
        rules,
      )
      expectGBP(result.incomeTax, 3482.82)
    })

    it('produces different income tax to non-Scottish at the same salary', () => {
      const scottish = calculateTax([employment(30000)], settings({ scottishTaxpayer: true }), rules)
      const english = calculateTax([employment(30000)], defaultSettings, rules)
      expect(scottish.incomeTax).not.toBeCloseTo(english.incomeTax, 0)
    })

    it('still applies standard NI (not affected by Scottish rates)', () => {
      const scottish = calculateTax([employment(30000)], settings({ scottishTaxpayer: true }), rules)
      const english = calculateTax([employment(30000)], defaultSettings, rules)
      expectGBP(scottish.class1NI, english.class1NI)
    })
  })

  // ── Student loan ──────────────────────────────────────────────────────────

  describe('student loan repayments', () => {
    it('does not deduct student loan when plan is none', () => {
      const result = calculateTax([employment(40000)], defaultSettings, rules)
      expect(result.studentLoan).toBe(0)
    })

    it('calculates Plan 2 repayment correctly', () => {
      // Plan 2 threshold: £28,470; rate: 9%
      // Income £40,000: (£40,000 − £28,470) × 9% = £11,530 × 9% = £1,037.70
      const result = calculateTax(
        [employment(40000)],
        settings({ studentLoanPlan: 'plan2' }),
        rules,
      )
      expectGBP(result.studentLoan, 1037.70)
    })

    it('calculates Plan 1 repayment correctly', () => {
      // Plan 1 threshold: £26,065; rate: 9%
      // Income £40,000: (£40,000 − £26,065) × 9% = £13,935 × 9% = £1,254.15
      const result = calculateTax(
        [employment(40000)],
        settings({ studentLoanPlan: 'plan1' }),
        rules,
      )
      expectGBP(result.studentLoan, 1254.15)
    })

    it('calculates Plan 4 repayment correctly', () => {
      // Plan 4 threshold: £32,745; rate: 9%
      // Income £40,000: (£40,000 − £32,745) × 9% = £7,255 × 9% = £652.95
      const result = calculateTax(
        [employment(40000)],
        settings({ studentLoanPlan: 'plan4' }),
        rules,
      )
      expectGBP(result.studentLoan, 652.95)
    })

    it('calculates Postgraduate loan repayment correctly', () => {
      // Postgrad threshold: £21,000; rate: 6%
      // Income £40,000: (£40,000 − £21,000) × 6% = £19,000 × 6% = £1,140
      const result = calculateTax(
        [employment(40000)],
        settings({ studentLoanPlan: 'postgrad' }),
        rules,
      )
      expectGBP(result.studentLoan, 1140)
    })

    it('charges no repayment when income is below threshold', () => {
      // Plan 2 threshold: £28,470; income: £25,000
      const result = calculateTax(
        [employment(25000)],
        settings({ studentLoanPlan: 'plan2' }),
        rules,
      )
      expect(result.studentLoan).toBe(0)
    })
  })

  // ── Pension contributions ─────────────────────────────────────────────────

  describe('pension contributions', () => {
    it('deducts a percentage pension contribution from taxable income', () => {
      // Employment £50,000, 5% pension → deduction = £2,500
      // Adjusted net income: £47,500; taxable: £47,500 − £12,570 = £34,930
      // Income tax: £34,930 × 20% = £6,986
      const result = calculateTax(
        [employment(50000)],
        settings({ pensionContributionType: 'percentage', pensionContributionValue: 5 }),
        rules,
      )
      expect(result.totalDeductions).toBe(2500)
      expectGBP(result.incomeTax, 6986)
    })

    it('deducts a flat pension contribution from taxable income', () => {
      // Employment £60,000, flat £5,000 pension
      // Adjusted net income: £55,000; taxable: £55,000 − £12,570 = £42,430
      // Income tax: £37,700 × 20% + (£42,430 − £37,700) × 40%
      //           = £7,540 + £4,730 × 40% = £7,540 + £1,892 = £9,432
      const result = calculateTax(
        [employment(60000)],
        settings({ pensionContributionType: 'flat', pensionContributionValue: 5000 }),
        rules,
      )
      expect(result.totalDeductions).toBe(5000)
      expectGBP(result.incomeTax, 9432)
    })

    it('pension contribution can reduce income below higher rate threshold', () => {
      // Employment £55,000, flat £10,000 pension → adjusted = £45,000
      // Taxable: £45,000 − £12,570 = £32,430 (stays in basic rate band)
      // Income tax: £32,430 × 20% = £6,486
      const result = calculateTax(
        [employment(55000)],
        settings({ pensionContributionType: 'flat', pensionContributionValue: 10000 }),
        rules,
      )
      expectGBP(result.incomeTax, 6486)
    })
  })

  // ── Combined income ───────────────────────────────────────────────────────

  describe('combined income sources', () => {
    // Employment: £20,000
    // Self-employment: £15,000 gross, £3,000 expenses → profit £12,000
    // Dividends: £2,000
    //
    // totalNonDividendGross: £20,000 + £12,000 = £32,000
    // adjustedTotal: £32,000 + £2,000 = £34,000 (no taper)
    // taxableNonDividend: £32,000 − £12,570 = £19,430
    // Income tax: £19,430 × 20% = £3,886
    //
    // NI Class 1 (employment £20,000): (£20,000 − £12,570) × 8% = £594.40
    // NI Class 4 (SE profit £12,000 < lower threshold £12,570): £0
    // NI Class 2: £0 — compulsory Class 2 abolished from April 2024
    //
    // dividendAfterAllowance: £2,000 − £500 = £1,500
    // bandSpaceUsed = £19,430; basic band remaining = £37,700 − £19,430 = £18,270
    // dividendTax: £1,500 × 8.75% = £131.25
    //
    // Total tax: £3,886 + £594.40 + £131.25 = £4,611.65
    // Net: (£20,000 + £15,000 + £2,000) − £3,000 (SE expenses) − £4,611.65 = £29,388.35
    it('combines employment, self-employment and dividend income correctly', () => {
      const sources = [
        employment(20000, '1'),
        selfEmployment(15000, 3000, '2'),
        dividend(2000, false, '3'),
      ]
      const result = calculateTax(sources, defaultSettings, rules)

      expect(result.grossIncome).toBe(37000)
      expectGBP(result.incomeTax, 3886)
      expectGBP(result.class1NI, 594.40)
      expect(result.class4NI).toBe(0)
      expect(result.class2NI).toBe(0)
      expectGBP(result.dividendTax, 131.25)
      expectGBP(result.totalTax, 4611.65)
      expectGBP(result.netIncome, 29388.35)
    })

    it('multiple employment sources are summed', () => {
      const result = calculateTax(
        [employment(20000, '1'), employment(10000, '2')],
        defaultSettings,
        rules,
      )
      expect(result.employmentGross).toBe(30000)
      expect(result.grossIncome).toBe(30000)
    })
  })

  // ── Effective tax rate ────────────────────────────────────────────────────

  describe('effective tax rate', () => {
    it('is zero when there is no income', () => {
      const result = calculateTax([], defaultSettings, rules)
      expect(result.effectiveTaxRate).toBe(0)
    })

    it('is between 0 and 1 for positive income', () => {
      const result = calculateTax([employment(50000)], defaultSettings, rules)
      expect(result.effectiveTaxRate).toBeGreaterThan(0)
      expect(result.effectiveTaxRate).toBeLessThan(1)
    })

    it('is total tax divided by gross income', () => {
      const result = calculateTax([employment(50000)], defaultSettings, rules)
      expectGBP(result.effectiveTaxRate, result.totalTax / result.grossIncome)
    })
  })

  // ── Edge cases ────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles income exactly at the personal allowance with zero tax', () => {
      const result = calculateTax([employment(12570)], defaultSettings, rules)
      expect(result.incomeTax).toBe(0)
      // NI: £0 (at exactly primary threshold)
      expect(result.class1NI).toBe(0)
    })

    it('handles income £1 above the personal allowance', () => {
      const result = calculateTax([employment(12571)], defaultSettings, rules)
      expectGBP(result.incomeTax, 0.20) // £1 × 20%
    })

    it('total tax cannot go below zero even with large mortgage credits', () => {
      // Very large mortgage interest relative to rental income
      const result = calculateTax([rental(5000, 0, 50000)], defaultSettings, rules)
      expect(result.totalTax).toBeGreaterThanOrEqual(0)
    })

    it('treats self-employment with zero expenses the same as zero expenses', () => {
      const withZero = calculateTax([selfEmployment(30000, 0)], defaultSettings, rules)
      const withUndefined = calculateTax(
        [{ id: '1', name: 'SE', type: 'self-employment', grossAmount: 30000 }],
        defaultSettings,
        rules,
      )
      expect(withZero.incomeTax).toBeCloseTo(withUndefined.incomeTax, 2)
    })
  })

  // ── BADR (Business Asset Disposal Relief) ─────────────────────────────────

  describe('BADR — capital gains tax', () => {
    it('applies BADR rate (14%) to qualifying gain', () => {
      // Net gain = £15,000; AEA = £3,000 applied first; taxable BADR = £12,000
      // BADR tax: £12,000 × 14% = £1,680
      const result = calculateTax([], defaultSettings, rules, [gain(20000, 5000, true)])
      expectGBP(result.badrGains, 12000)
      expectGBP(result.badrTax, 1680)
      expectGBP(result.capitalGainsTax, 1680)
    })

    it('applies regular CGT basic rate (18%) to non-BADR gain with no other income', () => {
      // Net gain = £15,000; AEA = £3,000; taxable = £12,000; CGT = £12,000 × 18% = £2,160
      const result = calculateTax([], defaultSettings, rules, [gain(20000, 5000, false)])
      expect(result.badrGains).toBe(0)
      expect(result.badrTax).toBe(0)
      expectGBP(result.capitalGainsTax, 2160)
    })

    it('applies carry-forward losses to non-BADR gains first to maximise BADR benefit', () => {
      // BADR net: £20,000; non-BADR net: £10,000; losses: £8,000
      // Losses absorbed by non-BADR: nonBadrAfterLosses = £2,000
      // AEA: £2,000 to non-BADR; £1,000 remainder to BADR
      // taxableNonBadr = £0; taxableBadrGain = £20,000 − £1,000 = £19,000
      // BADR tax: £19,000 × 14% = £2,660; regularCgt = £0
      const result = calculateTax(
        [],
        settings({ capitalLossCarryForward: 8000 }),
        rules,
        [gain(20000, 0, true, false, '1'), gain(10000, 0, false, false, '2')],
      )
      expectGBP(result.carryForwardLossesApplied, 8000)
      expectGBP(result.badrGains, 19000)
      expectGBP(result.capitalGainsTax, 2660)
    })

    it('limits qualifying BADR gain by remaining lifetime allowance', () => {
      // BADR gain: £500,000; badrLifetimeUsed: £800,000; remaining: £200,000
      // taxableBadrGainFull = £500,000 − £3,000 AEA = £497,000
      // qualifyingBadrGain = min(£497,000, £200,000) = £200,000; overLimit = £297,000
      // badrTax = £200,000 × 14% = £28,000
      // regularCgt: £37,700 × 18% + £259,300 × 24% = £6,786 + £62,232 = £69,018
      const result = calculateTax(
        [],
        settings({ badrLifetimeUsed: 800000 }),
        rules,
        [gain(500000, 0, true)],
      )
      expectGBP(result.badrGains, 200000)
      expectGBP(result.badrTax, 28000)
      expectGBP(result.capitalGainsTax, 97018)
    })
  })

  // ── Bond income & top-slicing relief ──────────────────────────────────────

  describe('bond income and top-slicing relief', () => {
    it('includes bond income in grossIncome', () => {
      const result = calculateTax([employment(30000, '1'), bond(2000, 1, '2')], defaultSettings, rules)
      expect(result.grossIncome).toBe(32000)
      expect(result.bondIncome).toBe(2000)
    })

    it('applies no income tax when bond income alone falls within personal allowance', () => {
      const result = calculateTax([bond(5000)], defaultSettings, rules)
      expect(result.incomeTax).toBe(0)
    })

    it('5-year hold produces more top-slicing relief than 1-year hold', () => {
      // Employment £45,000 + bond £20,000 pushes into higher-rate band
      // 5-year: annual slice (£4,000) stays in basic-rate band → large relief
      // 1-year: full slice (£20,000) straddles bands → smaller relief
      const result5yr = calculateTax(
        [employment(45000, '1'), bond(20000, 5, '2')],
        defaultSettings,
        rules,
      )
      const result1yr = calculateTax(
        [employment(45000, '1'), bond(20000, 1, '2')],
        defaultSettings,
        rules,
      )
      expect(result5yr.bondTopSlicingRelief).toBeGreaterThan(result1yr.bondTopSlicingRelief)
      expect(result5yr.incomeTax).toBeLessThan(result1yr.incomeTax)
    })

    it('calculates top-slicing relief and net income tax for 5-year hold', () => {
      // Employment £45,000 + bond £20,000 (5-year hold)
      // Bond gains are savings income: PSA £500 covers part of the gain (higher-rate tier)
      // taxableNonSavings = £45,000 − £12,570 = £32,430 → IT £6,486
      // bond taxable after PSA = £19,500; the £500 PSA is a nil-rate band so it
      // still consumes band space: taxed gain stacks from £32,930
      // savingsTax: £4,770 × 20% + £14,730 × 40% = £954 + £5,892 = £6,846
      // top-slicing: taxedGain £19,500, slice £3,900 → marginal £780/slice
      // relief = £6,846 − £780 × 5 = £2,946
      // incomeTaxAfterRelief = (£6,486 + £6,846) − £2,946 = £10,386
      const result = calculateTax(
        [employment(45000, '1'), bond(20000, 5, '2')],
        defaultSettings,
        rules,
      )
      expectGBP(result.bondTopSlicingRelief, 2946)
      expectGBP(result.incomeTax, 10386)
      expectGBP(result.savingsAllowanceApplied, 500)
    })
  })

  // ── Money Purchase Annual Allowance (MPAA) ───────────────────────────────

  describe('MPAA — Money Purchase Annual Allowance', () => {
    it('limits AA to £10,000 when MPAA is active', () => {
      const result = calculateTax(
        [employment(80000)],
        settings({
          hasMPAA: true,
          pensionContributionType: 'flat',
          pensionContributionValue: 15000,
        }),
        rules,
      )
      expect(result.effectiveAnnualAllowance).toBe(10000)
      expect(result.annualAllowanceExcess).toBe(5000) // 15k - 10k
      expect(result.annualAllowanceCharge).toBeGreaterThan(0)
    })

    it('does not apply taper when MPAA is active', () => {
      const result = calculateTax(
        [employment(300000)],
        settings({
          hasMPAA: true,
          pensionContributionType: 'flat',
          pensionContributionValue: 5000,
        }),
        rules,
      )
      // MPAA always £10k regardless of income level
      expect(result.effectiveAnnualAllowance).toBe(10000)
    })

    it('uses standard AA when MPAA is not active', () => {
      const result = calculateTax(
        [employment(80000)],
        settings({
          hasMPAA: false,
          pensionContributionType: 'flat',
          pensionContributionValue: 15000,
        }),
        rules,
      )
      expect(result.effectiveAnnualAllowance).toBe(60000)
      expect(result.annualAllowanceExcess).toBe(0)
    })
  })

  // ── Basis period reform — transitional profit spread ──────────────────────

  describe('basis period reform — transitional profit spread', () => {
    it('adds the transitional spread to self-employment taxable profit', () => {
      // SE gross £40,000, expenses £5,000 → base profit £35,000
      // spread £6,000 → effective profit £41,000
      // taxable: £41,000 − £12,570 = £28,430; income tax: £28,430 × 20% = £5,686
      const result = calculateTax(
        [selfEmployment(40000, 5000)],
        settings({ transitionalProfitSpread: 6000 }),
        rules,
      )
      expectGBP(result.incomeTax, 5686)
    })

    it('transitional spread increases income tax and Class 4 NI by the correct amounts', () => {
      // Extra £6,000 profit: income tax +£1,200 (20%), Class 4 NI +£360 (6%)
      const without = calculateTax([selfEmployment(40000, 5000)], defaultSettings, rules)
      const withSpread = calculateTax(
        [selfEmployment(40000, 5000)],
        settings({ transitionalProfitSpread: 6000 }),
        rules,
      )
      expectGBP(withSpread.incomeTax - without.incomeTax, 1200)
      expectGBP(withSpread.class4NI - without.class4NI, 360)
    })
  })

  // ── Personal Savings Allowance ──────────────────────────────────────────────

  describe('personal savings allowance', () => {
    it('gives £1,000 PSA to a basic rate taxpayer', () => {
      // Employment £20,000, savings £3,000
      // taxableNonDividend: £20,000 − £12,570 = £7,430 (basic rate)
      // taxableSavings: £3,000 (PA fully consumed by employment)
      // PSA = £1,000 → taxable savings = £2,000
      // Savings tax: £2,000 × 20% = £400
      const result = calculateTax(
        [employment(20000, '1'), savings(3000, '2')],
        defaultSettings,
        rules,
      )
      expectGBP(result.savingsAllowanceApplied, 1000)
    })

    it('gives £500 PSA to a higher rate taxpayer', () => {
      // Employment £60,000, savings £2,000
      // taxableNonDividend: £47,430 (higher rate)
      // PSA = £500
      const result = calculateTax(
        [employment(60000, '1'), savings(2000, '2')],
        defaultSettings,
        rules,
      )
      expectGBP(result.savingsAllowanceApplied, 500)
    })

    it('gives £0 PSA when total taxable income exceeds additional rate threshold', () => {
      // Employment £130,000 (PA tapered to £0), savings £5,000
      // taxableNonDividend: £130,000
      // totalTaxableForPSA: £130,000 + £5,000 > £112,570 → PSA = £0
      const result = calculateTax(
        [employment(130000, '1'), savings(5000, '2')],
        defaultSettings,
        rules,
      )
      expectGBP(result.savingsAllowanceApplied, 0)
    })

    it('gives £0 PSA when savings + dividends push total above additional rate', () => {
      // Employment £100,000 (PA = £12,570), savings £10,000, dividends £20,000
      // taxableNonDividend: £87,430
      // taxableSavings: £10,000
      // taxableDividendsForPSA: £20,000 − £500 = £19,500
      // total: £87,430 + £10,000 + £19,500 = £116,930 > £112,570 → PSA = £0
      const result = calculateTax(
        [employment(100000, '1'), savings(10000, '2'), dividend(20000, false, '3')],
        defaultSettings,
        rules,
      )
      expectGBP(result.savingsAllowanceApplied, 0)
    })
  })
})

// ─── Income layering, starting rate, RAS relief ──────────────────────────────

describe('starting rate for savings', () => {
  it('applies the 0% starting rate for low earners with interest', () => {
    // Employment £13,000 + savings £6,000
    // taxableNonSavings = £430 → IT £86
    // starting rate band = £5,000 − £430 = £4,570 (covers £4,570 of interest)
    // PSA (basic, £1,000) covers £1,000 → taxed savings = £430 × 20% = £86
    const result = calculateTax([employment(13000, '1'), savings(6000, '2')], defaultSettings, rules)
    expectGBP(result.startingSavingsRateApplied, 4570)
    expectGBP(result.savingsAllowanceApplied, 1000)
    expectGBP(result.savingsTax, 86)
    expectGBP(result.incomeTax, 172)
  })

  it('gives no starting rate when non-savings income exceeds £17,570', () => {
    const result = calculateTax([employment(20000, '1'), savings(3000, '2')], defaultSettings, rules)
    expect(result.startingSavingsRateApplied).toBe(0)
  })
})

describe('Scottish taxpayers — savings and dividends use rUK bands', () => {
  it('taxes savings interest at rUK rates for a Scottish taxpayer', () => {
    // Scottish, employment £60,000 + savings £5,000
    // PSA £500 (higher tier); taxed savings £4,500 stack above £47,430 of
    // non-savings income → all in rUK higher band: £4,500 × 40% = £1,800
    // (Scottish Higher would give 42% = £1,890)
    const result = calculateTax(
      [employment(60000, '1'), savings(5000, '2')],
      settings({ scottishTaxpayer: true }),
      rules,
    )
    expectGBP(result.savingsTax, 1800)
  })
})

describe('personal allowance spills to dividends', () => {
  it('covers dividends with unused personal allowance', () => {
    // Dividends only £20,000: PA £12,570 + allowance £500 → taxable £6,930
    // £6,930 × 8.75% = £606.38
    const result = calculateTax([dividend(20000)], defaultSettings, rules)
    expectGBP(result.dividendTax, 606.38)
  })
})

describe('SIPP — relief at source', () => {
  it('extends the basic-rate band by the gross contribution instead of deducting income', () => {
    // Employment £60,000, SIPP £800 net → £1,000 gross
    // Basic band: £37,700 + £1,000 = £38,700
    // IT: £38,700 × 20% + £8,730 × 40% = £7,740 + £3,492 = £11,232
    // (without SIPP: £11,432 → SA saving £200, plus £200 claimed by provider)
    const result = calculateTax(
      [employment(60000)],
      settings({ sippContribution: 800 }),
      rules,
    )
    expectGBP(result.incomeTax, 11232)
    expectGBP(result.sippGrossContribution, 1000)
    // Annual Allowance counts the gross contribution
    expectGBP(result.totalPensionFunding, 1000)
    // ANI is reduced by the gross contribution (for taper/HICBC)
    expectGBP(result.adjustedNetIncome, 59000)
  })
})

describe('Gift Aid — single relief via band extension', () => {
  it('gives higher-rate relief once, not as both deduction and band extension', () => {
    // Employment £60,000, Gift Aid £800 net → £1,000 grossed up
    // IT: £38,700 × 20% + £8,730 × 40% = £11,232 (saving £200 vs no donation)
    const result = calculateTax(
      [employment(60000)],
      settings({ giftAidDonations: 800 }),
      rules,
    )
    expectGBP(result.incomeTax, 11232)
    expectGBP(result.giftAidRelief, 200)
    expectGBP(result.adjustedNetIncome, 59000)
  })
})

describe('pension taper threshold income', () => {
  it('gross SIPP contributions reduce threshold income below £200k (no taper)', () => {
    // Employment £210,000, SIPP £12,000 net → £15,000 gross
    // threshold income = £210,000 − £15,000 = £195,000 ≤ £200,000 → no taper
    const result = calculateTax(
      [employment(210000)],
      settings({ sippContribution: 12000 }),
      rules,
    )
    expect(result.effectiveAnnualAllowance).toBe(60000)
  })

  it('tapers the annual allowance above £260k adjusted income', () => {
    // Employment £280,000: threshold £280k > £200k, adjusted £280k > £260k
    // taper = (£280,000 − £260,000) / 2 = £10,000 → AA = £50,000
    const result = calculateTax([employment(280000)], defaultSettings, rules)
    expect(result.effectiveAnnualAllowance).toBe(50000)
  })
})

// ─── Marriage allowance, mortgage credit, POA, student loans ─────────────────

describe('marriage allowance recipient credit', () => {
  it('gives the full £252 credit to a basic-rate recipient', () => {
    const result = calculateTax([employment(30000)], settings({ marriageAllowance: 'receiving' }), rules)
    expectGBP(result.marriageAllowanceCredit, 252)
  })

  it('gives no credit to a higher-rate recipient (ineligible)', () => {
    const result = calculateTax([employment(60000)], settings({ marriageAllowance: 'receiving' }), rules)
    expect(result.marriageAllowanceCredit).toBe(0)
  })

  it('caps the credit at the income tax due (cannot offset NI)', () => {
    // Employment £13,000 → IT = £430 × 20% = £86 → credit capped at £86
    const result = calculateTax([employment(13000)], settings({ marriageAllowance: 'receiving' }), rules)
    expectGBP(result.marriageAllowanceCredit, 86)
    expectGBP(result.incomeTax - result.marriageAllowanceCredit, 0)
    // NI still due in full: (£13,000 − £12,570) × 8% = £34.40
    expectGBP(result.totalTax, 34.40)
  })
})

describe('mortgage interest credit caps', () => {
  it('caps the credit at 20% of rental profit', () => {
    // Employment £30,000 + rental £10,000 (expenses £9,000, interest £8,000)
    // Profit £1,000 → credit = 20% × min(£8,000, £1,000, taxable) = £200
    const result = calculateTax(
      [employment(30000, '1'), rental(10000, 9000, 8000, '2')],
      defaultSettings,
      rules,
    )
    expectGBP(result.mortgageTaxCredit, 200)
  })

  it('forfeits the property allowance when mortgage interest is claimed', () => {
    // Rental £8,000, no expenses, interest £2,000 + employment £30,000
    // Actual-cost regime: profit £8,000 (no £1,000 allowance), credit = £400
    const result = calculateTax(
      [employment(30000, '1'), rental(8000, 0, 2000, '2')],
      defaultSettings,
      rules,
    )
    expectGBP(result.rentalNetBeforeMortgage, 8000)
    expectGBP(result.mortgageTaxCredit, 400)
  })
})

describe('payments on account relevant amount', () => {
  it('excludes CGT and student loans from poaRelevantTax', () => {
    const result = calculateTax(
      [selfEmployment(60000)],
      settings({ studentLoanPlan: 'plan2' }),
      rules,
      [gain(20000)],
    )
    expect(result.capitalGainsTax).toBeGreaterThan(0)
    expect(result.studentLoan).toBeGreaterThan(0)
    expectGBP(
      result.selfAssessmentTaxEstimate - result.poaRelevantTax,
      result.capitalGainsTax + result.studentLoan,
    )
  })
})

describe('student loan income base', () => {
  it('is not reduced by SIPP (relief at source) contributions', () => {
    const withSipp = calculateTax(
      [employment(40000)],
      settings({ studentLoanPlan: 'plan2', sippContribution: 800 }),
      rules,
    )
    expectGBP(withSipp.studentLoan, 1037.70) // same as without SIPP
  })

  it('excludes unearned income of £2,000 or less', () => {
    const result = calculateTax(
      [employment(40000, '1'), savings(1500, '2')],
      settings({ studentLoanPlan: 'plan2' }),
      rules,
    )
    expectGBP(result.studentLoan, 1037.70) // savings ignored
  })

  it('includes unearned income above £2,000', () => {
    // £40,000 + £3,000 interest → (£43,000 − £28,470) × 9% = £1,307.70
    const result = calculateTax(
      [employment(40000, '1'), savings(3000, '2')],
      settings({ studentLoanPlan: 'plan2' }),
      rules,
    )
    expectGBP(result.studentLoan, 1307.70)
  })
})

// ─── Cross-year behaviour ─────────────────────────────────────────────────────

describe('cross-year behaviour', () => {
  it('returns different results for different tax years with identical inputs (cache regression)', () => {
    // Plan 2 thresholds differ: 2025/26 £28,470 vs 2026/27 £29,385
    // £40,000 → SL 2025/26: £11,530 × 9% = £1,037.70; 2026/27: £10,615 × 9% = £955.35
    const slSettings = settings({ studentLoanPlan: 'plan2' })
    const a = calculateTax([employment(40000)], slSettings, rules)
    const b = calculateTax([employment(40000)], settings({ studentLoanPlan: 'plan2', taxYear: '2026-27' }), rules2627)
    expect(a).not.toBe(b)
    expectGBP(a.studentLoan, 1037.70)
    expectGBP(b.studentLoan, 955.35)
  })

  it('uses correct Scottish bands for 2026/27', () => {
    // £30,000: taxable = £17,430
    //   £3,967 × 19%  = £753.73   (£12,571–£16,537)
    //   £12,989 × 20% = £2,597.80 (£16,538–£29,526)
    //   £474 × 21%    = £99.54    (£29,527–£30,000)
    //   Total         = £3,451.07
    const result = calculateTax(
      [employment(30000)],
      settings({ taxYear: '2026-27', scottishTaxpayer: true }),
      rules2627,
    )
    expectGBP(result.incomeTax, 3451.07)
  })

  it('applies the 2026/27 dividend rates (+2pp from Autumn Budget 2025)', () => {
    // Employment £20,000, dividends £5,000
    // dividendAfterAllowance: £4,500 — all in basic band → £4,500 × 10.75% = £483.75
    const result = calculateTax(
      [employment(20000), dividend(5000, false, '2')],
      settings({ taxYear: '2026-27' }),
      rules2627,
    )
    expectGBP(result.dividendTax, 483.75)
  })

  it('applies the 2025/26 Blind Person\'s Allowance of £3,130', () => {
    // £30,000 employment, BPA: PA = £12,570 + £3,130 = £15,700
    // taxable = £14,300 → £2,860 income tax
    const result = calculateTax(
      [employment(30000)],
      settings({ hasBlindPersonsAllowance: true }),
      rules,
    )
    expectGBP(result.incomeTax, 2860)
  })

  // Per-year smoke tests against hand-computed examples — catches rule-file
  // transcription errors (frozen rUK thresholds → identical IT/NI across years)
  it('per-year smoke: £50,000 employment', () => {
    for (const [yr, r] of [['2025-26', rules], ['2026-27', rules2627]] as const) {
      const result = calculateTax([employment(50000)], settings({ taxYear: yr }), r)
      expectGBP(result.incomeTax, 7486)      // £37,430 × 20%
      expectGBP(result.class1NI, 2994.40)    // £37,430 × 8%
      expect(result.class2NI).toBe(0)
    }
  })
})

// ─── HMRC worked examples: nil-rate bands, per-employment NI, loss restriction ──

describe('calculateTax — HMRC nil-rate band stacking (2025/26)', () => {
  it('PSA consumes band space: interest above the allowance stacks over it', () => {
    // Employment £42,570 (taxable £30,000, IT £6,000) + £10,000 interest.
    // Total taxable £40,000 → higher-rate taxpayer → PSA £500.
    // The £500 nil-rate band occupies £30,000–£30,500, so the taxed £9,500
    // stacks from £30,500: £7,200 × 20% + £2,300 × 40% = £1,440 + £920 = £2,360
    const result = calculateTax([employment(42570, '1'), savings(10000, '2')], defaultSettings, rules)
    expectGBP(result.savingsAllowanceApplied, 500)
    expectGBP(result.savingsTax, 2360)
    expectGBP(result.incomeTax, 8360) // £6,000 non-savings + £2,360 savings
  })

  it('dividend allowance consumes band space: taxed dividends stack over it', () => {
    // Employment £49,570 (taxable £37,000) + £5,000 dividends.
    // £500 allowance occupies £37,000–£37,500; taxed £4,500 stacks from £37,500:
    // £200 × 8.75% + £4,300 × 33.75% = £17.50 + £1,451.25 = £1,468.75
    const result = calculateTax([employment(49570, '1'), dividend(5000, false, '2')], defaultSettings, rules)
    expectGBP(result.dividendTax, 1468.75)
  })

  it('starting rate for savings consumes band space too', () => {
    // Self-employment profit £13,570 (taxable £1,000) + £40,000 interest.
    // Starting rate: £5,000 − £1,000 = £4,000 at 0%; PSA £500 at 0% (higher rate:
    // total taxable £41,000). Taxed savings £35,500 stack from £1,000 + £4,500:
    // basic available £37,700 − £5,500 = £32,200 × 20% + £3,300 × 40% = £6,440 + £1,320
    const result = calculateTax(
      [selfEmployment(13570, 0, '1'), savings(40000, '2')],
      defaultSettings,
      rules,
    )
    expectGBP(result.startingSavingsRateApplied, 4000)
    expectGBP(result.savingsAllowanceApplied, 500)
    expectGBP(result.savingsTax, 7760)
  })

  it('dividend allowance band usage flows into CGT band calculation', () => {
    // Employment £49,970 (taxable £37,400) + £500 dividends taxed at the nil
    // rate + £13,000 gain. Total taxable income = £37,900, above the £37,700
    // basic rate limit because the dividend nil-rate band still uses band
    // space — so no basic-rate band remains for CGT.
    // Gains: £13,000 − £3,000 AEA = £10,000, all at 24% = £2,400
    const result = calculateTax(
      [employment(49970, '1'), dividend(500, false, '2')],
      defaultSettings,
      rules,
      [gain(13000)],
    )
    expectGBP(result.capitalGainsTax, 2400)
  })
})

describe('calculateTax — per-employment Class 1 NI (2025/26)', () => {
  it('gives each employment its own primary threshold', () => {
    // Two £30,000 jobs: each pays (30,000 − 12,570) × 8% = £1,394.40 → £2,788.80.
    // (A single £60,000 job would pay £3,210.60 — aggregation overcharges.)
    const twoJobs = calculateTax([employment(30000, '1'), employment(30000, '2')], defaultSettings, rules)
    expectGBP(twoJobs.class1NI, 2788.80)
    expectGBP(twoJobs.class1NILowerBandTax, 2788.80)
    expectGBP(twoJobs.class1NIUpperBandTax, 0)

    const oneJob = calculateTax([employment(60000)], defaultSettings, rules)
    expectGBP(oneJob.class1NI, 3210.60)
    expect(twoJobs.class1NI).toBeLessThan(oneJob.class1NI)
  })

  it('income tax is unaffected by the per-employment NI split', () => {
    const twoJobs = calculateTax([employment(30000, '1'), employment(30000, '2')], defaultSettings, rules)
    const oneJob = calculateTax([employment(60000)], defaultSettings, rules)
    expectGBP(twoJobs.incomeTax, oneJob.incomeTax)
  })

  it('applies per-source salary sacrifice and bonus to that job\'s NI only', () => {
    // Job 1: £50,270 with £10,000 sacrifice → NIable £40,270 → £2,216 NI
    // Job 2: £20,000 + £5,000 bonus → NIable £25,000 → £994.40 NI
    const result = calculateTax([
      { ...employment(50270, '1'), salarySacrificeItems: [{ id: 's1', type: 'pension' as const, name: 'Pension', annualAmount: 10000 }] },
      { ...employment(20000, '2'), bonus: 5000 },
    ], defaultSettings, rules)
    expectGBP(result.class1NI, (40270 - 12570) * 0.08 + (25000 - 12570) * 0.08)
  })
})

describe('calculateTax — brought-forward CGT losses restricted to AEA (2025/26)', () => {
  it('uses losses only to bring gains down to the annual exempt amount', () => {
    // £10,000 gains, £10,000 loss pool: only £7,000 needed to reach the £3,000
    // AEA; taxable nil; £3,000 of losses remain in the pool for future years.
    const result = calculateTax([], defaultSettings, rules, [gain(10000)])
    expectGBP(result.carryForwardLossesApplied, 0) // no pool configured

    const withPool = calculateTax([], settings({ capitalLossCarryForward: 10000 }), rules, [gain(10000)])
    expectGBP(withPool.carryForwardLossesApplied, 7000)
    expectGBP(withPool.taxableGain, 0)
    expectGBP(withPool.capitalGainsTax, 0)
  })

  it('applies no losses when gains are already within the AEA', () => {
    const result = calculateTax([], settings({ capitalLossCarryForward: 5000 }), rules, [gain(2500)])
    expectGBP(result.carryForwardLossesApplied, 0)
    expectGBP(result.capitalGainsTax, 0)
  })
})

describe('calculateTax — HICBC whole-percent steps (2025/26)', () => {
  const cbSettings = settings({ childBenefitClaiming: true, numberOfChildren: 1 })

  it('charges 1% per full £200 over the threshold (floored)', () => {
    // ANI £61,150 → excess £1,150 → floor(1,150/200) = 5% of £1,354.60 ≈ £68
    const result = calculateTax([employment(61150)], cbSettings, rules)
    expectGBP(result.childBenefitAnnual, 1354.60)
    expect(result.hicbc).toBe(68)
  })

  it('does not round part-steps up', () => {
    // ANI £61,199 → excess £1,199 → still 5 full steps → £68 (not 6%)
    const result = calculateTax([employment(61199)], cbSettings, rules)
    expect(result.hicbc).toBe(68)
  })

  it('charges nothing below the first full £200 step', () => {
    const result = calculateTax([employment(60199)], cbSettings, rules)
    expect(result.hicbc).toBe(0)
  })

  it('claws back the full benefit at the taper end', () => {
    const result = calculateTax([employment(85000)], cbSettings, rules)
    expect(result.hicbc).toBe(Math.round(result.childBenefitAnnual))
  })
})

// ─── Phase 6 refinements ─────────────────────────────────────────────────────

describe('calculateTax — Marriage Allowance eligibility (2025/26)', () => {
  it('skips the transfer when the transferor is above basic rate', () => {
    // £60,000 taxable income (£47,430 after PA) exceeds the £37,700 basic band
    // — HMRC would refuse the transfer, so the PA must stay intact
    const result = calculateTax(
      [employment(60000)],
      settings({ marriageAllowance: 'transferring' }),
      rules,
    )
    expect(result.marriageAllowanceTransferApplied).toBe(false)
    expectGBP(result.effectivePersonalAllowance, 12570)
  })

  it('applies the transfer for a basic-rate transferor', () => {
    const result = calculateTax(
      [employment(30000)],
      settings({ marriageAllowance: 'transferring' }),
      rules,
    )
    expect(result.marriageAllowanceTransferApplied).toBe(true)
    expectGBP(result.effectivePersonalAllowance, 12570 - 1260)
  })
})

describe('calculateTax — SIPP relief capped at relevant earnings (2025/26)', () => {
  it('caps relief-at-source at £3,600 gross with no relevant earnings', () => {
    // Dividend income is not "relevant UK earnings" — an £8,000 net SIPP
    // contribution only attracts relief on £3,600 gross
    const result = calculateTax(
      [dividend(50000)],
      settings({ sippContribution: 8000 }),
      rules,
    )
    expectGBP(result.sippGrossContribution, 3600)
    expectGBP(result.adjustedNetIncome, 50000 - 3600)
  })

  it('grosses up in full when earnings cover the contribution', () => {
    const result = calculateTax(
      [employment(50000)],
      settings({ sippContribution: 8000 }),
      rules,
    )
    expectGBP(result.sippGrossContribution, 10000)
  })
})

describe('calculateTax — student loan repayment income (2025/26)', () => {
  const plan2 = settings({ studentLoanPlan: 'plan2' })

  it('ignores rental profit of £2,000 or less (unearned de-minimis)', () => {
    // Rental £1,800 gross → £800 profit after the property allowance → ignored.
    // SL = (£30,000 − £28,470) × 9% = £137.70
    const result = calculateTax([employment(30000, '1'), rental(1800, 0, 0, '2')], plan2, rules)
    expectGBP(result.studentLoan, 137.70)
  })

  it('counts rental profit in full once above £2,000', () => {
    // Rental £4,000 gross → £3,000 profit → all of it counts.
    // SL = (£33,000 − £28,470) × 9% = £407.70
    const result = calculateTax([employment(30000, '1'), rental(4000, 0, 0, '2')], plan2, rules)
    expectGBP(result.studentLoan, 407.70)
  })

  it('excludes benefits in kind from repayment income', () => {
    const withBIK = {
      ...employment(30000),
      benefitsInKind: [{ id: 'b1', type: 'privateHealthcare' as const, name: 'Health', annualValue: 3000 }],
    }
    const result = calculateTax([withBIK], plan2, rules)
    expectGBP(result.studentLoan, 137.70) // based on £30,000, not £33,000
  })
})

describe('calculateTax — landlord cash flow (2025/26)', () => {
  it('subtracts mortgage interest from net income as a real cash cost', () => {
    // Rental £12,000, expenses £2,000, mortgage interest £3,000. Profit
    // £10,000 sits inside the PA → no tax. Net income = 12,000 − 2,000 − 3,000
    const result = calculateTax([rental(12000, 2000, 3000)], defaultSettings, rules)
    expectGBP(result.rentalMortgageInterest, 3000)
    expectGBP(result.totalTax, 0)
    expectGBP(result.netIncome, 7000)
  })
})

describe('calculateTax — ISA savings exclusion (2025/26)', () => {
  it('excludes savings interest flagged as from an ISA', () => {
    const isaSavings = { ...savings(5000), fromISA: true }
    const result = calculateTax([employment(50000, '1'), { ...isaSavings, id: '2' }], defaultSettings, rules)
    expectGBP(result.savingsIncome, 0)
    expectGBP(result.savingsTax, 0)
    expectGBP(result.grossIncome, 50000)
  })
})

describe('calculateTax — PSA tier uses extended bands (2025/26)', () => {
  it('Gift Aid can keep a taxpayer basic-rate for PSA purposes', () => {
    // £51,000 salary (taxable £38,430) + £800 interest + £2,000 Gift Aid
    // (grossed to £2,500). Extended basic limit = £40,200, total taxable
    // £39,230 → still basic rate → PSA £1,000 covers all the interest.
    const result = calculateTax(
      [employment(51000, '1'), savings(800, '2')],
      settings({ giftAidDonations: 2000 }),
      rules,
    )
    expectGBP(result.savingsAllowanceApplied, 800)
    expectGBP(result.savingsTax, 0)
  })
})
