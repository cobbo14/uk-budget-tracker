import type { IncomeSource, GainSource, AppSettings, TaxSummary } from '@/types'
import type { TaxRules } from '@/taxRules/types'
import { calculateTax } from '@/utils/taxCalculations'

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
): ThresholdAlert[] {
  // Use adjustedNetIncome directly from TaxSummary (avoids previous reconstruction bug)
  const comparatorIncome = t.adjustedNetIncome + t.dividendGross

  const thresholds: Array<{ name: string; description: string; threshold: number; hicbcNote?: boolean }> = [
    {
      name: 'Higher Rate Tax',
      description: 'Income tax jumps from 20% to 40% and NI falls from 8% to 2% above this point.',
      threshold: rules.niUpperEarningsLimit,
    },
    {
      name: 'Personal Allowance Taper',
      description: 'Above £100,000 your personal allowance reduces by £1 for every £2 earned, creating a 60% effective marginal rate.',
      threshold: rules.personalAllowanceTaperThreshold,
    },
    {
      name: 'Personal Allowance Gone',
      description: 'Above this point your personal allowance is fully withdrawn. The 60% effective rate zone ends and you pay 45% on all additional income.',
      threshold: rules.personalAllowanceTaperThreshold + rules.personalAllowance,
    },
  ]

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

export interface PensionScenario {
  label: string
  contributionFlat: number
  taxSummary: TaxSummary
  taxSaved: number
  netCost: number
  crossesThreshold?: string
}

export function getPensionScenarios(
  incomeSources: IncomeSource[],
  settings: AppSettings,
  rules: TaxRules,
  gainSources: GainSource[] = [],
): PensionScenario[] {
  const baseSummary = calculateTax(incomeSources, settings, rules, gainSources)
  const comparatorIncome = baseSummary.adjustedNetIncome + baseSummary.dividendGross

  const thresholds = [
    { amount: rules.niUpperEarningsLimit, name: 'Higher Rate' },
    { amount: rules.personalAllowanceTaperThreshold, name: 'Taper Start' },
    { amount: rules.personalAllowanceTaperThreshold + rules.personalAllowance, name: 'Taper End' },
  ]

  // Current flat pension contribution
  let currentContributionFlat = 0
  if (settings.pensionContributionType === 'flat') {
    currentContributionFlat = settings.pensionContributionValue
  } else if (settings.pensionContributionType === 'percentage') {
    const pensionEligibleIncome =
      baseSummary.employmentGross +
      Math.max(0, baseSummary.selfEmploymentGross - baseSummary.selfEmploymentAllowableExpenses)
    currentContributionFlat = pensionEligibleIncome * (settings.pensionContributionValue / 100)
  }

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
  const comparatorIncome = baseSummary.adjustedNetIncome + baseSummary.dividendGross
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
