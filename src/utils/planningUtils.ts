import type { IncomeSource, GainSource, AppSettings, TaxSummary, SalarySacrificeItem } from '@/types'
import type { TaxRules } from '@/taxRules/types'
import { calculateTax, resolveSalarySacrificeItem, resolveCarryForward } from '@/utils/taxCalculations'
import { getHigherRateThreshold } from '@/taxRules'
import { generateId } from '@/utils/ids'

export interface ThresholdAlert {
  name: string
  description: string
  threshold: number
  currentIncome: number
  /** positive = headroom remaining, negative = amount over */
  gap: number
  /** true if within £10k of threshold (either side) */
  isNear: boolean
  /** true if currently over the threshold */
  isOver: boolean
  /** pension contribution needed to get just below (0 if already below) */
  pensionToReach: number
}

export function getThresholdAlerts(
  t: TaxSummary,
  rules: TaxRules,
  settings?: AppSettings,
): ThresholdAlert[] {
  // adjustedNetIncome now follows the HMRC definition: all income less gross
  // relief-at-source pension and grossed-up Gift Aid (dividends/savings included)
  const comparatorIncome = t.adjustedNetIncome

  const taperStart = rules.personalAllowanceTaperThreshold
  const taperEnd = taperStart + rules.personalAllowance * 2

  const thresholds: Array<{ name: string; description: string; threshold: number; hicbcNote?: boolean }> = []

  // Only show Personal Allowance taper thresholds if income is in the taper zone (£100k–£140k)
  if (comparatorIncome >= taperStart && comparatorIncome <= taperEnd) {
    thresholds.push(
      {
        name: 'Personal Allowance Taper',
        description: 'Above £100,000 your personal allowance reduces by £1 for every £2 earned, creating a 60% effective marginal rate.',
        threshold: taperStart,
      },
      {
        name: 'Personal Allowance Gone',
        description: 'Above this point your personal allowance is fully withdrawn. The 60% effective rate zone ends and you pay 45% on all additional income.',
        threshold: taperStart + rules.personalAllowance,
      },
    )
  }

  // Childcare cliff edge: Tax-Free Childcare and 30 free hours are lost entirely
  // (not tapered) once adjusted net income exceeds £100,000
  if ((settings?.numberOfChildren ?? 0) > 0) {
    thresholds.push({
      name: 'Childcare Support — £100k Cliff Edge',
      description: 'Tax-Free Childcare (up to £2,000 per child per year) and 30 free hours are lost entirely if adjusted net income exceeds £100,000 — a cliff edge, not a taper. A pension contribution can restore eligibility.',
      threshold: taperStart,
    })
  }

  // Only show HICBC threshold if the user is claiming Child Benefit
  if (t.childBenefitAnnual > 0) {
    thresholds.unshift({
      name: 'HICBC — Child Benefit Taper',
      description: `The High Income Child Benefit Charge begins here. Your Child Benefit of ${Math.round(t.childBenefitAnnual).toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })} is clawed back at 1% per £200 until fully recovered at £${rules.hicbcTaperEnd.toLocaleString()}.`,
      threshold: rules.hicbcThreshold,
      hicbcNote: true,
    })
  }

  const alerts = thresholds.map(({ name, description, threshold }) => {
    const gap = threshold - comparatorIncome
    const isOver = gap < 0
    const isNear = Math.abs(gap) <= 10000

    const pensionToReach = isOver ? Math.ceil(Math.abs(gap)) : 0

    return {
      name,
      description,
      threshold,
      currentIncome: comparatorIncome,
      gap,
      isNear,
      isOver,
      pensionToReach,
    }
  })

  // Pension Annual Allowance threshold (contributions vs allowance, not income-based)
  if (t.totalPensionFunding > 0) {
    const aaThreshold = t.totalAnnualAllowanceAvailable
    const aaGap = aaThreshold - t.totalPensionFunding
    const aaOver = aaGap < 0
    const aaNear = Math.abs(aaGap) <= 10000
    if (aaGap <= 20000) {
      alerts.push({
        name: 'Pension Annual Allowance',
        description: 'Pension contributions above the Annual Allowance incur a tax charge at your marginal income tax rate.',
        threshold: aaThreshold,
        currentIncome: t.totalPensionFunding,
        gap: aaGap,
        isNear: aaNear,
        isOver: aaOver,
        pensionToReach: 0,
      })
    }
  }

  return alerts
}

