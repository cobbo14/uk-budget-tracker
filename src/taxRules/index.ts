import type { TaxRules } from './types'
import rules2526 from './2025-26'
import rules2627 from './2026-27'

export const TAX_RULES: Record<string, TaxRules> = {
  '2025-26': rules2526,
  '2026-27': rules2627,
}

/** Tax year containing `today` (years run 6 April – 5 April), e.g. '2026-27'. */
export function getCurrentTaxYear(today: Date = new Date()): string {
  const startYear = today.getMonth() > 3 || (today.getMonth() === 3 && today.getDate() >= 6)
    ? today.getFullYear()
    : today.getFullYear() - 1
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`
}

// Default to the current tax year when we have rules for it, otherwise the
// latest year available (TAX_RULES insertion order is chronological).
const AVAILABLE_YEARS = Object.keys(TAX_RULES)
export const DEFAULT_TAX_YEAR = TAX_RULES[getCurrentTaxYear()]
  ? getCurrentTaxYear()
  : AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1]

export function getTaxRules(year: string): TaxRules {
  // Retired years (e.g. 2024-25) fall back to the default — saved settings
  // are migrated in mergeWithDefaults, so this is a last-resort safety net
  return TAX_RULES[year] ?? TAX_RULES[DEFAULT_TAX_YEAR]
}

export function getAvailableTaxYears(): string[] {
  return Object.keys(TAX_RULES)
}

/** Total income at which higher-rate tax begins (PA + basic-rate width).
 *  Scottish taxpayers hit their Higher band earlier than the rUK threshold. */
export function getHigherRateThreshold(rules: TaxRules, scottishTaxpayer: boolean): number {
  const bands = scottishTaxpayer ? rules.scottishIncomeTaxBands : rules.incomeTaxBands
  const higherBand = bands.find(b => b.rate >= 0.40)
  return rules.personalAllowance + (higherBand ? higherBand.from : rules.incomeTaxBands[0].to)
}

export type { TaxRules, TaxBand } from './types'
