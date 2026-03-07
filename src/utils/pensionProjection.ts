import type { PensionPot, ISAPot } from '@/types'
import type { TaxBand } from '@/taxRules/types'

export interface PensionProjectionYear {
  age: number
  openingBalance: number
  annualContribution: number
  growthAmount: number
  closingBalance: number
  // ISA fields
  isaOpeningBalance: number
  isaContribution: number
  isaGrowthAmount: number
  isaClosingBalance: number
  lisaBonusReceived: number
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
  // ISA fields
  isaOpeningBalance: number
  isaWithdrawal: number
  isaGrowthAmount: number
  isaClosingBalance: number
  combinedNetIncome: number
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
  // ISA results
  projectedIsaAtAccess: number
  totalIsaContributions: number
  totalLisaBonus: number
  totalRetirementWealth: number
  combinedYearsOfIncome: number
  firstYearTaxWithIsa: number
  firstYearNetIncomeWithIsa: number
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
  // ISA options
  isaPots?: ISAPot[]
  isaDrawdownStrategy?: 'pension-first' | 'isa-first' | 'tax-optimised'
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

/** Default growth rate for cash ISAs (before fees) */
const ISA_CASH_DEFAULT_GROWTH = 2
/** Default growth premium above inflation for equity ISAs (S&S, LISA) */
const ISA_EQUITY_PREMIUM = 5

/** LISA annual contribution limit */
const LISA_ANNUAL_LIMIT = 4000
/** LISA government bonus rate */
const LISA_BONUS_RATE = 0.25
/** LISA max age for contributions */
const LISA_MAX_CONTRIBUTION_AGE = 50
/** LISA penalty-free withdrawal age */
const LISA_PENALTY_FREE_AGE = 60
/** LISA early withdrawal penalty (25% of gross including bonus) */
const LISA_EARLY_WITHDRAWAL_PENALTY_RATE = 0.25
/**
 * Advanced pension + ISA retirement projection with State Pension, DB pension,
 * LSA cap, fees, multiple pots, tax-optimised drawdown, and ISA modelling.
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
    isaPots = [],
    isaDrawdownStrategy = 'tax-optimised',
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

  // --- ISA pot balances ---
  let isaBalances = isaPots.map(p => ({
    ...p,
    balance: p.currentValue,
    rate: ((p.growthRateOverride ?? (p.type === 'cash' ? ISA_CASH_DEFAULT_GROWTH : inflationRate + ISA_EQUITY_PREMIUM)) - annualFeeRate) / 100,
  }))
  let totalIsaContributions = 0
  let totalLisaBonus = 0

  // --- Accumulation phase ---
  let potBalances = pots.map(p => ({
    ...p,
    balance: p.value,
    rate: ((p.growthRateOverride ?? assumedGrowthRate) - annualFeeRate) / 100,
  }))
  let contribution = annualContribution
  let totalContributions = 0

  for (let i = 0; i < yearsToAccess; i++) {
    const age = currentAge + i
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

    // --- ISA accumulation ---
    const isaOpening = isaBalances.reduce((s, p) => s + p.balance, 0)
    let isaGrowthTotal = 0
    let lisaBonusThisYear = 0
    for (const isa of isaBalances) {
      let contrib = isa.annualContribution
      // LISA: contributions and bonus stop at age 50, cap at £4k
      if (isa.type === 'lifetime') {
        if (age >= LISA_MAX_CONTRIBUTION_AGE) {
          contrib = 0
        } else {
          contrib = Math.min(contrib, LISA_ANNUAL_LIMIT)
          const bonus = contrib * LISA_BONUS_RATE
          lisaBonusThisYear += bonus
          isa.balance += bonus
        }
      }
      isa.balance += contrib
      const growth = isa.balance * isa.rate
      isa.balance += growth
      isaGrowthTotal += growth
      totalIsaContributions += contrib
    }
    totalLisaBonus += lisaBonusThisYear
    const isaClosing = isaBalances.reduce((s, p) => s + p.balance, 0)

    yearByYear.push({
      age,
      openingBalance: totalOpening,
      annualContribution: contribution,
      growthAmount: totalGrowth,
      closingBalance: totalClosing,
      isaOpeningBalance: isaOpening,
      isaContribution: isaBalances.reduce((s, p) => s + p.annualContribution, 0) + lisaBonusThisYear,
      isaGrowthAmount: isaGrowthTotal,
      isaClosingBalance: isaClosing,
      lisaBonusReceived: lisaBonusThisYear,
    })

    totalContributions += contribution
    contribution *= (1 + contributionGrowthDecimal)
  }

  const projectedPot = potBalances.reduce((s, p) => s + p.balance, 0)
  const projectedIsaAtAccess = isaBalances.reduce((s, p) => s + p.balance, 0)

  // --- LSA cap on tax-free lump sum ---
  const uncappedLumpSum = projectedPot * 0.25
  const taxFreeLumpSum = drawdownTaxFreeFirst ? 0 : Math.min(uncappedLumpSum, lumpSumAllowance)
  const lsaCapped = !drawdownTaxFreeFirst && uncappedLumpSum > lumpSumAllowance
  const drawdownPot = projectedPot - taxFreeLumpSum
  // Tax-free allowance remaining (for gradual drawdown mode)
  let taxFreeRemaining = drawdownTaxFreeFirst ? Math.min(uncappedLumpSum, lumpSumAllowance) : 0

  // --- State Pension ---
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
  const statePensionAtAccess = statePensionAnnual * Math.pow(1 + inflationDecimal, yearsToAccess)

  // --- DC income needed (after SP + DB offset) ---
  const dcIncomeNeeded = Math.max(0, inflatedAnnualIncome - statePensionAtAccess - dbPensionAtAccess)

  // --- ISA: split balances by type for drawdown ---
  let isaDrawdownBalance = projectedIsaAtAccess
  // Track LISA balance separately for penalty logic
  let lisaBalance = isaBalances
    .filter(p => p.type === 'lifetime')
    .reduce((s, p) => s + p.balance, 0)
  let nonLisaIsaBalance = isaDrawdownBalance - lisaBalance

  // --- Drawdown phase (access age to 125) ---
  const drawdownYears: DrawdownYear[] = []
  let drawdownBalance = drawdownPot
  let currentStatePension = statePensionAtAccess
  let currentDbPension = dbPensionAtAccess
  let currentTotalIncome = inflatedAnnualIncome
  const drawdownLength = Math.max(0, 125 - pensionAccessAge)

  let drawdownPA = personalAllowance * Math.pow(1 + inflationDecimal, yearsToAccess)
  let drawdownPATaper = personalAllowanceTaperThreshold != null
    ? personalAllowanceTaperThreshold * Math.pow(1 + inflationDecimal, yearsToAccess)
    : undefined

  let firstYearTax = 0
  let firstYearNetIncome = 0
  let firstYearTaxWithIsa = 0
  let firstYearNetIncomeWithIsa = 0

  const hasIsa = isaDrawdownBalance > 0

  for (let i = 0; i < drawdownLength; i++) {
    const age = pensionAccessAge + i
    const opening = drawdownBalance
    const isaOpening = isaDrawdownBalance

    // State Pension starts at statePensionAge, not access age
    const spThisYear = age >= statePensionAge ? currentStatePension : 0
    const dbThisYear = currentDbPension

    // Pension pot growth
    const pensionGrowth = opening > 0 ? opening * growthDecimal : 0
    const pensionAfterGrowth = opening + pensionGrowth

    // ISA pot growth (use weighted average rate across ISA pots, or global net rate)
    const isaGrowthRate = isaBalances.length > 0
      ? isaBalances.reduce((s, p) => s + p.rate, 0) / isaBalances.length
      : growthDecimal
    const isaGrowth = isaOpening > 0 ? isaOpening * isaGrowthRate : 0
    const isaAfterGrowth = isaOpening + isaGrowth

    // Calculate withdrawals based on strategy
    let pensionWithdrawal = 0
    let isaWithdrawal = 0

    if (annualIncomeNeeded > 0) {
      const remainingNeed = Math.max(0, currentTotalIncome - spThisYear - dbThisYear)

      if (!hasIsa || isaDrawdownStrategy === 'pension-first') {
        // Pension-first: exhaust pension before ISA
        pensionWithdrawal = Math.min(remainingNeed, pensionAfterGrowth)
        const stillNeeded = remainingNeed - pensionWithdrawal
        if (stillNeeded > 0) {
          isaWithdrawal = Math.min(stillNeeded, isaAfterGrowth)
        }
      } else if (isaDrawdownStrategy === 'isa-first') {
        // ISA-first: exhaust ISA before pension
        isaWithdrawal = Math.min(remainingNeed, isaAfterGrowth)
        const stillNeeded = remainingNeed - isaWithdrawal
        if (stillNeeded > 0) {
          pensionWithdrawal = Math.min(stillNeeded, pensionAfterGrowth)
        }
      } else {
        // Tax-optimised: draw pension up to PA tax-free band, then ISA, then more pension
        const taxableFromOther = spThisYear + dbThisYear
        const pensionTaxFreeRoom = Math.max(0, drawdownPA - taxableFromOther)
        // Draw pension up to the PA tax-free room
        pensionWithdrawal = Math.min(remainingNeed, pensionTaxFreeRoom, pensionAfterGrowth)
        let stillNeeded = remainingNeed - pensionWithdrawal
        // Then draw from ISA (tax-free)
        if (stillNeeded > 0 && isaAfterGrowth > 0) {
          isaWithdrawal = Math.min(stillNeeded, isaAfterGrowth)
          stillNeeded -= isaWithdrawal
        }
        // If still short, draw more from pension (will be taxed)
        if (stillNeeded > 0 && pensionAfterGrowth > pensionWithdrawal) {
          const additional = Math.min(stillNeeded, pensionAfterGrowth - pensionWithdrawal)
          pensionWithdrawal += additional
        }
      }
    }

    const pensionClosing = Math.max(0, pensionAfterGrowth - pensionWithdrawal)

    // ISA: apply LISA early withdrawal penalty if withdrawing before age 60
    let effectiveIsaWithdrawal = isaWithdrawal
    if (isaWithdrawal > 0 && lisaBalance > 0 && age < LISA_PENALTY_FREE_AGE) {
      // Draw from non-LISA first
      const fromNonLisa = Math.min(isaWithdrawal, nonLisaIsaBalance > 0 ? nonLisaIsaBalance : 0)
      const fromLisa = isaWithdrawal - fromNonLisa
      if (fromLisa > 0) {
        // 25% penalty on LISA withdrawal (applied to gross amount)
        const lisaPenalty = fromLisa * LISA_EARLY_WITHDRAWAL_PENALTY_RATE
        effectiveIsaWithdrawal = fromNonLisa + fromLisa - lisaPenalty
      }
    }

    const isaClosing = Math.max(0, isaAfterGrowth - isaWithdrawal)

    // Update LISA vs non-LISA tracking proportionally
    if (isaOpening > 0 && isaWithdrawal > 0) {
      const lisaRatio = lisaBalance / (isaOpening || 1)
      const lisaWithdrawn = isaWithdrawal * lisaRatio
      const nonLisaWithdrawn = isaWithdrawal - lisaWithdrawn
      lisaBalance = Math.max(0, (lisaBalance + isaGrowth * lisaRatio) - lisaWithdrawn)
      nonLisaIsaBalance = Math.max(0, (nonLisaIsaBalance + isaGrowth * (1 - lisaRatio)) - nonLisaWithdrawn)
    } else if (isaOpening > 0) {
      const lisaRatio = lisaBalance / (isaOpening || 1)
      lisaBalance += isaGrowth * lisaRatio
      nonLisaIsaBalance += isaGrowth * (1 - lisaRatio)
    }

    // In tax-free-first mode, pension withdrawals are tax-free until allowance is depleted
    const taxFreeThisYear = Math.min(pensionWithdrawal, taxFreeRemaining)
    taxFreeRemaining -= taxFreeThisYear
    const taxablePensionWithdrawal = pensionWithdrawal - taxFreeThisYear

    // Income tax: ISA withdrawals are NOT taxable and do NOT affect PA taper
    const totalGrossIncome = taxablePensionWithdrawal + spThisYear + dbThisYear
    let incomeTax = 0
    if (incomeTaxBands && totalGrossIncome > 0) {
      incomeTax = estimateRetirementIncomeTax(totalGrossIncome, drawdownPA, incomeTaxBands, drawdownPATaper)
    }
    const netPensionIncome = taxFreeThisYear + totalGrossIncome - incomeTax
    const combinedNet = netPensionIncome + effectiveIsaWithdrawal

    if (i === 0) {
      firstYearTax = incomeTax
      firstYearNetIncome = netPensionIncome
      // With ISA: potentially lower tax due to tax-optimised strategy
      firstYearTaxWithIsa = incomeTax
      firstYearNetIncomeWithIsa = combinedNet
    }

    drawdownYears.push({
      age,
      openingBalance: opening,
      withdrawal: pensionWithdrawal,
      growthAmount: pensionGrowth,
      closingBalance: pensionClosing,
      statePensionIncome: spThisYear,
      dbPensionIncome: dbThisYear,
      totalGrossIncome,
      incomeTaxOnWithdrawal: incomeTax,
      netIncomeAfterTax: netPensionIncome,
      isaOpeningBalance: isaOpening,
      isaWithdrawal: effectiveIsaWithdrawal,
      isaGrowthAmount: isaGrowth,
      isaClosingBalance: isaClosing,
      combinedNetIncome: combinedNet,
    })

    drawdownBalance = pensionClosing
    isaDrawdownBalance = isaClosing

    // Inflate for next year
    if (annualIncomeNeeded > 0) {
      currentTotalIncome *= (1 + inflationDecimal)
    }
    currentStatePension *= (1 + inflationDecimal)
    currentDbPension *= (1 + inflationDecimal)
    drawdownPA *= (1 + inflationDecimal)
    if (drawdownPATaper != null) drawdownPATaper *= (1 + inflationDecimal)
  }

  // Years of income: pension-only
  const yearsOfIncome = annualIncomeNeeded > 0
    ? drawdownYears.filter(y => y.openingBalance > 0).length
    : Infinity

  // Combined years of income: pension + ISA together
  const combinedYearsOfIncome = annualIncomeNeeded > 0
    ? drawdownYears.filter(y => y.openingBalance > 0 || y.isaOpeningBalance > 0).length
    : Infinity

  const totalRetirementWealth = projectedPot + projectedIsaAtAccess

  return {
    yearsToAccess,
    totalContributions,
    projectedPotAtAccess: projectedPot,
    taxFreeLumpSum,
    lsaCapped,
    drawdownPot,
    inflatedAnnualIncome,
    yearsOfIncome,
    yearByYear,
    drawdownYears,
    statePensionAnnual,
    projectedNIYears,
    dbPensionAnnualAtAccess: dbPensionAtAccess,
    dcIncomeNeeded,
    firstYearTax,
    firstYearNetIncome,
    // ISA results
    projectedIsaAtAccess,
    totalIsaContributions,
    totalLisaBonus,
    totalRetirementWealth,
    combinedYearsOfIncome,
    firstYearTaxWithIsa,
    firstYearNetIncomeWithIsa,
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