// ─── Pension recommendations ─────────────────────────────────────────────────

export interface PensionRecommendation {
  id: 'employer-match' | 'keep-childcare' | 'escape-60-zone' | 'keep-child-benefit'
    | 'stay-basic-rate' | 'use-annual-allowance'
  title: string
  reason: string
  /** additional gross contribution on top of current, £/yr */
  extraContribution: number
  taxSaved: number
  netCost: number
  effectiveReliefRate: number
  /** extra employer money unlocked (employer-match only) */
  employerBonus?: number
  /** carry-forward from 3 years ago that lapses at the end of this tax year */
  expiringCarryForward?: number
  /** true when acting on this would exceed the available Annual Allowance */
  aaWarning?: boolean
}

/** Ranked, named contribution targets with the tax/NI effect of hitting each.
 *  Extra contributions are modelled as flat net-pay amounts (which reduce
 *  adjusted net income £1 for £1); the method advisor handles "how to pay". */
export function getPensionRecommendations(
  incomeSources: IncomeSource[],
  settings: AppSettings,
  rules: TaxRules,
  gainSources: GainSource[] = [],
): PensionRecommendation[] {
  const baseline = calculateTax(incomeSources, settings, rules, gainSources)
  const ani = baseline.adjustedNetIncome
  const currentFlat = Math.max(0, baseline.totalDeductions - baseline.sippNetContribution)
  const pensionEligible =
    Math.max(0, baseline.employmentGross - baseline.salarySacrificeTotal) +
    Math.max(0, baseline.selfEmploymentGross - baseline.selfEmploymentAllowableExpenses) +
    (settings.transitionalProfitSpread ?? 0)
  const remainingEligible = Math.max(0, pensionEligible - currentFlat)
  const aaHeadroom = Math.max(0, baseline.totalAnnualAllowanceAvailable - baseline.totalPensionFunding)

  const recs: PensionRecommendation[] = []

  const evaluate = (extra: number) => {
    const scenario = calculateTax(
      incomeSources,
      { ...settings, pensionContributionType: 'flat', pensionContributionValue: currentFlat + extra },
      rules,
      gainSources,
    )
    return {
      scenario,
      taxSaved: Math.max(0, baseline.totalTax - scenario.totalTax),
      netCost: baseline.netIncome - scenario.netIncome,
    }
  }

  const push = (
    id: PensionRecommendation['id'],
    title: string,
    reason: string,
    extra: number,
    overrides: Partial<PensionRecommendation> = {},
  ) => {
    if (extra <= 0 || extra > remainingEligible) return
    const { scenario, taxSaved, netCost } = evaluate(extra)
    recs.push({
      id, title, reason,
      extraContribution: Math.ceil(extra),
      taxSaved,
      netCost,
      effectiveReliefRate: extra > 0 ? taxSaved / extra : 0,
      aaWarning: extra > aaHeadroom || scenario.annualAllowanceExcess > 0,
      ...overrides,
    })
  }

  // 1. Capture the full employer match — free money first
  if ((settings.employerMatchRate ?? 0) > 0 && (settings.employerMatchCapPercent ?? 0) > 0) {
    const workplaceEmployee = currentFlat + baseline.salarySacrificePension
    const capBase = baseline.employmentGross * ((settings.employerMatchCapPercent ?? 0) / 100)
    const shortfall = capBase - workplaceEmployee
    if (shortfall > 0) {
      const { scenario, taxSaved, netCost } = evaluate(shortfall)
      const bonus = scenario.employerMatchAmount - baseline.employerMatchAmount
      recs.push({
        id: 'employer-match',
        title: 'Capture your full employer match',
        reason: `Free money: your employer adds another ${Math.round(bonus).toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })}/yr when you contribute up to the match cap.`,
        extraContribution: Math.ceil(shortfall),
        taxSaved,
        netCost,
        effectiveReliefRate: shortfall > 0 ? (taxSaved + bonus) / shortfall : 0,
        employerBonus: bonus,
        aaWarning: shortfall > aaHeadroom,
      })
    }
  }

  // 2. Escape the 60% zone / keep childcare support (ANI → £100,000)
  const taperStart = rules.personalAllowanceTaperThreshold
  if (ani > taperStart) {
    const hasChildren = (settings.numberOfChildren ?? 0) > 0
    push(
      hasChildren ? 'keep-childcare' : 'escape-60-zone',
      hasChildren ? 'Keep childcare support & escape the 60% zone' : 'Escape the 60% tax zone',
      hasChildren
        ? 'Brings adjusted net income to £100,000: restores your Personal Allowance taper relief AND keeps Tax-Free Childcare (worth up to £2,000/child/yr) and 30 free hours — a cliff edge, not a taper.'
        : 'Brings adjusted net income to £100,000, ending the 60% effective marginal rate from the Personal Allowance taper.',
      ani - taperStart,
    )
  }

  // 3. Keep full Child Benefit (ANI → £60,000)
  if ((settings.childBenefitClaiming ?? false) && baseline.hicbc > 0) {
    push(
      'keep-child-benefit',
      'Keep your full Child Benefit',
      `Brings adjusted net income to £${rules.hicbcThreshold.toLocaleString()}, removing the High Income Child Benefit Charge of ${Math.round(baseline.hicbc).toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })}/yr.`,
      ani - rules.hicbcThreshold,
    )
  }

  // 4. Stay a basic-rate taxpayer (ANI → higher-rate threshold)
  const higherRateThreshold = getHigherRateThreshold(rules, settings.scottishTaxpayer)
  if (ani > higherRateThreshold && ani <= taperStart) {
    push(
      'stay-basic-rate',
      'Stay below the higher rate',
      `Brings adjusted net income to £${higherRateThreshold.toLocaleString()} so no income is taxed at the higher rate.`,
      ani - higherRateThreshold,
    )
  }

  // 5. Use the full Annual Allowance (carry-forward expires oldest-first).
  // "Expiring" = the oldest year's allowance still unused at the CURRENT
  // contribution level — that's what lapses on 5 April if nothing changes.
  if (aaHeadroom > 0 && remainingEligible > 0) {
    const expiring = baseline.carryForwardExpiringUnused
    const endYear = parseInt(settings.taxYear.split('-')[0]) + 1
    push(
      'use-annual-allowance',
      'Use your full Annual Allowance',
      expiring > 0
        ? `You have £${Math.round(aaHeadroom).toLocaleString()} of unused allowance — including £${Math.round(expiring).toLocaleString()} of carry-forward that expires on 5 April ${endYear}.`
        : `You have £${Math.round(aaHeadroom).toLocaleString()} of unused Annual Allowance this year — contributions up to that get full tax relief.`,
      Math.min(aaHeadroom, remainingEligible),
      expiring > 0 ? { expiringCarryForward: expiring } : {},
    )
  }

  return recs
}

