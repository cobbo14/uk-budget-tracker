import type { TaxRules } from './types'

// To add 2026/27: copy this file to 2026-27.ts and update the numbers below.
// Then import it in index.ts and add it to the TAX_RULES map.
const rules: TaxRules = {
  label: '2025/26',
  personalAllowance: 12570,
  personalAllowanceTaperThreshold: 100000,
  // England / Wales / Northern Ireland bands (width above personal allowance)
  incomeTaxBands: [
    { from: 0, to: 37700, rate: 0.20 },        // Basic rate
    { from: 37700, to: 112570, rate: 0.40 },   // Higher rate
    { from: 112570, to: Infinity, rate: 0.45 }, // Additional rate
  ],
  // Scotland bands (width above personal allowance)
  scottishIncomeTaxBands: [
    { from: 0, to: 2827, rate: 0.19 },         // Starter
    { from: 2827, to: 14921, rate: 0.20 },     // Basic
    { from: 14921, to: 31092, rate: 0.21 },    // Intermediate
    { from: 31092, to: 62430, rate: 0.42 },    // Higher
    { from: 62430, to: 112570, rate: 0.45 },   // Advanced
    { from: 112570, to: Infinity, rate: 0.48 }, // Top
  ],
  niPrimaryThreshold: 12570,
  niUpperEarningsLimit: 50270,
  niRateLower: 0.08,
  niRateUpper: 0.02,
  selfEmployedClass4LowerThreshold: 12570,
  selfEmployedClass4UpperThreshold: 50270,
  selfEmployedClass4Lower: 0.06,
  selfEmployedClass4Upper: 0.02,
  selfEmployedClass2WeeklyRate: 3.50,
  selfEmployedSmallProfitsThreshold: 6845,
  dividendAllowance: 500,
  dividendBasicRate: 0.0875,
  dividendHigherRate: 0.3375,
  dividendAdditionalRate: 0.3935,
  propertyAllowance: 1000,
  studentLoan: {
    plan1Threshold: 26065,
    plan2Threshold: 28470,
    plan4Threshold: 32745,
    postgradThreshold: 21000,
    plan1Rate: 0.09,
    plan2Rate: 0.09,
    plan4Rate: 0.09,
    postgradRate: 0.06,
  },
  cgtAnnualExemptAmount: 3000,
  cgtBasicRate: 0.18,
  cgtHigherRate: 0.24,
  // Child Benefit (rates from April 2025)
  childBenefitEldestWeekly: 26.05,
  childBenefitAdditionalWeekly: 17.25,
  hicbcThreshold: 60000,
  hicbcTaperEnd: 80000,
  // Blind Person's Allowance
  blindPersonsAllowance: 3070,
  // Pension Annual Allowance
  pensionAnnualAllowance: 60000,
  pensionAnnualAllowanceMinimum: 10000,
  pensionTaperThresholdIncome: 200000,
  pensionTaperAdjustedIncome: 260000,
  // Business Asset Disposal Relief (BADR) — Autumn Budget 2024: 14% from 6 Apr 2025
  badrRate: 0.14,
  badrLifetimeAllowance: 1_000_000,
  // Personal Savings Allowance
  savingsAllowanceBasic: 1000,
  savingsAllowanceHigher: 500,
  savingsAllowanceAdditional: 0,
  // Marriage Allowance (10% of PA = £1,257, rounded up to £1,260; credit = £1,260 × 20%)
  marriageAllowanceTransfer: 1260,
  marriageAllowanceCredit: 252,
  // State Pension (2025/26: £230.25/week × 52 — triple lock uplift)
  statePensionFullAnnual: 11973,
  statePensionDefaultAge: 67,
  // Lump Sum Allowance
  lumpSumAllowance: 268275,
  // Money Purchase Annual Allowance
  mpaa: 10000,
}

export default rules
