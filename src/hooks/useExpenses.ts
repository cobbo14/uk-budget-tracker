import { useAppContext } from '@/store/AppContext'
import {
  selectExpenses, selectExpensesByCategory,
  selectTotalAnnualExpenses, selectExpenseById,
} from '@/store/selectors'

export function useExpenses() {
  const { state, dispatch } = useAppContext()
  const expenses = selectExpenses(state)
  const expensesByCategory = selectExpensesByCategory(state)
  const totalAnnualExpenses = selectTotalAnnualExpenses(state)
  const getExpenseById = (id: string) => selectExpenseById(state, id)

  return { expenses, expensesByCategory, totalAnnualExpenses, getExpenseById, dispatch }
}