// ─── Applying a recommendation ───────────────────────────────────────────────

/** New salarySacrificeItems for a source after adding extraGross £/yr of
 *  pension sacrifice. Keeps the single-pension-item invariant the Settings
 *  card relies on: %/qualifying items and multiple items are merged into one
 *  flat item with the identical resolved value (same tax outcome). Pass
 *  extraGross = 0 to consolidate without adding. */
export function applyExtraSacrifice(
  source: IncomeSource,
  extraGross: number,
  rules: TaxRules,
): SalarySacrificeItem[] {
  const items = source.salarySacrificeItems ?? []
  const pension = items.filter(i => i.type === 'pension')
  const others = items.filter(i => i.type !== 'pension')

  if (pension.length === 1 && (pension[0].amountType ?? 'flat') === 'flat') {
    return [...others, { ...pension[0], annualAmount: pension[0].annualAmount + extraGross }]
  }
  const existingResolved = pension.reduce(
    (a, i) => a + resolveSalarySacrificeItem(i, source, rules), 0,
  )
  const total = existingResolved + extraGross
  if (total <= 0) return others
  return [...others, {
    id: pension[0]?.id ?? generateId(),
    type: 'pension',
    name: pension[0]?.name ?? 'Salary Sacrifice Pension',
    annualAmount: Math.round(total * 100) / 100,
    amountType: 'flat',
  }]
}

