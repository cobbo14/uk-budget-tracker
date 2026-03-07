export type IncomeType = 'employment' | 'self-employment' | 'dividend' | 'rental' | 'bond' | 'savings'

export type SalarySacrificeType = 'pension' | 'cycleToWork' | 'electricVehicle' | 'other'

export interface SalarySacrificeItem {
  id: string
  type: SalarySacrificeType
  name: string
  annualAmount: number
  /** 'flat' (default) = fixed £ amount, 'percentage' = % of gross salary */
  amountType?: 'flat' | 'percentage'
}

export type BenefitInKindType = 'companyCar' | 'privateHealthcare' | 'accommodation' | 'other'

export interface BenefitInKindItem {
  id: string
  type: BenefitInKindType
  name: string
  annualValue: number
  /** Company car BIK rate (%) based on CO2 emissions. Only used when type is 'companyCar'. */
  bikRate?: number
}

export type ExpenseCategory = string

export interface CustomExpenseCategory {
  id: string
  label: string
}

export type ExpenseFrequency = 'weekly' | 'monthly' | 'annual'

export type StudentLoanPlan = 'none' | 'plan1' | 'plan2' | 'plan4' | 'postgrad'

export interface ISAContributions {
  cashISA: number
  stocksAndSharesISA: number
  lisaISA: number           // counts towards £20k but max £4k
  innovativeFinanceISA: number
}

export interface IncomeSource {
  id: string
  name: string
  type: IncomeType
  grossAmount: number // Annual gross
  // Self-employment
  allowableExpenses?: number
  usesTradingAllowance?: boolean
  // Rental
  mortgageInterestAnnual?: number
  rentalExpenses?: number
  // Dividend
  fromISA?: boolean
  // Bond gains: complete years held (for top-slicing relief)
  yearsHeld?: number
  // Employment: one-off bonus (annual, on top of base salary)
  bonus?: number
  // Employment: salary sacrifice
  salarySacrificeItems?: SalarySacrificeItem[]
  // Employment: benefits in kind (P11D)
  benefitsInKind?: BenefitInKindItem[]
  // Employment: employer pension contribution (per-source, alternative to global setting)
  employerPensionAmount?: number
  employerPensionAmountType?: 'flat' | 'percentage'
}

export interface GainSource {
  id: string
  name: string
  gainAmount: number       // gross proceeds minus original cost
  allowableCosts: number   // buying/selling costs, improvement costs
  isResidentialProperty: boolean
  isBADR?: boolean         // qualifies for Business Asset Disposal Relief
}

export type UtilityType = 'electricity' | 'gas' | 'water' | 'broadband' | 'mobile' | 'landline' | 'other'

export interface UtilityRate {
  label: string
  value: number
  unit: string
}

export interface UtilityDetails {
  type?: UtilityType
  provider: string
  rates: UtilityRate[]
}

export interface SplitParticipant {
  profileId: string
  percentage: number  // 0-100
}

export interface Expense {
  id: string
  name: string
  category: ExpenseCategory
  amount: number
  frequency: ExpenseFrequency
  utilityDetails?: UtilityDetails
  contractStartDate?: string        // ISO date (YYYY-MM-DD)
  renewalDate?: string              // ISO date (YYYY-MM-DD)
  splitGroupId?: string             // links copies across profiles
  splitPercentage?: number          // this profile's share (absent = 100%)
  splitOriginProfileId?: string     // which profile owns the split config
  splitConfig?: SplitParticipant[]  // full breakdown (only on origin copy)
}

export interface PensionCarryForward {
  threeYearsAgo: number
  twoYearsAgo: number
  oneYearAgo: number
}

export interface PensionPot {
  id: string
  name: string
  value: number
  growthRateOverride?: number  // if undefined, uses the global assumedGrowthRate
}

export type ISAPotType = 'cash' | 'stocksAndShares' | 'lifetime'

export interface ISAPot {
  id: string
  name: string
  type: ISAPotType
  currentValue: number
  annualContribution: number
  growthRateOverride?: number  // if undefined, uses global rate (or type default for cash)
}

export type ISADrawdownStrategy = 'pension-first' | 'isa-first' | 'tax-optimised'

export interface PensionProjectionSettings {
  currentAge: number
  currentPotValue: number              // kept for backward compat (single-pot mode)
  pensionPots?: PensionPot[]           // multiple pots (if present, overrides currentPotValue)
  pensionAccessAge: number             // default 57
  assumedGrowthRate: number            // annual growth rate, e.g. 4 for 4%
  annualIncomeNeeded: number           // pre-tax annual income needed in retirement (today's £)
  inflationRate: number                // e.g. 3 for 3%
  annualFeeRate?: number               // platform/fund fee %, e.g. 0.5 for 0.5%
  salaryGrowthRate?: number            // real salary growth above inflation %, e.g. 1 for 1%
  // State Pension
  qualifyingNIYears?: number           // 0-35
  statePensionAge?: number             // override for State Pension age (default from rules)
  // DB Pension
  dbPensionAnnualIncome?: number       // guaranteed DB income in retirement (today's £)
  // Lump Sum Allowance
  lumpSumAllowanceOverride?: number    // for people with protections giving higher LSA
  // Drawdown strategy
  drawdownTaxFreeFirst?: boolean       // use tax-free allowance gradually instead of upfront lump sum
  // ISA savings
  isaPots?: ISAPot[]
  isaDrawdownStrategy?: ISADrawdownStrategy  // default: 'tax-optimised'
}

