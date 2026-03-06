import { describe, it, expect } from 'vitest'
import { calculateTax } from './taxCalculations'
import rules from '@/taxRules/2025-26'
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
    // NI Class 2: £3.50 × 52 = £182
    // Total tax: £7,313.80
    it('deducts allowable expenses from taxable profit', () => {
      const result = calculateTax([selfEmployment(50000, 10000)], defaultSettings, rules)
      expect(result.selfEmploymentAllowableExpenses).toBe(10000)
      expectGBP(result.incomeTax, 5486)
    })

    it('calculates NI Class 4 on profit', () => {
      const result = calculateTax([selfEmployment(50000, 10000)], defaultSettings, rules)
      expectGBP(result.class4NI, 1645.80)
    })

    it('charges NI Class 2 when profit exceeds small profits threshold', () => {
      const result = calculateTax([selfEmployment(50000, 10000)], defaultSettings, rules)
      expectGBP(result.class2NI, 182) // £3.50 × 52
    })

    it('does not charge Class 2 NI when profit is below small profits threshold', () => {
      // Profit: £5,000 < £6,845 threshold
      const result = calculateTax([selfEmployment(5000)], defaultSettings, rules)
      expect(result.class2NI).toBe(0)
    })

    it('does not charge Class 4 NI when profit is below lower threshold', () => {
      // Profit: £10,000 < £12,570
      const result = calculateTax([selfEmployment(10000)], defaultSettings, rules)
      expect(result.class4NI).toBe(0)
    })

    it('calculates total tax and net income', () => {
      const result = calculateTax([selfEmployment(50000, 10000)], defaultSettings, rules)
      expectGBP(result.totalTax, 7313.80)
      // Net: £50,000 (gross) − £10,000 (expenses) − £7,313.80 (tax) = £32,686.20
      expectGBP(result.netIncome, 32686.20)
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
    // NI Class 2 (SE profit £12,000 > small profits £6,845): £3.50 × 52 = £182
    //
    // dividendAfterAllowance: £2,000 − £500 = £1,500
    // bandSpaceUsed = £19,430; basic band remaining = £37,700 − £19,430 = £18,270
    // dividendTax: £1,500 × 8.75% = £131.25
    //
    // Total tax: £3,886 + £776.40 + £131.25 = £4,793.65
    // Net: (£20,000 + £15,000 + £2,000) − £3,000 (SE expenses) − £4,793.65 = £29,206.35
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
      expectGBP(result.class2NI, 182)
      expectGBP(result.dividendTax, 131.25)
      expectGBP(result.totalTax, 4793.65)
      expectGBP(result.netIncome, 29206.35)
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
      // incomeTax before relief: £37,700×20% + £14,730×40% = £7,540 + £5,892 = £13,432
      // baseWithoutBonds = 65,000 − 20,000 − 12,570 = £32,430
      // slice = £20,000 / 5 = £4,000
      // marginalOnSlice = (32,430 + 4,000)×20% − 32,430×20% = 7,286 − 6,486 = £800
      // taxOnFullGain = 13,432 − 6,486 = £6,946
      // relief = 6,946 − 800×5 = £2,946
      // incomeTaxAfterRelief = 13,432 − 2,946 = £10,486
      const result = calculateTax(
        [employment(45000, '1'), bond(20000, 5, '2')],
        defaultSettings,
        rules,
      )
      expectGBP(result.bondTopSlicingRelief, 2946)
      expectGBP(result.incomeTax, 10486)
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
})
