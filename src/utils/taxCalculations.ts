import type { IncomeSource, GainSource, AppSettings, TaxSummary } from '@/types'
import type { TaxRules, TaxBand } from '@/taxRules/types'

const MARRIAGE_ALLOWANCE_TRANSFER = 1260
const MARRIAGE_ALLOWANCE_CREDIT = 252

// EIS / SEIS / VCT relief rates and investment limits
const SEIS_RELIEF_RATE = 0.50
const SEIS_INVESTMENT_LIMIT = 200_000
const EIS_RELIEF_RATE = 0.30
const EIS_INVESTMENT_LIMIT = 1_000_000
const VCT_RELIEF_RATE = 0.30
const VCT_INVESTMENT_LIMIT = 200_000

/** Apply tax bands to a given income amount, starting at an offset (already-used band space). */
function applyBands(bands: TaxBand[], income: number, offset: number): number {
  let remaining = income
  let tax = 0
  let used = offset

  for (const band of bands) {
    if (remaining <= 0) break
    const bandStart = band.from
    const bandEnd = band.to === Infinity ? Infinity : band.to
    const bandWidth = bandEnd === Infinity ? Infinity : bandEnd - bandStart

    // How much of this band is already consumed by offset?
    const alreadyUsed = Math.max(0, Math.min(used, bandEnd === Infinity ? used : bandEnd) - bandStart)
    const available = bandWidth === Infinity ? Infinity : Math.max(0, bandWidth - alreadyUsed)

    const taxable = Math.min(remaining, available === Infinity ? remaining : available)
    tax += taxable * band.rate
    remaining -= taxable
    used += taxable
  }

  return tax
}

/** Extend the basic rate band by a given amount (used for Gift Aid). */
function extendBasicRateBand(bands: TaxBand[], extensionAmount: number): TaxBand[] {
  if (extensionAmount <= 0) return bands
  return bands.map((band, i) => {
    if (i === 0) return { ...band, to: band.to + extensionAmount }
    return { ...band, from: band.from + extensionAmount, to: band.to === Infinity ? Infinity : band.to + extensionAmount }
  })
}