export interface AppSettings {
  taxYear: string
  scottishTaxpayer: boolean
  pensionContributionType: 'none' | 'percentage' | 'flat'
  pensionContributionValue: number
  // Employer pension contributions (not salary sacrifice — recorded separately)
  employerPensionContributionType: 'flat' | 'percentage'
  employerPensionContributionValue: number
  // SIPP (Self-Invested Personal Pension) — annual contribution in £
  sippContribution: number
  // Unused pension Annual Allowance carried forward from prior 3 years
  pensionCarryForward: PensionCarryForward
  studentLoanPlan: StudentLoanPlan
  hasPostgradLoan: boolean
  giftAidDonations: number
  marriageAllowance: 'none' | 'transferring' | 'receiving'
  // Child Benefit / HICBC
  childBenefitClaiming: boolean
  numberOfChildren: number
  // ISA Allowance Tracker
  isaContributions: ISAContributions
  // EIS / SEIS / VCT investment relief
  seisInvestment: number
  eisInvestment: number
  vctInvestment: number
  // Blind Person's Allowance
  hasBlindPersonsAllowance: boolean
  // Capital Gains: prior-year capital losses carried forward
  capitalLossCarryForward: number
  // Payments on Account: last year's self-assessment tax bill (for current PoA amounts)
  previousYearSaTaxBill: number
  // Business Asset Disposal Relief
  badrLifetimeUsed: number           // prior BADR claimed (default 0)
  // Tax code (e.g. "1257L") — used for payslip reconciliation display
  taxCode?: string
  // Basis period reform: extra transitional profit spread over tax years
  transitionalProfitSpread?: number
  // Include pension Annual Allowance charge in tax total (default true)
  includeAnnualAllowanceCharge?: boolean
  // Money Purchase Annual Allowance — if true, DC annual allowance drops to £10,000
  hasMPAA?: boolean
  // Household / partner income (for household panel)
  partnerIncome: number
  // Pension pot projection settings
  pensionProjection?: PensionProjectionSettings
}

export interface UIState {
  incomeDialogMode: 'none' | 'add' | 'edit'
  editingIncomeId: string | null
  expenseDialogMode: 'none' | 'add' | 'edit'
  editingExpenseId: string | null
  gainDialogMode: 'none' | 'add' | 'edit'
  editingGainId: string | null
}

export interface AppState {
  version: number
  incomeSources: IncomeSource[]
  gainSources: GainSource[]
  expenses: Expense[]
  customExpenseCategories: CustomExpenseCategory[]
  settings: AppSettings
  ui: UIState
}

export interface Profile {
  id: string
  name: string
}

export interface TaxSummary {
  grossIncome: number
  totalDeductions: number // pension
  adjustedNetIncome: number
  taxableNonDividendIncome: number
  dividendIncome: number
  effectivePersonalAllowance: number
  incomeTax: number
  nationalInsurance: number
  dividendTax: number
  mortgageTaxCredit: number
  studentLoan: number
  postgradLoanRepayment: number
  giftAidRelief: number
  marriageAllowanceCredit: number
  capitalGainsTax: number
  taxableGain: number
  totalGains: number
  totalTax: number
  netIncome: number
  effectiveTaxRate: number
  // Breakdown by income type
  employmentGross: number
  bonusTotal: number
  selfEmploymentGross: number
  selfEmploymentAllowableExpenses: number
  rentalGross: number
  rentalAllowableExpenses: number
  rentalNetBeforeMortgage: number
  dividendGross: number
  class2NI: number
  class4NI: number
  class1NI: number
  salarySacrificeTotal: number
  salarySacrificePension: number
  bikTotal: number
  // Child Benefit / HICBC
  childBenefitAnnual: number
  hicbc: number
  hicbcMarginalRate: number  // additional marginal rate from HICBC taper (e.g. 0.12 for 12%)
  // EIS / SEIS / VCT investment relief
  seisRelief: number
  eisRelief: number
  vctRelief: number
  // Blind Person's Allowance applied
  blindPersonsAllowanceApplied: number
  // Pension Annual Allowance
  employerPensionFunding: number        // resolved employer contribution (flat or % of eligible income)
  totalPensionFunding: number           // employee + employer contributions
  effectiveAnnualAllowance: number      // AA after taper (£60k → £10k)
  totalAnnualAllowanceAvailable: number // effectiveAA + carry-forward
  annualAllowanceExcess: number         // amount over total available (0 = compliant)
  annualAllowanceCharge: number         // tax charge on excess at marginal rate(s)
  annualAllowanceRemaining: number      // unused AA this year (before carry-forward)
  // Capital Gains: losses applied
  carryForwardLossesApplied: number
  // Self-assessment tax estimate (for Payments on Account)
  selfAssessmentTaxEstimate: number
  // BADR
  badrGains: number
  badrTax: number
  // Bond income top-slicing
  bondIncome: number
  bondTopSlicingRelief: number
  // Personal Savings Allowance
  savingsIncome: number
  savingsTax: number
  savingsAllowanceApplied: number
}