// ─── Goal solver ─────────────────────────────────────────────────────────────

/** Largest flat contribution (total, £/yr) that keeps net income at or above
 *  the given annual take-home target. Returns null if even the current
 *  contribution level falls below the target. netIncome is monotonically
 *  decreasing in the contribution, so binary search is exact enough at £1. */
export function solveMaxContribution(
  minAnnualTakeHome: number,
  incomeSources: IncomeSource[],
  settings: AppSettings,
  rules: TaxRules,
  gainSources: GainSource[] = [],
): { contribution: number; summary: TaxSummary } | null {
  const baseline = calculateTax(incomeSources, settings, rules, gainSources)
  const currentFlat = Math.max(0, baseline.totalDeductions - baseline.sippNetContribution)
  const pensionEligible =
    Math.max(0, baseline.employmentGross - baseline.salarySacrificeTotal) +
    Math.max(0, baseline.selfEmploymentGross - baseline.selfEmploymentAllowableExpenses) +
    (settings.transitionalProfitSpread ?? 0)
  const at = (contribution: number) => calculateTax(
    incomeSources,
    { ...settings, pensionContributionType: 'flat', pensionContributionValue: contribution },
    rules,
    gainSources,
  )
  if (at(currentFlat).netIncome < minAnnualTakeHome) return null
  let lo = currentFlat
  let hi = pensionEligible
  if (at(hi).netIncome >= minAnnualTakeHome) {
    return { contribution: Math.floor(hi), summary: at(Math.floor(hi)) }
  }
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2)
    if (at(mid).netIncome >= minAnnualTakeHome) lo = mid
    else hi = mid
  }
  return { contribution: lo, summary: at(lo) }
}

// ─── Method advisor ──────────────────────────────────────────────────────────

export interface MethodComparison {
  method: 'salary-sacrifice' | 'net-pay' | 'sipp'
  label: string
  cashPaid: number      // what leaves your pay/bank for the extra £G gross
  taxSaved: number      // vs current position (incl. NI where applicable)
  netCost: number       // reduction in net income
  employerBonus: number // extra employer match unlocked
  note: string
}

