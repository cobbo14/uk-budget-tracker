import { describe, it, expect } from 'vitest'
import { generateCSV } from './exportUtils'
import { calculateTax } from './taxCalculations'
import { DEFAULT_STATE } from '@/services/localStorage'
import { getTaxRules } from '@/taxRules'
import type { AppState } from '@/types'

function stateWith(partial: Partial<AppState>): AppState {
  return { ...DEFAULT_STATE, ...partial }
}

describe('generateCSV', () => {
  const rules = getTaxRules('2025-26')

  it('escapes cells that spreadsheets would evaluate as formulas', () => {
    const state = stateWith({
      expenses: [
        { id: '1', name: '=SUM(A1:A9)', category: 'other', amount: 10, frequency: 'monthly' },
        { id: '2', name: '@import', category: 'other', amount: 5, frequency: 'monthly' },
      ],
    })
    const summary = calculateTax([], state.settings, rules)
    const csv = generateCSV(state, summary, rules)
    expect(csv).toContain("'=SUM(A1:A9)")
    expect(csv).toContain("'@import")
    expect(csv).not.toContain('\n=SUM')
  })

  it('does not mangle negative numeric amounts', () => {
    const state = stateWith({
      gainSources: [
        { id: 'g1', name: 'Loss maker', gainAmount: 100, allowableCosts: 600, isResidentialProperty: false },
      ],
    })
    const summary = calculateTax([], state.settings, rules, state.gainSources)
    const csv = generateCSV(state, summary, rules)
    expect(csv).toContain('-500.00')
    expect(csv).not.toContain("'-500.00")
  })
})
