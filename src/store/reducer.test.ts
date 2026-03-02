import { describe, it, expect } from 'vitest'
import { reducer } from './reducer'
import { DEFAULT_STATE } from '@/services/localStorage'
import type { AppState } from '@/types'
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

const baseState: AppState = DEFAULT_STATE

// ─── Income actions ──────────────────────────────────────────────────────────

describe('reducer — income', () => {
  const source = { id: 'i1', name: 'Salary', type: 'employment' as const, grossAmount: 50000 }

  it('ADD_INCOME appends to incomeSources', () => {
    const state = reducer(baseState, { type: ADD_INCOME, payload: source })
    expect(state.incomeSources).toHaveLength(1)
    expect(state.incomeSources[0]).toEqual(source)
  })

  it('UPDATE_INCOME replaces matching income source', () => {
    const stateWith = reducer(baseState, { type: ADD_INCOME, payload: source })
    const updated = { ...source, grossAmount: 60000 }
    const state = reducer(stateWith, { type: UPDATE_INCOME, payload: updated })
    expect(state.incomeSources[0].grossAmount).toBe(60000)
  })

  it('UPDATE_INCOME with unknown id makes no change', () => {
    const stateWith = reducer(baseState, { type: ADD_INCOME, payload: source })
    const state = reducer(stateWith, { type: UPDATE_INCOME, payload: { ...source, id: 'unknown' } })
    expect(state.incomeSources).toHaveLength(1)
    expect(state.incomeSources[0].id).toBe('i1')
  })

  it('DELETE_INCOME removes the income source', () => {
    const stateWith = reducer(baseState, { type: ADD_INCOME, payload: source })
    const state = reducer(stateWith, { type: DELETE_INCOME, payload: 'i1' })
    expect(state.incomeSources).toHaveLength(0)
  })
})

// ─── Gain actions ─────────────────────────────────────────────────────────────

describe('reducer — gains', () => {
  const gain = { id: 'g1', name: 'Shares', gainAmount: 10000, allowableCosts: 500, isResidentialProperty: false }

  it('ADD_GAIN appends to gainSources', () => {
    const state = reducer(baseState, { type: ADD_GAIN, payload: gain })
    expect(state.gainSources).toHaveLength(1)
  })

  it('UPDATE_GAIN replaces matching gain', () => {
    const stateWith = reducer(baseState, { type: ADD_GAIN, payload: gain })
    const updated = { ...gain, gainAmount: 20000 }
    const state = reducer(stateWith, { type: UPDATE_GAIN, payload: updated })
    expect(state.gainSources[0].gainAmount).toBe(20000)
  })

  it('UPDATE_GAIN with unknown id makes no change', () => {
    const stateWith = reducer(baseState, { type: ADD_GAIN, payload: gain })
    const state = reducer(stateWith, { type: UPDATE_GAIN, payload: { ...gain, id: 'unknown' } })
    expect(state.gainSources[0].id).toBe('g1')
  })

  it('DELETE_GAIN removes the gain', () => {
    const stateWith = reducer(baseState, { type: ADD_GAIN, payload: gain })
    const state = reducer(stateWith, { type: DELETE_GAIN, payload: 'g1' })
    expect(state.gainSources).toHaveLength(0)
  })
})

// ─── Expense actions ──────────────────────────────────────────────────────────

describe('reducer — expenses', () => {
  const expense = { id: 'e1', name: 'Rent', category: 'housing', amount: 1000, frequency: 'monthly' as const }

  it('ADD_EXPENSE appends to expenses', () => {
    const state = reducer(baseState, { type: ADD_EXPENSE, payload: expense })
    expect(state.expenses).toHaveLength(1)
  })

  it('UPDATE_EXPENSE replaces matching expense', () => {
    const stateWith = reducer(baseState, { type: ADD_EXPENSE, payload: expense })
    const updated = { ...expense, amount: 1200 }
    const state = reducer(stateWith, { type: UPDATE_EXPENSE, payload: updated })
    expect(state.expenses[0].amount).toBe(1200)
  })

  it('DELETE_EXPENSE removes the expense', () => {
    const stateWith = reducer(baseState, { type: ADD_EXPENSE, payload: expense })
    const state = reducer(stateWith, { type: DELETE_EXPENSE, payload: 'e1' })
    expect(state.expenses).toHaveLength(0)
  })
})

// ─── Settings ─────────────────────────────────────────────────────────────────

describe('reducer — UPDATE_SETTINGS', () => {
  it('merges partial settings without overwriting other fields', () => {
    const state = reducer(baseState, {
      type: UPDATE_SETTINGS,
      payload: { scottishTaxpayer: true },
    })
    expect(state.settings.scottishTaxpayer).toBe(true)
    expect(state.settings.taxYear).toBe(baseState.settings.taxYear)
  })

  it('sets new settings fields (partnerIncome)', () => {
    const state = reducer(baseState, {
      type: UPDATE_SETTINGS,
      payload: { partnerIncome: 30000 },
    })
    expect(state.settings.partnerIncome).toBe(30000)
  })
})

