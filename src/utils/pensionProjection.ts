import type { PensionPot } from '@/types'
import type { TaxBand } from '@/taxRules/types'

export interface PensionProjectionYear {
  age: number
  openingBalance: number
  annualContribution: number
  growthAmount: number
  closingBalance: number
}

export interface DrawdownYear {
  age: number
  openingBalance: number
  withdrawal: number
  growthAmount: number
  closingBalance: number
  statePensionIncome: number
  dbPensionIncome: number
  totalGrossIncome: number
  incomeTaxOnWithdrawal: number
  netIncomeAfterTax: number
}

export interface PensionProjectionResult {
  yearsToAccess: number
  totalContributions: number
  projectedPotAtAccess: number
  taxFreeLumpSum: number
  lsaCapped: boolean
  drawdownPot: number
  inflatedAnnualIncome: number
  yearsOfIncome: number
  yearByYear: PensionProjectionYear[]
  drawdownYears: DrawdownYear[]
  statePensionAnnual: number
  projectedNIYears: number | undefined
  dbPensionAnnualAtAccess: number
  dcIncomeNeeded: number
  firstYearTax: number
  firstYearNetIncome: number
}

export interface PensionProjectionOptions {
  currentAge: number
  currentPotValue: number
  pensionPots?: PensionPot[]
  pensionAccessAge: number
  annualContribution: number
  assumedGrowthRate: number       // e.g. 4 for 4%
  annualIncomeNeeded: number      // today's £, pre-tax
  inflationRate: number           // e.g. 3 for 3%
  annualFeeRate?: number          // platform/fund fee in % (e.g. 0.5)
  salaryGrowthRate?: number       // real salary growth above inflation in % (e.g. 1 for 1%)
  qualifyingNIYears?: number      // 0-35
  statePensionAge?: number        // default 67
  statePensionFullAnnual?: number // from tax rules
  dbPensionAnnualIncome?: number  // today's £
  lumpSumAllowance?: number      // default £268,275
  personalAllowance?: number     // from tax rules, for drawdown tax calc
  personalAllowanceTaperThreshold?: number // e.g. 100000
  incomeTaxBands?: TaxBand[]     // for drawdown tax calc
  drawdownTaxFreeFirst?: boolean // use tax-free allowance gradually instead of upfront lump sum
}

/** Estimate income tax on retirement income using bands, with PA taper */
function estimateRetirementIncomeTax(
  grossIncome: number,
  personalAllowance: number,
  bands: TaxBand[],
  paTaperThreshold?: number,
): number {
  // PA tapers by £1 for every £2 above the threshold (£100k in current rules)
  let effectivePA = personalAllowance
  if (paTaperThreshold != null && grossIncome > paTaperThreshold) {
    const reduction = Math.floor((grossIncome - paTaperThreshold) / 2)
    effectivePA = Math.max(0, personalAllowance - reduction)
  }

  const taxable = Math.max(0, grossIncome - effectivePA)
  if (taxable === 0) return 0

  let remaining = taxable
  let tax = 0
  for (const band of bands) {
    if (remaining <= 0) break
    const bandWidth = band.to === Infinity ? Infinity : band.to - band.from
    const taxableInBand = Math.min(remaining, bandWidth === Infinity ? remaining : bandWidth)
    tax += taxableInBand * band.rate
    remaining -= taxableInBand
  }
  return tax
}

/**
 * Advanced pension projection with State Pension, DB pension, LSA cap,
 * fees, multiple pots, and drawdown income tax modelling.
 */
