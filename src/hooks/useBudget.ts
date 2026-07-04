import { useMemo, useCallback } from 'react'
import { useAppContext } from '@/store/AppContext'
import {
  selectIncomeSources, selectGainSources, selectExpenses,
  groupExpensesByCategory, sumAnnualExpenses,
} from '@/store/selectors'
import { calculateTax } from '@/utils/taxCalculations'
import { getTaxRules } from '@/taxRules'

export function useBudget() {
  const { state, dispatch, savedAt, saveError, canUndo, undo } = useAppContext()

  const incomeSources = selectIncomeSources(state)
  const gainSources = selectGainSources(state)
  const expenses = selectExpenses(state)

  const rules = useMemo(
    () => getTaxRules(state.settings.taxYear),
    [state.settings.taxYear],
  )

  const taxSummary = useMemo(
    () => calculateTax(incomeSources, state.settings, rules, gainSources),
    [incomeSources, gainSources, state.settings, rules],
  )

  const expensesByCategory = useMemo(() => groupExpensesByCategory(expenses), [expenses])
  const totalAnnualExpenses = useMemo(() => sumAnnualExpenses(expenses), [expenses])
  const leftoverIncome = taxSummary.netIncome - totalAnnualExpenses

  const getIncomeById = useCallback((id: string) => incomeSources.find(s => s.id === id), [incomeSources])
  const getGainById = useCallback((id: string) => gainSources.find(g => g.id === id), [gainSources])
  const getExpenseById = useCallback((id: string) => expenses.find(e => e.id === id), [expenses])

  return {
    state,
    dispatch,
    savedAt,
    saveError,
    canUndo,
    undo,
    // Data
    incomeSources,
    gainSources,
    expenses,
    expensesByCategory,
    customExpenseCategories: state.customExpenseCategories,
    settings: state.settings,
    ui: state.ui,
    // Computed
    taxSummary,
    totalAnnualExpenses,
    leftoverIncome,
    rules,
    // Selectors
    getIncomeById,
    getGainById,
    getExpenseById,
  }
}