// ─── Custom categories ────────────────────────────────────────────────────────

describe('reducer — custom categories', () => {
  const cat = { id: 'cat1', label: 'Hobbies' }

  it('ADD_CUSTOM_CATEGORY appends category', () => {
    const state = reducer(baseState, { type: ADD_CUSTOM_CATEGORY, payload: cat })
    expect(state.customExpenseCategories).toHaveLength(1)
    expect(state.customExpenseCategories[0].label).toBe('Hobbies')
  })

  it('DELETE_CUSTOM_CATEGORY removes category', () => {
    const stateWith = reducer(baseState, { type: ADD_CUSTOM_CATEGORY, payload: cat })
    const state = reducer(stateWith, { type: DELETE_CUSTOM_CATEGORY, payload: 'cat1' })
    expect(state.customExpenseCategories).toHaveLength(0)
  })
})

// ─── Dialog actions ───────────────────────────────────────────────────────────

describe('reducer — income dialog', () => {
  it('OPEN_ADD_INCOME_DIALOG sets add mode', () => {
    const state = reducer(baseState, { type: OPEN_ADD_INCOME_DIALOG })
    expect(state.ui.incomeDialogMode).toBe('add')
    expect(state.ui.editingIncomeId).toBeNull()
  })

  it('OPEN_EDIT_INCOME_DIALOG sets edit mode with id', () => {
    const state = reducer(baseState, { type: OPEN_EDIT_INCOME_DIALOG, payload: 'i1' })
    expect(state.ui.incomeDialogMode).toBe('edit')
    expect(state.ui.editingIncomeId).toBe('i1')
  })

  it('CLOSE_INCOME_DIALOG resets income dialog', () => {
    const openState = reducer(baseState, { type: OPEN_ADD_INCOME_DIALOG })
    const state = reducer(openState, { type: CLOSE_INCOME_DIALOG })
    expect(state.ui.incomeDialogMode).toBe('none')
    expect(state.ui.editingIncomeId).toBeNull()
  })
})

describe('reducer — expense dialog', () => {
  it('OPEN_ADD_EXPENSE_DIALOG sets add mode', () => {
    const state = reducer(baseState, { type: OPEN_ADD_EXPENSE_DIALOG })
    expect(state.ui.expenseDialogMode).toBe('add')
  })

  it('OPEN_EDIT_EXPENSE_DIALOG sets edit mode with id', () => {
    const state = reducer(baseState, { type: OPEN_EDIT_EXPENSE_DIALOG, payload: 'e1' })
    expect(state.ui.expenseDialogMode).toBe('edit')
    expect(state.ui.editingExpenseId).toBe('e1')
  })

  it('CLOSE_EXPENSE_DIALOG resets expense dialog', () => {
    const openState = reducer(baseState, { type: OPEN_ADD_EXPENSE_DIALOG })
    const state = reducer(openState, { type: CLOSE_EXPENSE_DIALOG })
    expect(state.ui.expenseDialogMode).toBe('none')
  })
})

describe('reducer — gain dialog', () => {
  it('OPEN_ADD_GAIN_DIALOG sets add mode', () => {
    const state = reducer(baseState, { type: OPEN_ADD_GAIN_DIALOG })
    expect(state.ui.gainDialogMode).toBe('add')
  })

  it('OPEN_EDIT_GAIN_DIALOG sets edit mode with id', () => {
    const state = reducer(baseState, { type: OPEN_EDIT_GAIN_DIALOG, payload: 'g1' })
    expect(state.ui.gainDialogMode).toBe('edit')
    expect(state.ui.editingGainId).toBe('g1')
  })

  it('CLOSE_GAIN_DIALOG resets gain dialog', () => {
    const openState = reducer(baseState, { type: OPEN_ADD_GAIN_DIALOG })
    const state = reducer(openState, { type: CLOSE_GAIN_DIALOG })
    expect(state.ui.gainDialogMode).toBe('none')
  })
})

// ─── HYDRATE ──────────────────────────────────────────────────────────────────

describe('reducer — HYDRATE', () => {
  it('merges payload into state', () => {
    const source = { id: 'i1', name: 'Salary', type: 'employment' as const, grossAmount: 40000 }
    const state = reducer(baseState, {
      type: HYDRATE,
      payload: { incomeSources: [source] },
    })
    expect(state.incomeSources).toHaveLength(1)
    expect(state.incomeSources[0].grossAmount).toBe(40000)
  })

  it('preserves ui state when HYDRATE payload has no ui', () => {
    const openState = reducer(baseState, { type: OPEN_ADD_INCOME_DIALOG })
    const state = reducer(openState, {
      type: HYDRATE,
      payload: { incomeSources: [] },
    })
    expect(state.ui.incomeDialogMode).toBe('add')
  })

  it('with empty payload makes no data change', () => {
    const state = reducer(baseState, { type: HYDRATE, payload: {} })
    expect(state.incomeSources).toEqual(baseState.incomeSources)
    expect(state.gainSources).toEqual(baseState.gainSources)
  })
})
