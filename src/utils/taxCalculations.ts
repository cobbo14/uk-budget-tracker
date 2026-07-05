import type { IncomeSource, GainSource, AppSettings, TaxSummary } from '@/types'
import type { TaxRules, TaxBand } from '@/taxRules/types'

// Result cache — avoids repeated calculations in planning loops (pension chart, what-if, etc.)
const _taxCache = new Map<string, TaxSummary>()
const _TAX_CACHE_MAX = 512

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
  // --- Cache check ---
  const _cacheKey = JSON.stringify([incomeSources, settings, gainSources, rules.label])
  const _cached = _taxCache.get(_cacheKey)
  if (_cached) return _cached

  // --- Categorise income ---
  const employmentSources = incomeSources.filter(s => s.type === 'employment')
  const selfEmploymentSources = incomeSources.filter(s => s.type === 'self-employment')
  const rentalSources = incomeSources.filter(s => s.type === 'rental')
  const dividendSources = incomeSources.filter(s => s.type === 'dividend' && !s.fromISA)
  const bondSources = incomeSources.filter(s => s.type === 'bond')
  const savingsSources = incomeSources.filter(s => s.type === 'savings' && !s.fromISA)
  const savingsGross = savingsSources.reduce((sum, s) => sum + s.grossAmount, 0)
  // Pension income (state pension, DB pensions, annuities, taxable drawdown):
  // taxable non-savings income; no NI; not relevant earnings for pension relief;
  // unearned income for student loan purposes.
  const pensionIncomeSources = incomeSources.filter(s => s.type === 'pension')
  const pensionIncomeGross = pensionIncomeSources.reduce((sum, s) => sum + s.grossAmount, 0)

  const bonusTotal = employmentSources.reduce((sum, s) => sum + (s.bonus ?? 0), 0)
  const employmentGross = employmentSources.reduce((sum, s) => sum + s.grossAmount + (s.bonus ?? 0), 0)

  // --- Salary sacrifice ---
  const sourceSalarySacrifice = (s: IncomeSource): number =>
    (s.salarySacrificeItems ?? []).reduce((a, i) =>
      a + (i.amountType === 'percentage' ? s.grossAmount * (i.annualAmount / 100) : i.annualAmount), 0)
  const totalSalarySacrifice = employmentSources.reduce((sum, s) => sum + sourceSalarySacrifice(s), 0)
  // Pension portion of salary sacrifice (counts toward Annual Allowance)
  const salarySacrificePension = employmentSources.reduce((sum, s) =>
    sum + (s.salarySacrificeItems ?? []).filter(i => i.type === 'pension').reduce((a, i) =>
      a + (i.amountType === 'percentage' ? s.grossAmount * (i.annualAmount / 100) : i.annualAmount), 0), 0)
  // effectiveEmploymentGross: employment pay after salary sacrifice (pre-BIK)
  const effectiveEmploymentGross = Math.max(0, employmentGross - totalSalarySacrifice)
  // --- Benefits in Kind (P11D) ---
  const totalBIK = employmentSources.reduce((sum, s) =>
    sum + (s.benefitsInKind ?? []).reduce((a, i) => {
      // Company car: taxable benefit = P11D value × BIK rate %
      if (i.type === 'companyCar' && i.bikRate != null) return a + i.annualValue * (i.bikRate / 100)
      return a + i.annualValue
    }, 0), 0)
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
  // Rent-a-Room relief (lodger in own home): taxable = gross − £7,500 per source,
  // forfeiting actual expenses and the mortgage-interest credit for that source.
  const rentARoomSources = rentalSources.filter(s => s.usesRentARoom === true)
  const normalRentalSources = rentalSources.filter(s => s.usesRentARoom !== true)
  const rentARoomNet = rentARoomSources.reduce(
    (sum, s) => sum + Math.max(0, s.grossAmount - rules.rentARoomRelief),
    0,
  )
  const normalRentalGross = normalRentalSources.reduce((sum, s) => sum + s.grossAmount, 0)
  const rentalAllowableExpenses = normalRentalSources.reduce(
    (sum, s) => sum + (s.rentalExpenses ?? 0),
    0,
  )
  const mortgageInterestTotal = normalRentalSources.reduce(
    (sum, s) => sum + (s.mortgageInterestAnnual ?? 0),
    0,
  )
  // Property allowance is an alternative to claiming actual expenses AND the 20%
  // finance-cost credit — claiming it forfeits both. Apply it only when it beats
  // actual expenses and no mortgage interest is claimed.
  const usesPropertyAllowance = normalRentalGross > 0 && mortgageInterestTotal === 0
    && rules.propertyAllowance > rentalAllowableExpenses
  const rentalNetBeforeMortgage = rentARoomNet + Math.max(
    0,
    normalRentalGross - (usesPropertyAllowance
      ? Math.min(rules.propertyAllowance, normalRentalGross)
      : rentalAllowableExpenses),
  )

  const dividendGross = dividendSources.reduce((sum, s) => sum + s.grossAmount, 0)

  // --- Bond income (investment bond gains) ---
  const bondIncome = bondSources.reduce((sum, s) => sum + s.grossAmount, 0)

  // --- Pension deductions ---
  // Only employment + self-employment count as "relevant UK earnings" for pension relief.
  // Workplace contributions are treated as net pay (deducted from income before tax).
  let pensionDeduction = 0
  const pensionEligibleIncome = effectiveEmploymentGross + selfEmploymentProfit
  if (settings.pensionContributionType === 'percentage') {
    // Net-pay contributions cannot exceed relevant earnings (cap percentage at 100%)
    pensionDeduction = Math.min(pensionEligibleIncome * (settings.pensionContributionValue / 100), pensionEligibleIncome)
  } else if (settings.pensionContributionType === 'flat') {
    pensionDeduction = Math.min(settings.pensionContributionValue, pensionEligibleIncome)
  }
  // SIPP is relief at source: the user pays the net amount, the provider adds 20%.
  // It does NOT reduce taxable income — higher-rate relief comes via basic-band extension.
  // Relief is capped at 100% of relevant UK earnings (employment + self-employment),
  // with a £3,600 gross floor for low/no earners; contributions above the cap get
  // no relief (no band extension, no adjusted-net-income reduction).
  const sippContribution = settings.sippContribution ?? 0
  const sippGross = Math.min(sippContribution / 0.8, Math.max(3600, pensionEligibleIncome))
  // totalDeductions = cash the user paid into pensions (net-pay + net SIPP)
  const totalDeductions = pensionDeduction + sippContribution

  // --- Gift Aid ---
  // Like SIPP, Gift Aid relief works by basic-band extension (and reduces adjusted
  // net income for taper/HICBC) — it is not an income deduction.
  const grossedUpGiftAid = (settings.giftAidDonations ?? 0) / 0.8

  // --- Income layers ---
  // Layer 1: non-savings income (employment + self-employment + rental) — Scottish or
  // rUK bands. Layer 2: savings income (interest + onshore bond gains, which are
  // legally savings income) — always rUK bands. Layer 3: dividends — rUK bands.
  const nonSavingsGross = effectiveEmploymentGrossForIT + selfEmploymentProfit + rentalNetBeforeMortgage + pensionIncomeGross
  const savingsLayerGross = savingsGross + bondIncome

  // Net-pay pension deduction reduces non-savings income first, spilling into savings
  const nonSavingsAfterDeductions = Math.max(0, nonSavingsGross - pensionDeduction)
  const deductionSpill = Math.max(0, pensionDeduction - nonSavingsGross)
  const savingsAfterDeductions = Math.max(0, savingsLayerGross - deductionSpill)

  // --- Adjusted net income (HMRC definition: all income less gross RAS pension and
  // grossed-up Gift Aid) — drives PA taper, HICBC and threshold displays ---
  const adjustedNetIncome = Math.max(
    0,
    nonSavingsAfterDeductions + savingsAfterDeductions + dividendGross - sippGross - grossedUpGiftAid,
  )

  // --- Effective personal allowance (tapers above £100k) ---
  const adjustedTotal = adjustedNetIncome
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
      // HMRC charges in whole 1% steps: 1% of the benefit per full £200 over the threshold
      const chargePercent = Math.min(100, Math.floor(excessOverThreshold / (taperRange / 100)))
      hicbc = Math.round(childBenefitAnnual * (chargePercent / 100))
      // Additional effective marginal rate within the taper zone
      hicbcMarginalRate = childBenefitAnnual / taperRange
    }
  }

  // --- Blind Person's Allowance ---
  // BPA is added on top of the tapered PA (BPA itself is not tapered)
  const blindPersonsAllowanceApplied = (settings.hasBlindPersonsAllowance ?? false) ? rules.blindPersonsAllowance : 0
  effectivePersonalAllowance += blindPersonsAllowanceApplied

  // --- Marriage Allowance (transfer side; recipient credit is resolved after
  // the income tax liability is known, since it is capped at tax due) ---
  // The transferor must not be liable above basic rate (Scotland: not above
  // intermediate) — HMRC refuses the transfer otherwise, so we skip it too.
  let marriageAllowanceTransferApplied = false
  if (settings.marriageAllowance === 'transferring') {
    const transferBandLimit = (settings.scottishTaxpayer
      ? rules.scottishIncomeTaxBands.filter(b => b.rate < 0.40).slice(-1)[0].to
      : rules.incomeTaxBands[0].to) + grossedUpGiftAid + sippGross
    const taxableBeforeTransfer = Math.max(
      0,
      nonSavingsAfterDeductions + savingsAfterDeductions + dividendGross - effectivePersonalAllowance,
    )
    if (taxableBeforeTransfer <= transferBandLimit) {
      effectivePersonalAllowance = Math.max(0, effectivePersonalAllowance - rules.marriageAllowanceTransfer)
      marriageAllowanceTransferApplied = true
    }
  }

  // --- Personal allowance allocation: non-savings first, then savings, then dividends ---
  const taxableNonDividendIncome = Math.max(0, nonSavingsAfterDeductions - effectivePersonalAllowance)
  const remainingPAForSavings = Math.max(0, effectivePersonalAllowance - nonSavingsAfterDeductions)
  const taxableSavings = Math.max(0, savingsAfterDeductions - remainingPAForSavings)
  const remainingPAForDividends = Math.max(0, remainingPAForSavings - savingsAfterDeductions)

  // --- Tax bands ---
  // Basic-rate band extends by grossed-up Gift Aid + gross SIPP (relief at source)
  const bandExtension = grossedUpGiftAid + sippGross
  const baseBands = settings.scottishTaxpayer ? rules.scottishIncomeTaxBands : rules.incomeTaxBands
  const adjustedBands = extendBasicRateBand(baseBands, bandExtension)
  // Savings, dividends and CGT always use England/Wales/NI bands (even for Scottish taxpayers)
  const englandAdjustedBands = extendBasicRateBand(rules.incomeTaxBands, bandExtension)

  // --- Savings income: starting rate, then PSA, then bands ---
  // Starting rate for savings: 0% on up to £5,000, eroded £1-for-£1 by taxable non-savings income
  const startingRateBand = Math.max(0, rules.startingRateForSavingsLimit - taxableNonDividendIncome)
  const startingSavingsRateApplied = Math.min(taxableSavings, startingRateBand)

  // PSA tier determined by England/Wales/NI bands regardless of Scottish status,
  // using the Gift-Aid/SIPP-extended limits (band extension can keep someone
  // basic-rate for PSA purposes). HMRC bases the tier on total taxable income
  // including nil-rated dividends.
  // The dividend allowance is a nil-rate band: dividends inside it still consume
  // band space, so the taxed remainder stacks above it.
  const dividendAllowanceUsed = Math.min(Math.max(0, dividendGross - remainingPAForDividends), rules.dividendAllowance)
  const taxableDividendsForPSA = Math.max(0, dividendGross - remainingPAForDividends - rules.dividendAllowance)
  const totalTaxableForPSA = taxableNonDividendIncome + taxableSavings + taxableDividendsForPSA + dividendAllowanceUsed
  let savingsAllowance: number
  if (totalTaxableForPSA > englandAdjustedBands[1].to) {
    savingsAllowance = rules.savingsAllowanceAdditional // £0
  } else if (totalTaxableForPSA > englandAdjustedBands[0].to) {
    savingsAllowance = rules.savingsAllowanceHigher     // £500
  } else {
    savingsAllowance = rules.savingsAllowanceBasic      // £1,000
  }
  const savingsAfterStartingRate = Math.max(0, taxableSavings - startingSavingsRateApplied)
  const savingsAllowanceApplied = Math.min(savingsAllowance, savingsAfterStartingRate)
  const savingsAfterAllowance = Math.max(0, savingsAfterStartingRate - savingsAllowance)
  // The starting rate and PSA are nil-rate bands: savings income inside them is
  // taxed at 0% but still counts towards the basic/higher rate limits, so it
  // must be included in the stacking offset for the taxed remainder.
  const savingsNilRateUsed = startingSavingsRateApplied + savingsAllowanceApplied
  const savingsTax = savingsAfterAllowance > 0
    ? applyBands(englandAdjustedBands, savingsAfterAllowance, taxableNonDividendIncome + savingsNilRateUsed)
    : 0

  const incomeTaxNonSavings = applyBands(adjustedBands, taxableNonDividendIncome, 0)
  const incomeTax = incomeTaxNonSavings + savingsTax

  // Gift Aid relief = extra tax saving for higher/additional rate taxpayers from the
  // band extension (charity already claimed the basic 20%)
  const bandsWithoutGiftAid = extendBasicRateBand(baseBands, sippGross)
  const giftAidRelief = Math.max(0, applyBands(bandsWithoutGiftAid, taxableNonDividendIncome, 0) - incomeTaxNonSavings)

  // --- Bond top-slicing relief ---
  // Top-slicing: tax on full bond gain vs tax on a single annual slice × years.
  // Bond gains sit at the top of the savings layer (above interest), on rUK bands.
  let bondTopSlicingRelief = 0
  // Onshore bonds: basic-rate tax is treated as already paid within the fund — a
  // non-refundable 20% credit against the tax charged on the onshore gain portion.
  let bondBasicRateCredit = 0
  // Portion of the taxed savings amount attributable to bond gains (PA, starting
  // rate and PSA are allocated to interest first, so bonds form the top slice)
  const bondTaxablePortion = Math.min(bondIncome, savingsAfterAllowance)
  if (bondIncome > 0 && bondTaxablePortion > 0) {
    const interestTaxedPortion = savingsAfterAllowance - bondTaxablePortion
    const baseOffset = taxableNonDividendIncome + savingsNilRateUsed + interestTaxedPortion
    const scale = bondTaxablePortion / bondIncome  // fraction of bond gains actually taxed

    let reliefSum = 0
    let onshoreTaxedGain = 0
    for (const s of bondSources) {
      const years = Math.max(1, s.yearsHeld ?? 1)
      const taxedGain = s.grossAmount * scale
      if (s.bondType !== 'offshore') onshoreTaxedGain += taxedGain
      const slice = taxedGain / years
      // Per HMRC IPTM3820: base for this bond includes all OTHER bonds' gains
      const base = baseOffset + (bondTaxablePortion - taxedGain)
      const taxOnFullGain = applyBands(englandAdjustedBands, taxedGain, base)
      const marginalOnSlice = applyBands(englandAdjustedBands, slice, base)
      reliefSum += Math.max(0, taxOnFullGain - marginalOnSlice * years)
    }
    // Relief cannot exceed the tax actually charged on the bond portion
    const taxOnBondPortion = applyBands(englandAdjustedBands, bondTaxablePortion, baseOffset)
    bondTopSlicingRelief = Math.min(reliefSum, taxOnBondPortion)
    // Onshore credit: 20% of the taxed onshore gain, capped (non-refundable) at the
    // tax still charged on the onshore share after top-slicing relief. Pragmatic
    // proration of HMRC's ordering when onshore and offshore bonds are mixed.
    const onshoreShare = bondTaxablePortion > 0 ? onshoreTaxedGain / bondTaxablePortion : 0
    bondBasicRateCredit = Math.min(
      0.20 * onshoreTaxedGain,
      Math.max(0, (taxOnBondPortion - bondTopSlicingRelief) * onshoreShare),
    )
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
  const incomeTaxAfterRelief = Math.max(0, incomeTax - seisRelief - eisRelief - vctRelief - bondTopSlicingRelief - bondBasicRateCredit)

  // --- Dividend Tax ---
  // Dividends are taxed after all other income, using remaining band space on
  // England/Wales/NI bands. Any personal allowance left after non-savings and
  // savings income covers dividends first, then the dividend allowance applies.
  const dividendAfterAllowance = Math.max(0, dividendGross - remainingPAForDividends - rules.dividendAllowance)
  let dividendTax = 0
  if (dividendAfterAllowance > 0) {
    let remaining = dividendAfterAllowance
    let offset = taxableNonDividendIncome + taxableSavings + dividendAllowanceUsed

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

  // --- Marriage Allowance (recipient credit) ---
  // Recipient must be a basic-rate taxpayer (Scotland: no higher than
  // intermediate); the credit cannot exceed income tax due
  let marriageAllowanceCredit = 0
  if (settings.marriageAllowance === 'receiving') {
    const recipientBandLimit = settings.scottishTaxpayer
      ? adjustedBands.filter(b => b.rate < 0.40).slice(-1)[0].to
      : englandAdjustedBands[0].to
    const isBasicRate = totalTaxableForPSA <= recipientBandLimit
    marriageAllowanceCredit = isBasicRate
      ? Math.min(rules.marriageAllowanceCredit, incomeTaxAfterRelief + dividendTax)
      : 0
  }

  // --- Mortgage Interest Tax Credit (rental) ---
  // 20% × lowest of: finance costs, property profits, taxable non-savings income
  const mortgageTaxCredit = 0.20 * Math.max(
    0,
    Math.min(mortgageInterestTotal, rentalNetBeforeMortgage, taxableNonDividendIncome),
  )

  // --- National Insurance ---
  // Class 1 (employment) — calculated per employment: unlike income tax, each job
  // gets its own primary threshold and UEL. Salary sacrifice reduces NI-able
  // earnings; BIK does not attract employee NI.
  let class1NILowerBandTax = 0
  let class1NIUpperBandTax = 0
  for (const s of employmentSources) {
    const niable = Math.max(0, s.grossAmount + (s.bonus ?? 0) - sourceSalarySacrifice(s))
    if (niable > rules.niPrimaryThreshold) {
      const lowerBand = Math.min(niable, rules.niUpperEarningsLimit) - rules.niPrimaryThreshold
      const upperBand = Math.max(0, niable - rules.niUpperEarningsLimit)
      class1NILowerBandTax += lowerBand * rules.niRateLower
      class1NIUpperBandTax += upperBand * rules.niRateUpper
    }
  }
  const class1NI = class1NILowerBandTax + class1NIUpperBandTax

  // Class 4 (self-employment)
  let class4NI = 0
  if (selfEmploymentProfit > rules.selfEmployedClass4LowerThreshold) {
    const lower = Math.min(selfEmploymentProfit, rules.selfEmployedClass4UpperThreshold) - rules.selfEmployedClass4LowerThreshold
    const upper = Math.max(0, selfEmploymentProfit - rules.selfEmployedClass4UpperThreshold)
    class4NI = lower * rules.selfEmployedClass4Lower + upper * rules.selfEmployedClass4Upper
  }

  // Class 2: compulsory Class 2 NI was abolished from 6 April 2024. Profits at or above
  // the small profits threshold earn NI credits automatically at no cost; below it,
  // Class 2 can be paid voluntarily (not modelled here — it's an optional choice).
  const class2NI = 0

  const nationalInsurance = class1NI + class4NI + class2NI

  // --- Student Loan ---
  // SL income is not reduced by relief-at-source pension or Gift Aid (net-pay
  // deductions do reduce it). Earned income excludes BIK (not repayment income).
  // Unearned income (savings, bonds, dividends, rental) counts under
  // self-assessment only when it exceeds £2,000 in total, then in full.
  let studentLoan = 0
  const sl = rules.studentLoan
  const earnedForSL = Math.max(0, effectiveEmploymentGross + selfEmploymentProfit - pensionDeduction)
  const unearnedForSL = dividendGross + savingsGross + bondIncome + rentalNetBeforeMortgage + pensionIncomeGross
  const incomeForSL = earnedForSL + (unearnedForSL > 2000 ? unearnedForSL : 0)
  if (settings.studentLoanPlan === 'plan1' && incomeForSL > sl.plan1Threshold) {
    studentLoan = (incomeForSL - sl.plan1Threshold) * sl.plan1Rate
  } else if (settings.studentLoanPlan === 'plan2' && incomeForSL > sl.plan2Threshold) {
    studentLoan = (incomeForSL - sl.plan2Threshold) * sl.plan2Rate
  } else if (settings.studentLoanPlan === 'plan4' && incomeForSL > sl.plan4Threshold) {
    studentLoan = (incomeForSL - sl.plan4Threshold) * sl.plan4Rate
  } else if (settings.studentLoanPlan === 'plan5' && incomeForSL > sl.plan5Threshold) {
    studentLoan = (incomeForSL - sl.plan5Threshold) * sl.plan5Rate
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

  // Brought-forward losses only reduce net gains down to the annual exempt
  // amount — never below it, so the AEA is not wasted and the unused loss pool
  // carries forward again. Applied to non-BADR gains first (maximises BADR benefit).
  const lossPool = settings.capitalLossCarryForward ?? 0
  const netGainsTotal = Math.max(0, totalNonBadrGains) + Math.max(0, totalBadrGainsRaw)
  const lossesUsable = Math.min(lossPool, Math.max(0, netGainsTotal - rules.cgtAnnualExemptAmount))
  const lossAgainstNonBadr = Math.min(lossesUsable, Math.max(0, totalNonBadrGains))
  const lossAgainstBadr = Math.min(lossesUsable - lossAgainstNonBadr, Math.max(0, totalBadrGainsRaw))
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
    // CGT uses remaining basic rate band (after income + dividends, including
    // the band space consumed by the dividend nil-rate allowance)
    const basicRateBandTop = englandAdjustedBands[0].to
    const bandUsed = taxableNonDividendIncome + taxableSavings + dividendAfterAllowance + dividendAllowanceUsed
    const remainingBasicRate = Math.max(0, basicRateBandTop - bandUsed)
    const basicRatePortion = Math.min(regularTaxableGain, remainingBasicRate)
    const higherRatePortion = regularTaxableGain - basicRatePortion
    regularCgt = basicRatePortion * rules.cgtBasicRate + higherRatePortion * rules.cgtHigherRate
  }

  const capitalGainsTax = badrTax + regularCgt

  // --- Pension Annual Allowance ---
  // Resolve employer contribution: global setting + per-source employer contributions
  let employerPension = 0
  if (settings.employerPensionContributionType === 'percentage') {
    employerPension = pensionEligibleIncome * ((settings.employerPensionContributionValue ?? 0) / 100)
  } else if (settings.employerPensionContributionType === 'qualifying') {
    // Auto-enrolment basis: percentage of each job's qualifying earnings —
    // the band between £6,240 and £50,270 of post-sacrifice pay
    const qualifyingEarnings = employmentSources.reduce((sum, s) => {
      const pay = Math.max(0, s.grossAmount + (s.bonus ?? 0) - sourceSalarySacrifice(s))
      return sum + Math.max(0, Math.min(pay, rules.qualifyingEarningsUpper) - rules.qualifyingEarningsLower)
    }, 0)
    employerPension = qualifyingEarnings * ((settings.employerPensionContributionValue ?? 0) / 100)
  } else {
    employerPension = settings.employerPensionContributionValue ?? 0
  }
  // Per-source employer pension contributions from income tab
  const perSourceEmployerPension = employmentSources.reduce((sum, s) => {
    if (!s.employerPensionAmount) return sum
    if (s.employerPensionAmountType === 'percentage') {
      return sum + s.grossAmount * (s.employerPensionAmount / 100)
    }
    return sum + s.employerPensionAmount
  }, 0)
  employerPension += perSourceEmployerPension
  // AA funding counts the GROSS SIPP contribution (net + provider-claimed relief)
  const totalPensionFunding = pensionDeduction + sippGross + employerPension + salarySacrificePension
  // Threshold income: total income after net-pay deductions, minus gross RAS (SIPP),
  // plus salary-sacrifice pension amounts (post-July-2015 anti-avoidance add-back)
  const totalIncomeAfterNetPay = nonSavingsAfterDeductions + savingsAfterDeductions + dividendGross
  const thresholdIncomeForAA = Math.max(0, totalIncomeAfterNetPay - sippGross + salarySacrificePension)
  // Adjusted income: total income plus all pension contributions that received relief
  const adjustedIncomeForAA = totalIncomeAfterNetPay + pensionDeduction + employerPension + salarySacrificePension
  // MPAA: if flexibly accessed DC pension, AA drops to MPAA (£10,000)
  const baseAnnualAllowance = (settings.hasMPAA ?? false)
    ? rules.mpaa
    : rules.pensionAnnualAllowance
  let effectiveAnnualAllowance = baseAnnualAllowance
  if (
    !(settings.hasMPAA ?? false) &&   // no taper if MPAA applies (already at minimum)
    thresholdIncomeForAA > rules.pensionTaperThresholdIncome &&
    adjustedIncomeForAA > rules.pensionTaperAdjustedIncome
  ) {
    const taper = Math.floor((adjustedIncomeForAA - rules.pensionTaperAdjustedIncome) / 2)
    effectiveAnnualAllowance = Math.max(rules.pensionAnnualAllowanceMinimum, baseAnnualAllowance - taper)
  }
  const carryForward = settings.pensionCarryForward ?? { threeYearsAgo: 0, twoYearsAgo: 0, oneYearAgo: 0 }
  const totalCarryForward = (carryForward.threeYearsAgo ?? 0) + (carryForward.twoYearsAgo ?? 0) + (carryForward.oneYearAgo ?? 0)
  // Carry-forward can only be used once the current year's AA is fully used
  const carryForwardUsable = Math.max(0, totalPensionFunding - effectiveAnnualAllowance)
  const carryForwardApplied = Math.min(carryForwardUsable, totalCarryForward)
  const totalAnnualAllowanceAvailable = effectiveAnnualAllowance + carryForwardApplied
  const annualAllowanceExcess = Math.max(0, totalPensionFunding - totalAnnualAllowanceAvailable)
  const annualAllowanceRemaining = Math.max(0, effectiveAnnualAllowance - totalPensionFunding)

  // --- Annual Allowance Tax Charge ---
  // The excess is taxed at marginal income tax rate(s), sitting on top of all other taxable income
  const annualAllowanceCharge = annualAllowanceExcess > 0
    ? applyBands(adjustedBands, annualAllowanceExcess, taxableNonDividendIncome + taxableSavings + dividendAfterAllowance + dividendAllowanceUsed)
    : 0
  // Allow user to exclude AA charge from tax total (e.g. if using Scheme Pays)
  const annualAllowanceChargeApplied = (settings.includeAnnualAllowanceCharge ?? true)
    ? annualAllowanceCharge : 0

  // --- Self-Assessment Tax Estimate (for Payments on Account) ---
  // Approximation: total tax minus employee Class 1 NI (deducted via PAYE)
  const selfAssessmentTaxEstimate = Math.max(0, incomeTaxAfterRelief + dividendTax - mortgageTaxCredit + studentLoan + postgradLoanRepayment + capitalGainsTax + class4NI + hicbc - marriageAllowanceCredit + annualAllowanceChargeApplied)
  // POA "relevant amount": as above but excluding CGT and student loans, which are
  // settled via the balancing payment only
  const poaRelevantTax = Math.max(0, incomeTaxAfterRelief + dividendTax - mortgageTaxCredit + class4NI + hicbc - marriageAllowanceCredit + annualAllowanceChargeApplied)

  // --- Totals ---
  // Child Benefit received is included in grossIncome (it's actual money in);
  // HICBC is included in totalTax so netIncome reflects the true financial position.
  const grossIncome = employmentGross + selfEmploymentGross + rentalGross + dividendGross + bondIncome + savingsGross + pensionIncomeGross + childBenefitAnnual
  const totalTax = Math.max(
    0,
    incomeTaxAfterRelief + nationalInsurance + dividendTax - mortgageTaxCredit
    + studentLoan + postgradLoanRepayment + capitalGainsTax - marriageAllowanceCredit + hicbc
    + annualAllowanceChargeApplied,
  )
  // Mortgage interest is real cash out for a landlord (it only enters the tax
  // calc as a 20% credit), so net income subtracts it like other expenses
  const netIncome = grossIncome - selfEmploymentAllowableExpenses - rentalAllowableExpenses - mortgageInterestTotal - totalDeductions - totalSalarySacrifice - totalTax
  const effectiveTaxRate = grossIncome > 0 ? totalTax / grossIncome : 0

  const _result: TaxSummary = {
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
    marriageAllowanceTransferApplied,
    capitalGainsTax,
    taxableGain,
    totalGains,
    totalTax,
    netIncome,
    effectiveTaxRate,
    employmentGross,
    bonusTotal,
    selfEmploymentGross,
    selfEmploymentAllowableExpenses,
    rentalGross,
    rentalAllowableExpenses,
    rentalNetBeforeMortgage,
    rentalMortgageInterest: mortgageInterestTotal,
    dividendGross,
    class1NI,
    class1NILowerBandTax,
    class1NIUpperBandTax,
    class2NI,
    class4NI,
    salarySacrificeTotal: totalSalarySacrifice,
    salarySacrificePension,
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
    annualAllowanceCharge,
    annualAllowanceRemaining,
    carryForwardLossesApplied,
    selfAssessmentTaxEstimate,
    poaRelevantTax,
    badrGains,
    badrTax,
    bondIncome,
    bondTopSlicingRelief,
    bondBasicRateCredit,
    savingsIncome: savingsGross,
    pensionIncomeGross,
    savingsTax,
    savingsAllowanceApplied,
    startingSavingsRateApplied,
    nonSavingsIncomeAfterDeductions: nonSavingsAfterDeductions,
    sippGrossContribution: sippGross,
  }

  // Store in cache (clear if full)
  if (_taxCache.size >= _TAX_CACHE_MAX) {
    // Evict oldest 25% of entries (Map preserves insertion order)
    const evictCount = _TAX_CACHE_MAX >> 2
    const iter = _taxCache.keys()
    for (let i = 0; i < evictCount; i++) {
      const { value, done } = iter.next()
      if (done) break
      _taxCache.delete(value as string)
    }
  }
  _taxCache.set(_cacheKey, _result)
  return _result
}
