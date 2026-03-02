import type { IncomeSource, GainSource, Expense, AppSettings, CustomExpenseCategory } from '@/types'

export const ADD_INCOME = 'ADD_INCOME'
export const UPDATE_INCOME = 'UPDATE_INCOME'
export const DELETE_INCOME = 'DELETE_INCOME'

export const ADD_GAIN = 'ADD_GAIN'
export const UPDATE_GAIN = 'UPDATE_GAIN'
export const DELETE_GAIN = 'DELETE_GAIN'

export const ADD_EXPENSE = 'ADD_EXPENSE'
export const UPDATE_EXPENSE = 'UPDATE_EXPENSE'
export const DELETE_EXPENSE = 'DELETE_EXPENSE'

export const UPDATE_SETTINGS = 'UPDATE_SETTINGS'

export const ADD_CUSTOM_CATEGORY = 'ADD_CUSTOM_CATEGORY'
export const DELETE_CUSTOM_CATEGORY = 'DELETE_CUSTOM_CATEGORY'

export const OPEN_ADD_INCOME_DIALOG = 'OPEN_ADD_INCOME_DIALOG'
export const OPEN_EDIT_INCOME_DIALOG = 'OPEN_EDIT_INCOME_DIALOG'
export const CLOSE_INCOME_DIALOG = 'CLOSE_INCOME_DIALOG'

export const OPEN_ADD_EXPENSE_DIALOG = 'OPEN_ADD_EXPENSE_DIALOG'
export const OPEN_EDIT_EXPENSE_DIALOG = 'OPEN_EDIT_EXPENSE_DIALOG'
export const CLOSE_EXPENSE_DIALOG = 'CLOSE_EXPENSE_DIALOG'

export const OPEN_ADD_GAIN_DIALOG = 'OPEN_ADD_GAIN_DIALOG'
export const OPEN_EDIT_GAIN_DIALOG = 'OPEN_EDIT_GAIN_DIALOG'
export const CLOSE_GAIN_DIALOG = 'CLOSE_GAIN_DIALOG'

export const HYDRATE = 'HYDRATE'

export type AppAction =
  | { type: typeof ADD_INCOME; payload: IncomeSource }
  | { type: typeof UPDATE_INCOME; payload: IncomeSource }
  | { type: typeof DELETE_INCOME; payload: string }
  | { type: typeof ADD_GAIN; payload: GainSource }
  | { type: typeof UPDATE_GAIN; payload: GainSource }
  | { type: typeof DELETE_GAIN; payload: string }
  | { type: typeof ADD_EXPENSE; payload: Expense }
  | { type: typeof UPDATE_EXPENSE; payload: Expense }
  | { type: typeof DELETE_EXPENSE; payload: string }
  | { type: typeof UPDATE_SETTINGS; payload: Partial<AppSettings> }
  | { type: typeof ADD_CUSTOM_CATEGORY; payload: CustomExpenseCategory }
  | { type: typeof DELETE_CUSTOM_CATEGORY; payload: string }
  | { type: typeof OPEN_ADD_INCOME_DIALOG }
  | { type: typeof OPEN_EDIT_INCOME_DIALOG; payload: string }
  | { type: typeof CLOSE_INCOME_DIALOG }
  | { type: typeof OPEN_ADD_EXPENSE_DIALOG }
  | { type: typeof OPEN_EDIT_EXPENSE_DIALOG; payload: string }
  | { type: typeof CLOSE_EXPENSE_DIALOG }
  | { type: typeof OPEN_ADD_GAIN_DIALOG }
  | { type: typeof OPEN_EDIT_GAIN_DIALOG; payload: string }
  | { type: typeof CLOSE_GAIN_DIALOG }
  | { type: typeof HYDRATE; payload: Partial<import('@/types').AppState> }