/** Compare paying the same extra gross £G into a pension via each route. */
export function compareContributionMethods(
  extraGross: number,
  incomeSources: IncomeSource[],
  settings: AppSettings,
  rules: TaxRules,
  gainSources: GainSource[] = [],
): MethodComparison[] {
  if (extraGross <= 0) return []
  const baseline = calculateTax(incomeSources, settings, rules, gainSources)
  const currentFlat = Math.max(0, baseline.totalDeductions - baseline.sippNetContribution)
  const results: MethodComparison[] = []

  const diff = (summary: TaxSummary) => ({
    taxSaved: Math.max(0, baseline.totalTax - summary.totalTax),
    netCost: baseline.netIncome - summary.netIncome,
    employerBonus: Math.max(0, summary.employerMatchAmount - baseline.employerMatchAmount),
  })

  // Salary sacrifice: add a flat pension sacrifice to the largest employment source
  const employments = incomeSources.filter(s => s.type === 'employment')
  if (employments.length > 0) {
    const target = employments.reduce((a, b) => (b.grossAmount > a.grossAmount ? b : a))
    const sacrificedSources = incomeSources.map(s => s.id !== target.id ? s : {
      ...s,
      salarySacrificeItems: [
        ...(s.salarySacrificeItems ?? []),
        { id: '__advisor', type: 'pension' as const, name: 'Extra sacrifice', annualAmount: extraGross, amountType: 'flat' as const },
      ],
    })
    const summary = calculateTax(sacrificedSources, settings, rules, gainSources)
    results.push({
      method: 'salary-sacrifice',
      label: 'Salary sacrifice',
      cashPaid: extraGross,
      ...diff(summary),
      note: 'Saves Income Tax and NI. Needs your employer to offer a sacrifice arrangement.',
    })
  }

  // Net pay: increase the flat workplace contribution
  const netPaySummary = calculateTax(
    incomeSources,
    { ...settings, pensionContributionType: 'flat', pensionContributionValue: currentFlat + extraGross },
    rules,
    gainSources,
  )
  results.push({
    method: 'net-pay',
    label: 'Workplace (net pay)',
    cashPaid: extraGross,
    ...diff(netPaySummary),
    note: 'Full relief through payroll automatically. No NI saving.',
  })

  // SIPP (relief at source): pay 0.8×G net, provider adds 20%
  const sippSummary = calculateTax(
    incomeSources,
    {
      ...settings,
      sippContributionType: 'flat',
      sippContribution: baseline.sippNetContribution + extraGross * 0.8,
    },
    rules,
    gainSources,
  )
  results.push({
    method: 'sipp',
    label: 'SIPP (relief at source)',
    cashPaid: extraGross * 0.8,
    ...diff(sippSummary),
    note: 'Pay £' + Math.round(extraGross * 0.8).toLocaleString() + ', provider adds 20%. Higher-rate relief comes back via self-assessment. Not matched by employers.',
  })

  return results
}

export interface PensionScenario {
  label: string
  contributionFlat: number
  taxSummary: TaxSummary
  taxSaved: number
  netCost: number
  crossesThreshold?: string
  aaExcess?: number
  aaCharge?: number
}

export function getPensionScenarios(
  incomeSources: IncomeSource[],
  settings: AppSettings,
  rules: TaxRules,
  gainSources: GainSource[] = [],
): PensionScenario[] {
  const baseSummary = calculateTax(incomeSources, settings, rules, gainSources)
  const comparatorIncome = baseSummary.adjustedNetIncome

  const thresholds = [
    { amount: getHigherRateThreshold(rules, settings.scottishTaxpayer), name: 'Higher Rate' },
    { amount: rules.personalAllowanceTaperThreshold, name: 'Taper Start' },
    { amount: rules.personalAllowanceTaperThreshold + rules.personalAllowance, name: 'Taper End' },
  ]

  // Current flat pension contribution — the engine already resolved every
  // basis (flat / percentage / qualifying earnings) into totalDeductions
  const currentContributionFlat = Math.max(0, baseSummary.totalDeductions - baseSummary.sippNetContribution)

  const candidates: { amount: number; label: string; crossesThreshold?: string }[] = [
    { amount: currentContributionFlat, label: 'Current' },
  ]

  const steps = [1000, 2000, 5000, 10000]
  for (const step of steps) {
    const amt = currentContributionFlat + step
    if (amt < comparatorIncome) {
      candidates.push({ amount: amt, label: `+£${step.toLocaleString()}` })
    }
  }

  for (const { amount: thr, name } of thresholds) {
    if (comparatorIncome > thr) {
      const needed = currentContributionFlat + (comparatorIncome - thr) + 1
      if (needed > currentContributionFlat && needed < comparatorIncome) {
        candidates.push({ amount: Math.ceil(needed), label: `To below ${name}`, crossesThreshold: name })
      }
    }
  }

  // Add AA limit candidate — max employee contribution before breaching annual
  // allowance. Employer funding comes from the engine so every contribution
  // basis (flat / percentage / qualifying earnings) is resolved consistently.
  const employerPension = baseSummary.employerPensionFunding
  const carryForward = resolveCarryForward(settings)
  const totalCarryForward = carryForward.threeYearsAgo + carryForward.twoYearsAgo + carryForward.oneYearAgo
  const aaEmployeeLimit = Math.max(0, baseSummary.effectiveAnnualAllowance + totalCarryForward - employerPension)
  if (aaEmployeeLimit > currentContributionFlat && aaEmployeeLimit < comparatorIncome) {
    candidates.push({ amount: Math.ceil(aaEmployeeLimit), label: 'AA Limit', crossesThreshold: 'Annual Allowance' })
  }

  const seen = new Set<number>()
  const sorted = candidates
    .filter(c => { if (seen.has(c.amount)) return false; seen.add(c.amount); return true })
    .sort((a, b) => a.amount - b.amount)

  return sorted.map(({ amount, label, crossesThreshold }) => {
    const modifiedSettings: AppSettings = {
      ...settings,
      pensionContributionType: 'flat',
      pensionContributionValue: amount,
    }
    const scenarioSummary = calculateTax(incomeSources, modifiedSettings, rules, gainSources)
    const taxSaved = baseSummary.totalTax - scenarioSummary.totalTax
    const netCost = amount - currentContributionFlat - taxSaved

    return {
      label,
      contributionFlat: amount,
      taxSummary: scenarioSummary,
      taxSaved,
      netCost,
      crossesThreshold,
      aaExcess: scenarioSummary.annualAllowanceExcess > 0 ? scenarioSummary.annualAllowanceExcess : undefined,
      aaCharge: scenarioSummary.annualAllowanceCharge > 0 ? scenarioSummary.annualAllowanceCharge : undefined,
    }
  })
}

