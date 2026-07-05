import type { TaxRules } from './types'

const rules: TaxRules = {
  label: '2026/27',
  personalAllowance: 12570,
  personalAllowanceTaperThreshold: 100000,
  // England / Wales / Northern Ireland bands, applied to TAXABLE income (after
  // the personal allowance) — frozen until 2031. The statutory higher rate limit
  // is £125,140 of taxable income (ITA 2007 s.10): the 45% rate starts there even
  // when the personal allowance is fully tapered away, so the boundary must NOT
  // be encoded as £125,140 − PA.
  incomeTaxBands: [
    { from: 0, to: 37700, rate: 0.20 },        // Basic rate
    { from: 37700, to: 125140, rate: 0.40 },   // Higher rate
    { from: 125140, to: Infinity, rate: 0.45 }, // Additional rate
  ],
  // Scotland bands on taxable income — updated for 2026/27. Total-income
  // equivalents in comments assume the full personal allowance; the top rate
  // limit is £125,140 of taxable income per the Scottish Rate Resolution.
  scottishIncomeTaxBands: [
    { from: 0, to: 3967, rate: 0.19 },          // Starter    (total: £12,570–£16,537)
    { from: 3967, to: 16956, rate: 0.20 },      // Basic      (total: £16,537–£29,526)
    { from: 16956, to: 31092, rate: 0.21 },     // Intermediate (total: £29,526–£43,662)
    { from: 31092, to: 62430, rate: 0.42 },     // Higher     (total: £43,662–£75,000)
    { from: 62430, to: 125140, rate: 0.45 },    // Advanced
    { from: 125140, to: Infinity, rate: 0.48 }, // Top
  ],
  niPrimaryThreshold: 12570,     // frozen until 2031
  niUpperEarningsLimit: 50270,   // frozen until 2031
  niRateLower: 0.08,
  niRateUpper: 0.02,
  selfEmployedClass4LowerThreshold: 12570,
  selfEmployedClass4UpperThreshold: 50270,
  selfEmployedClass4Lower: 0.06,
  selfEmployedClass4Upper: 0.02,
  selfEmployedClass2WeeklyRate: 3.65,       // up from £3.50 in 2025/26
  selfEmployedSmallProfitsThreshold: 7105,  // up from £6,845 in 2025/26
  dividendAllowance: 500,
  // Autumn Budget 2025: dividend rates +2pp from 6 Apr 2026 (additional rate unchanged)
  dividendBasicRate: 0.1075,
  dividendHigherRate: 0.3575,
  dividendAdditionalRate: 0.3935,
  propertyAllowance: 1000,
  rentARoomRelief: 7500,
  studentLoan: {
    plan1Threshold: 26900,   // up from £26,065
    plan2Threshold: 29385,   // up from £28,470
    plan4Threshold: 33795,   // up from £32,745
    plan5Threshold: 25000,   // first Plan 5 repayments from 6 Apr 2026 (frozen until 2027)
    postgradThreshold: 21000,
    plan1Rate: 0.09,
    plan2Rate: 0.09,
    plan4Rate: 0.09,
    plan5Rate: 0.09,
    postgradRate: 0.06,
  },
  cgtAnnualExemptAmount: 3000,
  cgtBasicRate: 0.18,
  cgtHigherRate: 0.24,
  // Child Benefit (2026/27 confirmed rates — 3.8% CPI uprating from 6 Apr 2026)
  childBenefitEldestWeekly: 27.05,
  childBenefitAdditionalWeekly: 17.90,
  hicbcThreshold: 60000,
  hicbcTaperEnd: 80000,
  // Blind Person's Allowance (2026/27 confirmed: up from £3,130)
  blindPersonsAllowance: 3250,
  // Auto-enrolment qualifying earnings band (2026/27: frozen at 2025/26 levels
  // per the DWP December 2025 review)
  qualifyingEarningsLower: 6240,
  qualifyingEarningsUpper: 50270,
  // Pension Annual Allowance
  pensionAnnualAllowance: 60000,
  pensionAnnualAllowanceMinimum: 10000,
  pensionTaperThresholdIncome: 200000,
  pensionTaperAdjustedIncome: 260000,
  // Business Asset Disposal Relief (BADR) — increases to 18% from 6 Apr 2026
  badrRate: 0.18,
  badrLifetimeAllowance: 1_000_000,
  // Personal Savings Allowance
  savingsAllowanceBasic: 1000,
  savingsAllowanceHigher: 500,
  savingsAllowanceAdditional: 0,
  startingRateForSavingsLimit: 5000,
  // Marriage Allowance (10% of PA = £1,257, rounded up to £1,260; credit = £1,260 × 20%)
  marriageAllowanceTransfer: 1260,
  marriageAllowanceCredit: 252,
  // State Pension (2026/27: £241.30/week × 52 — 4.8% triple lock uplift, Autumn Budget 2025)
  statePensionFullAnnual: 12547.60,
  statePensionDefaultAge: 67,
  // Lump Sum Allowance
  lumpSumAllowance: 268275,
  // Money Purchase Annual Allowance
  mpaa: 10000,
}

export default rules