export function calculateTax(
  incomeSources: IncomeSource[],
  settings: AppSettings,
  rules: TaxRules,
  gainSources: GainSource[] = [],
): TaxSummary {
  // --- Categorise income ---
  const employmentSources = incomeSources.filter(s => s.type === 'employment')
  const selfEmploymentSources = incomeSources.filter(s => s.type === 'self-employment')
  const rentalSources = incomeSources.filter(s => s.type === 'rental')
  const dividendSources = incomeSources.filter(s => s.type === 'dividend' && !s.fromISA)
  const bondSources = incomeSources.filter(s => s.type === 'bond')
  const savingsSources = incomeSources.filter(s => s.type === 'savings')
  const savingsGross = savingsSources.reduce((sum, s) => sum + s.grossAmount, 0)

  const employmentGross = employmentSources.reduce((sum, s) => sum + s.grossAmount, 0)

  // --- Salary sacrifice ---
  const totalSalarySacrifice = employmentSources.reduce((sum, s) =>
    sum + (s.salarySacrificeItems ?? []).reduce((a, i) => a + i.annualAmount, 0), 0)
  // effectiveEmploymentGross: used for Class 1 NI (BIK does not attract employee NI)
  const effectiveEmploymentGross = Math.max(0, employmentGross - totalSalarySacrifice)
  // --- Benefits in Kind (P11D) ---
  const totalBIK = employmentSources.reduce((sum, s) =>
    sum + (s.benefitsInKind ?? []).reduce((a, i) => a + i.annualValue, 0), 0)
  // effectiveEmploymentGrossForIT: used for Income Tax (BIK adds to taxable income)
  const effectiveEmploymentGrossForIT = effectiveEmploymentGross + totalBIK
  const selfEmploymentGross = selfEmploymentSources.reduce((sum, s) => sum + s.grossAmount, 0)

  // Self-employment profit: use trading allowance (min £1k deduction) or actual expenses
  const selfEmploymentAllowableExpenses = selfEmploymentSources.reduce((sum, s) => {
    if (s.usesTradingAllowance) return sum + Math.min(1000, s.grossAmount)
    return sum + (s.allowableExpenses ?? 0)
  }, 0)
  const baseSelfEmploymentProfit = Math.max(0, selfEmploymentGross - selfEmploymentAllowableExpenses)
  // Basis period reform: add any transitional profit spread
  const selfEmploymentProfit = baseSelfEmploymentProfit + (settings.transitionalProfitSpread ?? 0)

  const rentalGross = rentalSources.reduce((sum, s) => sum + s.grossAmount, 0)
  const rentalAllowableExpenses = rentalSources.reduce(
    (sum, s) => sum + (s.rentalExpenses ?? 0),
    0,
  )
  const mortgageInterestTotal = rentalSources.reduce(
    (sum, s) => sum + (s.mortgageInterestAnnual ?? 0),
    0,
  )
  // Rental profit: apply property allowance if no other expenses claimed, else use actual expenses
  const rentalNetBeforeMortgage = Math.max(
    0,
    rentalGross - Math.max(rentalAllowableExpenses, rentalGross > 0 ? rules.propertyAllowance : 0),
  )

  const dividendGross = dividendSources.reduce((sum, s) => sum + s.grossAmount, 0)

  // --- Bond income (investment bond gains) ---
  const bondIncome = bondSources.reduce((sum, s) => sum + s.grossAmount, 0)

  // --- Pension deductions ---
  // Only employment + self-employment count as "relevant UK earnings" for pension relief
  let pensionDeduction = 0
  const pensionEligibleIncome = effectiveEmploymentGross + selfEmploymentProfit
  if (settings.pensionContributionType === 'percentage') {
    pensionDeduction = pensionEligibleIncome * (settings.pensionContributionValue / 100)
  } else if (settings.pensionContributionType === 'flat') {
    pensionDeduction = Math.min(settings.pensionContributionValue, pensionEligibleIncome)
  }
  const totalDeductions = pensionDeduction

  // --- Gift Aid ---
  const grossedUpGiftAid = (settings.giftAidDonations ?? 0) / 0.8

  // --- Adjusted net income (pension + grossed-up Gift Aid reduce it) ---
  // Bond income stacks on top of other non-savings income (no NI applies to bonds)
  const totalNonDividendGross = effectiveEmploymentGrossForIT + selfEmploymentProfit + rentalNetBeforeMortgage + bondIncome
  const adjustedNetIncome = Math.max(0, totalNonDividendGross - pensionDeduction - grossedUpGiftAid)

  // --- Effective personal allowance (tapers above £100k) ---
  const adjustedTotal = adjustedNetIncome + dividendGross + savingsGross
  const taperExcess = Math.max(0, adjustedTotal - rules.personalAllowanceTaperThreshold)
  let effectivePersonalAllowance = Math.max(0, rules.personalAllowance - Math.floor(taperExcess / 2))

  // --- Child Benefit / HICBC ---
  // Child Benefit is received tax-free but a charge applies when adjusted net income > hicbcThreshold
  let childBenefitAnnual = 0
  let hicbc = 0
  let hicbcMarginalRate = 0
  if ((settings.childBenefitClaiming ?? false) && (settings.numberOfChildren ?? 0) > 0) {
    const n = settings.numberOfChildren
    childBenefitAnnual = rules.childBenefitEldestWeekly * 52
      + Math.max(0, n - 1) * rules.childBenefitAdditionalWeekly * 52
    // HICBC taper: 1% of benefit per £200 over threshold → fully clawed back at taperEnd
    const taperRange = rules.hicbcTaperEnd - rules.hicbcThreshold
    if (adjustedTotal > rules.hicbcThreshold) {
      const excessOverThreshold = Math.min(adjustedTotal - rules.hicbcThreshold, taperRange)
      hicbc = Math.round((excessOverThreshold / taperRange) * childBenefitAnnual)
      // Additional effective marginal rate within the taper zone
      hicbcMarginalRate = childBenefitAnnual / taperRange
    }
  }

  // --- Blind Person's Allowance ---
  // BPA is added on top of the tapered PA (BPA itself is not tapered)
  const blindPersonsAllowanceApplied = (settings.hasBlindPersonsAllowance ?? false) ? rules.blindPersonsAllowance : 0
  effectivePersonalAllowance += blindPersonsAllowanceApplied

  // --- Marriage Allowance ---
  let marriageAllowanceCredit = 0
  if (settings.marriageAllowance === 'transferring') {
    effectivePersonalAllowance = Math.max(0, effectivePersonalAllowance - MARRIAGE_ALLOWANCE_TRANSFER)
  } else if (settings.marriageAllowance === 'receiving') {
    marriageAllowanceCredit = MARRIAGE_ALLOWANCE_CREDIT
  }

  // --- Taxable non-dividend income ---
  const taxableNonDividendIncome = Math.max(0, adjustedNetIncome - effectivePersonalAllowance)

  // --- Income Tax (non-dividend, non-savings) ---
  // Extend basic rate band for Gift Aid gross-up
  const baseBands = settings.scottishTaxpayer ? rules.scottishIncomeTaxBands : rules.incomeTaxBands
  const adjustedBands = extendBasicRateBand(baseBands, grossedUpGiftAid)

  // --- Personal Savings Allowance ---
  // PA is consumed by non-savings income first; any remainder absorbs savings income
  const remainingPAForSavings = Math.max(0, effectivePersonalAllowance - adjustedNetIncome)
  const taxableSavings = Math.max(0, savingsGross - remainingPAForSavings)

  // PSA tier determined by England/Wales/NI bands regardless of Scottish status
  const englandBasicRateTop = rules.incomeTaxBands[0].to  // £37,700
  let savingsAllowance: number
  if (taxableNonDividendIncome > rules.incomeTaxBands[1].to) {
    savingsAllowance = rules.savingsAllowanceAdditional // £0
  } else if (taxableNonDividendIncome + taxableSavings > englandBasicRateTop) {
    savingsAllowance = rules.savingsAllowanceHigher     // £500
  } else {
    savingsAllowance = rules.savingsAllowanceBasic      // £1,000
  }
  const savingsAfterAllowance = Math.max(0, taxableSavings - savingsAllowance)
  const savingsAllowanceApplied = Math.min(savingsAllowance, taxableSavings)
  const savingsTax = savingsAfterAllowance > 0
    ? applyBands(adjustedBands, savingsAfterAllowance, taxableNonDividendIncome)
    : 0

  const incomeTaxNonSavings = applyBands(adjustedBands, taxableNonDividendIncome, 0)
  const incomeTax = incomeTaxNonSavings + savingsTax

  // Gift Aid relief = extra tax saving for higher/additional rate taxpayers
  // (charity already claimed 20%; relief here is the additional saving above 20%)
  const taxWithoutGiftAid = applyBands(baseBands, Math.max(0, adjustedNetIncome + grossedUpGiftAid - effectivePersonalAllowance), 0)
  const giftAidRelief = Math.max(0, taxWithoutGiftAid - incomeTax)

  // --- Bond top-slicing relief ---
  // Top-slicing: tax on full bond gain vs tax on a single annual slice × years
  let bondTopSlicingRelief = 0
  if (bondIncome > 0) {
    // Base income stripped of ALL bond gains (taxable, so PA already removed upstream)
    const baseWithoutBonds = Math.max(0, adjustedNetIncome - bondIncome - effectivePersonalAllowance)
    // Tax with full bond gains already computed above (included in incomeTax via taxableNonDividendIncome)
    const taxWithFullBond = applyBands(adjustedBands, taxableNonDividendIncome, 0)

    let reliefSum = 0
    for (const s of bondSources) {
      const years = Math.max(1, s.yearsHeld ?? 1)
      const slice = s.grossAmount / years
      // Per HMRC IPTM3820: base for this bond includes all OTHER bonds' gains
      const otherBondGross = bondIncome - s.grossAmount
      const base = baseWithoutBonds + otherBondGross
      // Marginal tax on the annual slice
      const taxWithSlice = applyBands(adjustedBands, Math.max(0, base + slice), 0)
      const taxWithoutSlice = applyBands(adjustedBands, base, 0)
      const marginalOnSlice = Math.max(0, taxWithSlice - taxWithoutSlice)
      // Tax on full gain for this bond
      const taxOnFullGain = applyBands(adjustedBands, Math.max(0, base + s.grossAmount), 0)
                          - applyBands(adjustedBands, base, 0)
      reliefSum += Math.max(0, taxOnFullGain - marginalOnSlice * years)
    }
    bondTopSlicingRelief = Math.min(reliefSum, taxWithFullBond)
  }

  // --- EIS / SEIS / VCT Investment Relief ---
  // Relief is applied against income tax liability (not against NI or other charges).
  // SEIS has the highest rate (50%), so apply it first to maximise relief.
  const seisRelief = Math.min(
    Math.min(settings.seisInvestment ?? 0, SEIS_INVESTMENT_LIMIT) * SEIS_RELIEF_RATE,
    incomeTax,
  )
  const eisRelief = Math.min(
    Math.min(settings.eisInvestment ?? 0, EIS_INVESTMENT_LIMIT) * EIS_RELIEF_RATE,
    Math.max(0, incomeTax - seisRelief),
  )
  const vctRelief = Math.min(
    Math.min(settings.vctInvestment ?? 0, VCT_INVESTMENT_LIMIT) * VCT_RELIEF_RATE,
    Math.max(0, incomeTax - seisRelief - eisRelief),
  )
  const incomeTaxAfterRelief = Math.max(0, incomeTax - seisRelief - eisRelief - vctRelief - bondTopSlicingRelief)

  // --- Dividend Tax ---
  // Dividends are taxed after all other income, using remaining band space
  // Always use England/Wales/NI bands for dividend rate mapping
  const englandAdjustedBands = extendBasicRateBand(rules.incomeTaxBands, grossedUpGiftAid)
  const dividendAfterAllowance = Math.max(0, dividendGross - rules.dividendAllowance)
  let dividendTax = 0
  if (dividendAfterAllowance > 0) {
    let remaining = dividendAfterAllowance
    let offset = taxableNonDividendIncome + taxableSavings

    for (const band of englandAdjustedBands) {
      if (remaining <= 0) break
      const bandWidth = band.to === Infinity ? Infinity : band.to - band.from
      const alreadyUsed = Math.max(0, Math.min(offset, band.to === Infinity ? offset : band.to) - band.from)
      const available = bandWidth === Infinity ? Infinity : Math.max(0, bandWidth - alreadyUsed)
      const taxable = Math.min(remaining, available === Infinity ? remaining : available)

      let divRate: number
      if (band.rate <= 0.2) divRate = rules.dividendBasicRate
      else if (band.rate <= 0.4) divRate = rules.dividendHigherRate
      else divRate = rules.dividendAdditionalRate

      dividendTax += taxable * divRate
      remaining -= taxable
      offset += taxable
    }
  }

  // --- Mortgage Interest Tax Credit (rental) ---
  const mortgageTaxCredit = mortgageInterestTotal * 0.20

  // --- National Insurance ---
  // Class 1 (employment) — salary sacrifice reduces NI-able earnings
  let class1NI = 0
  if (effectiveEmploymentGross > rules.niPrimaryThreshold) {
    const lowerBand = Math.min(effectiveEmploymentGross, rules.niUpperEarningsLimit) - rules.niPrimaryThreshold
    const upperBand = Math.max(0, effectiveEmploymentGross - rules.niUpperEarningsLimit)
    class1NI = lowerBand * rules.niRateLower + upperBand * rules.niRateUpper
  }

  // Class 4 (self-employment)
  let class4NI = 0
  if (selfEmploymentProfit > rules.selfEmployedClass4LowerThreshold) {
    const lower = Math.min(selfEmploymentProfit, rules.selfEmployedClass4UpperThreshold) - rules.selfEmployedClass4LowerThreshold
    const upper = Math.max(0, selfEmploymentProfit - rules.selfEmployedClass4UpperThreshold)
    class4NI = lower * rules.selfEmployedClass4Lower + upper * rules.selfEmployedClass4Upper
  }

  // Class 2 (self-employment flat rate if profit > small profits threshold)
  let class2NI = 0
  if (selfEmploymentProfit > rules.selfEmployedSmallProfitsThreshold) {
    class2NI = rules.selfEmployedClass2WeeklyRate * 52
  }

  const nationalInsurance = class1NI + class4NI + class2NI

  // --- Student Loan ---
  // Under self-assessment, all income types count including dividends
  let studentLoan = 0
  const sl = rules.studentLoan
  const incomeForSL = adjustedNetIncome + dividendGross
  if (settings.studentLoanPlan === 'plan1' && incomeForSL > sl.plan1Threshold) {
    studentLoan = (incomeForSL - sl.plan1Threshold) * sl.plan1Rate
  } else if (settings.studentLoanPlan === 'plan2' && incomeForSL > sl.plan2Threshold) {
    studentLoan = (incomeForSL - sl.plan2Threshold) * sl.plan2Rate
  } else if (settings.studentLoanPlan === 'plan4' && incomeForSL > sl.plan4Threshold) {
    studentLoan = (incomeForSL - sl.plan4Threshold) * sl.plan4Rate
  } else if (settings.studentLoanPlan === 'postgrad' && incomeForSL > sl.postgradThreshold) {
    studentLoan = (incomeForSL - sl.postgradThreshold) * sl.postgradRate
  }

  // --- Postgraduate Loan (additional to undergraduate plan) ---
  let postgradLoanRepayment = 0
  const hasUndergrad = settings.studentLoanPlan !== 'none' && settings.studentLoanPlan !== 'postgrad'
  if ((settings.hasPostgradLoan ?? false) && hasUndergrad && incomeForSL > sl.postgradThreshold) {
    postgradLoanRepayment = (incomeForSL - sl.postgradThreshold) * sl.postgradRate
  }

  // --- Capital Gains Tax ---
  // Separate BADR and non-BADR gains
  const badrSources = gainSources.filter(g => g.isBADR === true && !g.isResidentialProperty)
  const nonBadrSources = gainSources.filter(g => !g.isBADR || g.isResidentialProperty)

  const totalNonBadrGains = nonBadrSources.reduce((sum, g) => sum + (g.gainAmount - g.allowableCosts), 0)
  const totalBadrGainsRaw = badrSources.reduce((sum, g) => sum + (g.gainAmount - g.allowableCosts), 0)
  const totalGains = totalNonBadrGains + totalBadrGainsRaw

  // Apply carry-forward losses to non-BADR gains first (maximises BADR benefit)
  const lossPool = settings.capitalLossCarryForward ?? 0
  const lossAgainstNonBadr = Math.min(lossPool, Math.max(0, totalNonBadrGains))
  const lossRemainder = lossPool - lossAgainstNonBadr
  const lossAgainstBadr = Math.min(lossRemainder, Math.max(0, totalBadrGainsRaw))
  const carryForwardLossesApplied = lossAgainstNonBadr + lossAgainstBadr

  // Annual exempt amount: applied to non-BADR gains first
  const nonBadrAfterLosses = Math.max(0, totalNonBadrGains - lossAgainstNonBadr)
  const aemtUsedByNonBadr = Math.min(rules.cgtAnnualExemptAmount, nonBadrAfterLosses)
  const aemtRemainder = rules.cgtAnnualExemptAmount - aemtUsedByNonBadr
  const taxableNonBadr = Math.max(0, nonBadrAfterLosses - aemtUsedByNonBadr)

  const badrGainsAfterLosses = Math.max(0, totalBadrGainsRaw - lossAgainstBadr)
  const taxableBadrGainFull = Math.max(0, badrGainsAfterLosses - aemtRemainder)

  const taxableGain = taxableNonBadr + taxableBadrGainFull

  // BADR lifetime allowance check
  const badrAllowanceRemaining = Math.max(0, rules.badrLifetimeAllowance - (settings.badrLifetimeUsed ?? 0))
  const qualifyingBadrGain = Math.min(taxableBadrGainFull, badrAllowanceRemaining)
  const overLimitBadrGain = taxableBadrGainFull - qualifyingBadrGain

  const badrGains = qualifyingBadrGain
  const badrTax = qualifyingBadrGain * rules.badrRate

  // Non-BADR gains (+ any BADR over lifetime limit) taxed at regular CGT rates
  const regularTaxableGain = taxableNonBadr + overLimitBadrGain
  let regularCgt = 0
  if (regularTaxableGain > 0) {
    // CGT uses remaining basic rate band (after income + dividends)
    const basicRateBandTop = englandAdjustedBands[0].to
    const bandUsed = taxableNonDividendIncome + taxableSavings + dividendAfterAllowance
    const remainingBasicRate = Math.max(0, basicRateBandTop - bandUsed)
    const basicRatePortion = Math.min(regularTaxableGain, remainingBasicRate)
    const higherRatePortion = regularTaxableGain - basicRatePortion
    regularCgt = basicRatePortion * rules.cgtBasicRate + higherRatePortion * rules.cgtHigherRate
  }

  const capitalGainsTax = badrTax + regularCgt

  // --- Pension Annual Allowance ---
  // Resolve employer contribution: percentage uses the same eligible income basis as employee
  let employerPension = 0
  if (settings.employerPensionContributionType === 'percentage') {
    employerPension = pensionEligibleIncome * ((settings.employerPensionContributionValue ?? 0) / 100)
  } else {
    employerPension = settings.employerPensionContributionValue ?? 0
  }
  const totalPensionFunding = pensionDeduction + employerPension
  // Threshold income = adjusted net income + dividends (before pension deduction being re-added)
  // Adjusted income for taper = threshold income + employer contributions
  const thresholdIncomeForAA = adjustedNetIncome + dividendGross + pensionDeduction
  const adjustedIncomeForAA = thresholdIncomeForAA + employerPension
  let effectiveAnnualAllowance = rules.pensionAnnualAllowance
  if (
    thresholdIncomeForAA > rules.pensionTaperThresholdIncome &&
    adjustedIncomeForAA > rules.pensionTaperAdjustedIncome
  ) {
    const taper = Math.floor((adjustedIncomeForAA - rules.pensionTaperAdjustedIncome) / 2)
    effectiveAnnualAllowance = Math.max(rules.pensionAnnualAllowanceMinimum, rules.pensionAnnualAllowance - taper)
  }
  const carryForward = settings.pensionCarryForward ?? { threeYearsAgo: 0, twoYearsAgo: 0, oneYearAgo: 0 }
  const totalCarryForward = (carryForward.threeYearsAgo ?? 0) + (carryForward.twoYearsAgo ?? 0) + (carryForward.oneYearAgo ?? 0)
  // Carry-forward can only be used once the current year's AA is fully used
  const carryForwardUsable = Math.max(0, totalPensionFunding - effectiveAnnualAllowance)
  const carryForwardApplied = Math.min(carryForwardUsable, totalCarryForward)
  const totalAnnualAllowanceAvailable = effectiveAnnualAllowance + carryForwardApplied
  const annualAllowanceExcess = Math.max(0, totalPensionFunding - totalAnnualAllowanceAvailable)
  const annualAllowanceRemaining = Math.max(0, effectiveAnnualAllowance - totalPensionFunding)

  // --- Self-Assessment Tax Estimate (for Payments on Account) ---
  // Approximation: total tax minus employee Class 1 NI (deducted via PAYE)
  const selfAssessmentTaxEstimate = Math.max(0, incomeTaxAfterRelief + dividendTax - mortgageTaxCredit + studentLoan + postgradLoanRepayment + capitalGainsTax + class2NI + class4NI + hicbc - marriageAllowanceCredit)

  // --- Totals ---
  // Child Benefit received is included in grossIncome (it's actual money in);
  // HICBC is included in totalTax so netIncome reflects the true financial position.
  const grossIncome = employmentGross + selfEmploymentGross + rentalGross + dividendGross + bondIncome + savingsGross + childBenefitAnnual
  const totalTax = Math.max(
    0,
    incomeTaxAfterRelief + nationalInsurance + dividendTax - mortgageTaxCredit
    + studentLoan + postgradLoanRepayment + capitalGainsTax - marriageAllowanceCredit + hicbc,
  )
  const netIncome = grossIncome - selfEmploymentAllowableExpenses - rentalAllowableExpenses - totalDeductions - totalSalarySacrifice - totalTax
  const effectiveTaxRate = grossIncome > 0 ? totalTax / grossIncome : 0

  return {
    grossIncome,
    totalDeductions,
    adjustedNetIncome,
    taxableNonDividendIncome,
    dividendIncome: dividendGross,
    effectivePersonalAllowance,
    incomeTax: incomeTaxAfterRelief,
    nationalInsurance,
    dividendTax,
    mortgageTaxCredit,
    studentLoan,
    postgradLoanRepayment,
    giftAidRelief,
    marriageAllowanceCredit,
    capitalGainsTax,
    taxableGain,
    totalGains,
    totalTax,
    netIncome,
    effectiveTaxRate,
    employmentGross,
    selfEmploymentGross,
    selfEmploymentAllowableExpenses,
    rentalGross,
    rentalAllowableExpenses,
    rentalNetBeforeMortgage,
    dividendGross,
    class1NI,
    class2NI,
    class4NI,
    salarySacrificeTotal: totalSalarySacrifice,
    bikTotal: totalBIK,
    childBenefitAnnual,
    hicbc,
    hicbcMarginalRate,
    seisRelief,
    eisRelief,
    vctRelief,
    blindPersonsAllowanceApplied,
    employerPensionFunding: employerPension,
    totalPensionFunding,
    effectiveAnnualAllowance,
    totalAnnualAllowanceAvailable,
    annualAllowanceExcess,
    annualAllowanceRemaining,
    carryForwardLossesApplied,
    selfAssessmentTaxEstimate,
    badrGains,
    badrTax,
    bondIncome,
    bondTopSlicingRelief,
    savingsIncome: savingsGross,
    savingsTax,
    savingsAllowanceApplied,
  }
}