export interface PensionChartPoint {
  contribution: number
  takeHome: number
}

/**
 * Returns an array of {contribution, takeHome} points from 0 to the max meaningful contribution
 * at the given stepSize (default £500). Used to render the PensionOptimiser chart.
 */
export function getPensionChartPoints(
  incomeSources: IncomeSource[],
  settings: AppSettings,
  rules: TaxRules,
  gainSources: GainSource[] = [],
  stepSize = 500,
): PensionChartPoint[] {
  const baseSummary = calculateTax(incomeSources, settings, rules, gainSources)
  const comparatorIncome = baseSummary.adjustedNetIncome
  const maxContribution = Math.max(0, Math.ceil(comparatorIncome / stepSize) * stepSize)

  const points: PensionChartPoint[] = []
  for (let contrib = 0; contrib <= maxContribution; contrib += stepSize) {
    const modifiedSettings: AppSettings = {
      ...settings,
      pensionContributionType: 'flat',
      pensionContributionValue: contrib,
    }
    const summary = calculateTax(incomeSources, modifiedSettings, rules, gainSources)
    points.push({ contribution: contrib, takeHome: summary.netIncome })
  }
  return points
}

export interface WhatIfResult {
  taxSummary: TaxSummary
  leftoverIncome: number
}

export function computeWhatIf(
  incomeSources: IncomeSource[],
  settings: AppSettings,
  rules: TaxRules,
  totalAnnualExpenses: number,
  incomeAdjustment: number,
  pensionOverrideType: AppSettings['pensionContributionType'],
  pensionOverrideValue: number,
  scottishOverride: boolean,
  gainSources: GainSource[] = [],
): WhatIfResult {
  // Apply income delta proportionally across all non-dividend sources (employment + self-employment)
  const nonDividendSources = incomeSources.filter(s => s.type === 'employment' || s.type === 'self-employment')
  const totalNonDividend = nonDividendSources.reduce((sum, s) => sum + s.grossAmount, 0)

  const adjustedSources = incomeSources.map(source => {
    if (source.type !== 'employment' && source.type !== 'self-employment') return source
    if (totalNonDividend === 0) return source
    const share = source.grossAmount / totalNonDividend
    return { ...source, grossAmount: Math.max(0, source.grossAmount + incomeAdjustment * share) }
  })

  const modifiedSettings: AppSettings = {
    ...settings,
    pensionContributionType: pensionOverrideType,
    pensionContributionValue: pensionOverrideValue,
    scottishTaxpayer: scottishOverride,
  }

  const taxSummary = calculateTax(adjustedSources, modifiedSettings, rules, gainSources)
  return {
    taxSummary,
    leftoverIncome: taxSummary.netIncome - totalAnnualExpenses,
  }
}