export function projectPensionPotAdvanced(
  options: PensionProjectionOptions,
): PensionProjectionResult {
  const {
    currentAge,
    pensionAccessAge,
    annualContribution,
    assumedGrowthRate,
    annualIncomeNeeded,
    inflationRate,
    annualFeeRate = 0,
    salaryGrowthRate = 0,
    qualifyingNIYears,
    statePensionAge = 67,
    statePensionFullAnnual = 0,
    dbPensionAnnualIncome = 0,
    lumpSumAllowance = 268275,
    personalAllowance = 12570,
    personalAllowanceTaperThreshold,
    incomeTaxBands,
    drawdownTaxFreeFirst = false,
  } = options

  const yearsToAccess = Math.max(0, pensionAccessAge - currentAge)
  const netGrowthRate = Math.max(0, assumedGrowthRate - annualFeeRate)
  const growthDecimal = netGrowthRate / 100
  const inflationDecimal = inflationRate / 100
  const salaryGrowthDecimal = salaryGrowthRate / 100
  // Contributions grow at inflation + real salary growth
  const contributionGrowthDecimal = inflationDecimal + salaryGrowthDecimal
  const yearByYear: PensionProjectionYear[] = []

  // --- Multiple pots or single pot ---
  const pots = options.pensionPots?.length
    ? options.pensionPots
    : [{ id: 'default', name: 'Pension', value: options.currentPotValue }]

  // --- Accumulation phase ---
  // Each pot grows at its own rate (or the global rate). Contributions go into the total proportionally.
  let potBalances = pots.map(p => ({
    ...p,
    balance: p.value,
    rate: ((p.growthRateOverride ?? assumedGrowthRate) - annualFeeRate) / 100,
  }))
  let contribution = annualContribution
  let totalContributions = 0

  for (let i = 0; i < yearsToAccess; i++) {
    const totalOpening = potBalances.reduce((s, p) => s + p.balance, 0)

    // Distribute contribution proportionally by pot size (or equally if all zero)
    const totalForDistrib = totalOpening > 0 ? totalOpening : potBalances.length
    let totalGrowth = 0
    for (const pot of potBalances) {
      const share = totalOpening > 0
        ? (pot.balance / totalForDistrib) * contribution
        : contribution / totalForDistrib
      const withContrib = pot.balance + share
      const growth = withContrib * pot.rate
      pot.balance = withContrib + growth
      totalGrowth += growth
    }

    const totalClosing = potBalances.reduce((s, p) => s + p.balance, 0)
    yearByYear.push({
      age: currentAge + i,
      openingBalance: totalOpening,
      annualContribution: contribution,
      growthAmount: totalGrowth,
      closingBalance: totalClosing,
    })

    totalContributions += contribution
    contribution *= (1 + contributionGrowthDecimal)
  }

  const projectedPot = potBalances.reduce((s, p) => s + p.balance, 0)

  // --- LSA cap on tax-free lump sum ---
  const uncappedLumpSum = projectedPot * 0.25
  const taxFreeLumpSum = drawdownTaxFreeFirst ? 0 : Math.min(uncappedLumpSum, lumpSumAllowance)
  const lsaCapped = !drawdownTaxFreeFirst && uncappedLumpSum > lumpSumAllowance
  const drawdownPot = projectedPot - taxFreeLumpSum
  // Tax-free allowance remaining (for gradual drawdown mode)
  let taxFreeRemaining = drawdownTaxFreeFirst ? Math.min(uncappedLumpSum, lumpSumAllowance) : 0

  // --- State Pension ---
  // Project qualifying NI years forward: assume each working year adds a qualifying year
  const projectedNIYears = qualifyingNIYears != null
    ? Math.min(qualifyingNIYears + yearsToAccess, 35)
    : undefined
  const statePensionAnnual = projectedNIYears != null && statePensionFullAnnual > 0
    ? (projectedNIYears / 35) * statePensionFullAnnual
    : 0

  // --- DB Pension inflated to access-age prices ---
  const dbPensionAtAccess = dbPensionAnnualIncome * Math.pow(1 + inflationDecimal, yearsToAccess)

  // --- Inflate income needed to access-age prices ---
  const inflatedAnnualIncome = annualIncomeNeeded * Math.pow(1 + inflationDecimal, yearsToAccess)

  // --- State Pension inflated to access-age prices ---
  // State Pension is uprated annually (approximate with inflation)
  const statePensionAtAccess = statePensionAnnual * Math.pow(1 + inflationDecimal, yearsToAccess)

  // --- DC income needed (after SP + DB offset) ---
  const dcIncomeNeeded = Math.max(0, inflatedAnnualIncome - statePensionAtAccess - dbPensionAtAccess)

  // --- Drawdown phase (access age to 100) ---
  const drawdownYears: DrawdownYear[] = []
  let drawdownBalance = drawdownPot
  let currentStatePension = statePensionAtAccess
  let currentDbPension = dbPensionAtAccess
  let currentTotalIncome = inflatedAnnualIncome
  const drawdownLength = Math.max(0, 125 - pensionAccessAge)

  // Inflated PA and taper threshold for drawdown tax (assume both rise with inflation)
  let drawdownPA = personalAllowance * Math.pow(1 + inflationDecimal, yearsToAccess)
  let drawdownPATaper = personalAllowanceTaperThreshold != null
    ? personalAllowanceTaperThreshold * Math.pow(1 + inflationDecimal, yearsToAccess)
    : undefined

  let firstYearTax = 0
  let firstYearNetIncome = 0

  for (let i = 0; i < drawdownLength; i++) {
    const age = pensionAccessAge + i
    const opening = drawdownBalance

    // State Pension starts at statePensionAge, not access age
    const spThisYear = age >= statePensionAge ? currentStatePension : 0
    const dbThisYear = currentDbPension

    // DC withdrawal: what the pot needs to provide this year
    const targetDcWithdrawal = Math.max(0, currentTotalIncome - spThisYear - dbThisYear)

    const growth = opening > 0 ? opening * growthDecimal : 0
    const afterGrowth = opening + growth
    const withdrawal = annualIncomeNeeded > 0 ? Math.min(targetDcWithdrawal, afterGrowth) : 0
    const closing = Math.max(0, afterGrowth - withdrawal)

    // In tax-free-first mode, withdrawals are tax-free until allowance is depleted
    const taxFreeThisYear = Math.min(withdrawal, taxFreeRemaining)
    taxFreeRemaining -= taxFreeThisYear
    const taxableWithdrawal = withdrawal - taxFreeThisYear

    // Estimate income tax on total retirement income
    const totalGrossIncome = taxableWithdrawal + spThisYear + dbThisYear
    let incomeTax = 0
    if (incomeTaxBands && totalGrossIncome > 0) {
      incomeTax = estimateRetirementIncomeTax(totalGrossIncome, drawdownPA, incomeTaxBands, drawdownPATaper)
    }
    const netIncome = taxFreeThisYear + totalGrossIncome - incomeTax

    if (i === 0) {
      firstYearTax = incomeTax
      firstYearNetIncome = netIncome
    }

    drawdownYears.push({
      age,
      openingBalance: opening,
      withdrawal,
      growthAmount: growth,
      closingBalance: closing,
      statePensionIncome: spThisYear,
      dbPensionIncome: dbThisYear,
      totalGrossIncome,
      incomeTaxOnWithdrawal: incomeTax,
      netIncomeAfterTax: netIncome,
    })

    drawdownBalance = closing

    // Inflate for next year
    if (annualIncomeNeeded > 0) {
      currentTotalIncome *= (1 + inflationDecimal)
    }
    currentStatePension *= (1 + inflationDecimal)
    currentDbPension *= (1 + inflationDecimal)
    drawdownPA *= (1 + inflationDecimal)
    if (drawdownPATaper != null) drawdownPATaper *= (1 + inflationDecimal)
  }

  return {
    yearsToAccess,
    totalContributions,
    projectedPotAtAccess: projectedPot,
    taxFreeLumpSum,
    lsaCapped,
    drawdownPot,
    inflatedAnnualIncome,
    yearsOfIncome: annualIncomeNeeded > 0
      ? drawdownYears.filter(y => y.openingBalance > 0).length
      : Infinity,
    yearByYear,
    drawdownYears,
    statePensionAnnual,
    projectedNIYears,
    dbPensionAnnualAtAccess: dbPensionAtAccess,
    dcIncomeNeeded,
    firstYearTax,
    firstYearNetIncome,
  }
}

/**
 * Original function signature preserved for backward compatibility.
 * Delegates to the advanced projection engine.
 */
export function projectPensionPot(
  currentAge: number,
  currentPotValue: number,
  pensionAccessAge: number,
  annualContribution: number,
  assumedGrowthRate: number,
  annualIncomeNeeded: number,
  inflationRate: number,
): PensionProjectionResult {
  return projectPensionPotAdvanced({
    currentAge,
    currentPotValue,
    pensionAccessAge,
    annualContribution,
    assumedGrowthRate,
    annualIncomeNeeded,
    inflationRate,
  })
}
