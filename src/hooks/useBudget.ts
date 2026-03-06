import { useMemo } from 'react'
import { useAppContext } from '@/store/AppContext'
import {
  selectIncomeSources, selectGainSources, selectGainById,
  selectExpenses, selectExpensesByCategory,
  selectTotalAnnualExpenses, selectIncomeById, selectExpenseById,
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

  const expensesByCategory = useMemo(
    () => selectExpensesByCategory(state),
    [state],
  )
  const totalAnnualExpenses = selectTotalAnnualExpenses(state)
  const leftoverIncome = taxSummary.netIncome - totalAnnualExpenses

  const getIncomeById = (id: string) => selectIncomeById(state, id)
  const getGainById = (id: string) => selectGainById(state, id)
  const getExpenseById = (id: string) => selectExpenseById(state, id)

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
