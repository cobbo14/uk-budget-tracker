import type { TaxRules } from './types'
import rules2425 from './2024-25'
import rules2526 from './2025-26'
import rules2627 from './2026-27'

export const TAX_RULES: Record<string, TaxRules> = {
  '2024-25': rules2425,
  '2025-26': rules2526,
  '2026-27': rules2627,
}

export const DEFAULT_TAX_YEAR = '2025-26'

export function getTaxRules(year: string): TaxRules {
  return TAX_RULES[year] ?? rules2526
}

export function getAvailableTaxYears(): string[] {
  return Object.keys(TAX_RULES)
}

export type { TaxRules, TaxBand } from './types'
