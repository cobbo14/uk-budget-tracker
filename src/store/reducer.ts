import type { AppState } from '@/types'
import type { AppAction } from './actions'
import {
  ADD_INCOME, UPDATE_INCOME, DELETE_INCOME,
  ADD_GAIN, UPDATE_GAIN, DELETE_GAIN,
  ADD_EXPENSE, UPDATE_EXPENSE, DELETE_EXPENSE,
  UPDATE_SETTINGS,
  ADD_CUSTOM_CATEGORY, DELETE_CUSTOM_CATEGORY,
  OPEN_ADD_INCOME_DIALOG, OPEN_EDIT_INCOME_DIALOG, CLOSE_INCOME_DIALOG,
  OPEN_ADD_EXPENSE_DIALOG, OPEN_EDIT_EXPENSE_DIALOG, CLOSE_EXPENSE_DIALOG,
  OPEN_ADD_GAIN_DIALOG, OPEN_EDIT_GAIN_DIALOG, CLOSE_GAIN_DIALOG,
  HYDRATE,
} from './actions'
import { DEFAULT_STATE } from '@/services/localStorage'

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...action.payload, ui: state.ui }

    // --- Income ---
    case ADD_INCOME:
      return { ...state, incomeSources: [...state.incomeSources, action.payload] }

    case UPDATE_INCOME:
      return {
        ...state,
        incomeSources: state.incomeSources.map(s =>
          s.id === action.payload.id ? action.payload : s,
        ),
      }

    case DELETE_INCOME:
      return {
        ...state,
        incomeSources: state.incomeSources.filter(s => s.id !== action.payload),
      }

    // --- Capital Gains ---
    case ADD_GAIN:
      return { ...state, gainSources: [...state.gainSources, action.payload] }

    case UPDATE_GAIN:
      return {
        ...state,
        gainSources: state.gainSources.map(g =>
          g.id === action.payload.id ? action.payload : g,
        ),
      }

    case DELETE_GAIN:
      return {
        ...state,
        gainSources: state.gainSources.filter(g => g.id !== action.payload),
      }

    // --- Expenses ---
    case ADD_EXPENSE:
      return { ...state, expenses: [...state.expenses, action.payload] }

    case UPDATE_EXPENSE:
      return {
        ...state,
        expenses: state.expenses.map(e =>
          e.id === action.payload.id ? action.payload : e,
        ),
      }

    case DELETE_EXPENSE:
      return {
        ...state,
        expenses: state.expenses.filter(e => e.id !== action.payload),
      }

    // --- Settings ---
    case UPDATE_SETTINGS:
      return { ...state, settings: { ...state.settings, ...action.payload } }

    // --- Custom Categories ---
    case ADD_CUSTOM_CATEGORY:
      return { ...state, customExpenseCategories: [...state.customExpenseCategories, action.payload] }

    case DELETE_CUSTOM_CATEGORY:
      return { ...state, customExpenseCategories: state.customExpenseCategories.filter(c => c.id !== action.payload) }

    // --- Income Dialog ---
    case OPEN_ADD_INCOME_DIALOG:
      return { ...state, ui: { ...state.ui, incomeDialogMode: 'add', editingIncomeId: null } }

    case OPEN_EDIT_INCOME_DIALOG:
      return { ...state, ui: { ...state.ui, incomeDialogMode: 'edit', editingIncomeId: action.payload } }

    case CLOSE_INCOME_DIALOG:
      return { ...state, ui: { ...state.ui, incomeDialogMode: 'none', editingIncomeId: null } }

    // --- Expense Dialog ---
    case OPEN_ADD_EXPENSE_DIALOG:
      return { ...state, ui: { ...state.ui, expenseDialogMode: 'add', editingExpenseId: null } }

    case OPEN_EDIT_EXPENSE_DIALOG:
      return { ...state, ui: { ...state.ui, expenseDialogMode: 'edit', editingExpenseId: action.payload } }

    case CLOSE_EXPENSE_DIALOG:
      return { ...state, ui: { ...state.ui, expenseDialogMode: 'none', editingExpenseId: null } }

    // --- Gain Dialog ---
    case OPEN_ADD_GAIN_DIALOG:
      return { ...state, ui: { ...state.ui, gainDialogMode: 'add', editingGainId: null } }

    case OPEN_EDIT_GAIN_DIALOG:
      return { ...state, ui: { ...state.ui, gainDialogMode: 'edit', editingGainId: action.payload } }

    case CLOSE_GAIN_DIALOG:
      return { ...state, ui: { ...state.ui, gainDialogMode: 'none', editingGainId: null } }

    default:
      return state
  }
}

export { DEFAULT_STATE }
