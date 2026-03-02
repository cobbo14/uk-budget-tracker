import type { AppState, IncomeSource, GainSource, Expense, ExpenseCategory } from '@/types'

export function selectIncomeSources(state: AppState): IncomeSource[] {
  return state.incomeSources
}

export function selectIncomeById(state: AppState, id: string): IncomeSource | undefined {
  return state.incomeSources.find(s => s.id === id)
}

export function selectGainSources(state: AppState): GainSource[] {
  return state.gainSources
}

export function selectGainById(state: AppState, id: string): GainSource | undefined {
  return state.gainSources.find(g => g.id === id)
}

export function selectExpenses(state: AppState): Expense[] {
  return state.expenses
}

export function selectExpenseById(state: AppState, id: string): Expense | undefined {
  return state.expenses.find(e => e.id === id)
}

export function selectExpensesByCategory(state: AppState): Map<ExpenseCategory, Expense[]> {
  const map = new Map<ExpenseCategory, Expense[]>()
  for (const expense of state.expenses) {
    const existing = map.get(expense.category) ?? []
    map.set(expense.category, [...existing, expense])
  }
  return map
}

/** Convert an expense amount to an annual figure */
export function toAnnual(amount: number, frequency: Expense['frequency']): number {
  switch (frequency) {
    case 'weekly': return amount * 52
    case 'monthly': return amount * 12
    case 'annual': return amount
  }
}

export function selectTotalAnnualExpenses(state: AppState): number {
  return state.expenses.reduce((sum, e) => sum + toAnnual(e.amount, e.frequency), 0)
}
