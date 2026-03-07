export interface TaxBand {
  from: number
  to: number // use Infinity for the top band
  rate: number // as a decimal, e.g. 0.20 for 20%
}

export interface TaxRules {
  label: string // e.g. '2025/26'
  // Personal Allowance
  personalAllowance: number
  personalAllowanceTaperThreshold: number // tapers by £1 per £2 above this
  // Income tax bands (England/Wales/NI) — applied above personal allowance
  incomeTaxBands: TaxBand[]
  // Scottish income tax bands — applied above personal allowance
  scottishIncomeTaxBands: TaxBand[]
  // National Insurance (Employee - Class 1)
  niPrimaryThreshold: number
  niUpperEarningsLimit: number
  niRateLower: number // between primary threshold and upper earnings limit
  niRateUpper: number // above upper earnings limit
  // Self-Employment NI (Class 4)
  selfEmployedClass4LowerThreshold: number
  selfEmployedClass4UpperThreshold: number
  selfEmployedClass4Lower: number // between lower and upper threshold
  selfEmployedClass4Upper: number // above upper threshold
  // Self-Employment NI (Class 2)
  selfEmployedClass2WeeklyRate: number
  selfEmployedSmallProfitsThreshold: number
  // Dividends
  dividendAllowance: number
  dividendBasicRate: number
  dividendHigherRate: number
  dividendAdditionalRate: number
  // Rental
  propertyAllowance: number
  // Student Loans
  studentLoan: {
    plan1Threshold: number
    plan2Threshold: number
    plan4Threshold: number
    postgradThreshold: number
    plan1Rate: number
    plan2Rate: number
    plan4Rate: number
    postgradRate: number
  }
  // Capital Gains Tax
  cgtAnnualExemptAmount: number
  cgtBasicRate: number
  cgtHigherRate: number
  // Child Benefit
  childBenefitEldestWeekly: number
  childBenefitAdditionalWeekly: number
  hicbcThreshold: number   // income where HICBC taper begins (£60,000 from Apr 2024)
  hicbcTaperEnd: number    // income where full benefit is clawed back (£80,000)
  // Blind Person's Allowance
  blindPersonsAllowance: number
  // Pension Annual Allowance
  pensionAnnualAllowance: number          // standard AA (£60,000)
  pensionAnnualAllowanceMinimum: number   // minimum after taper (£10,000)
  pensionTaperThresholdIncome: number     // threshold income above which taper may apply (£200,000)
  pensionTaperAdjustedIncome: number      // adjusted income above which AA reduces (£260,000)
  // Business Asset Disposal Relief (BADR)
  badrRate: number                        // BADR CGT rate for the year
  badrLifetimeAllowance: number           // always 1,000,000
  // Personal Savings Allowance
  savingsAllowanceBasic: number           // £1,000 for basic rate taxpayers
  savingsAllowanceHigher: number          // £500 for higher rate taxpayers
  savingsAllowanceAdditional: number      // £0 for additional rate taxpayers
  // Marriage Allowance
  marriageAllowanceTransfer: number       // amount transferred (10% of PA, rounded up)
  marriageAllowanceCredit: number         // tax credit for recipient (transfer × basic rate)
  // State Pension
  statePensionFullAnnual: number          // full new State Pension annual amount (e.g. £11,502.40)
  statePensionDefaultAge: number          // current State Pension age (67, rising to 68)
  // Lump Sum Allowance (replaced Lifetime Allowance from April 2024)
  lumpSumAllowance: number               // tax-free lump sum cap (£268,275)
  // Money Purchase Annual Allowance
  mpaa: number                           // £10,000 — applies if DC pension has been flexibly accessed
}
