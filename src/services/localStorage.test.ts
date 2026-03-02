import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DEFAULT_STATE,
  loadProfileState,
  saveProfileState,
  parseImportedState,
} from './localStorage'

// ─── In-memory localStorage mock ─────────────────────────────────────────────

function createLocalStorageMock() {
  const store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
    get length() { return Object.keys(store).length },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  }
}

let storageMock: ReturnType<typeof createLocalStorageMock>

beforeEach(() => {
  storageMock = createLocalStorageMock()
  vi.stubGlobal('localStorage', storageMock)
})

// ─── loadProfileState ─────────────────────────────────────────────────────────

describe('loadProfileState', () => {
  it('returns DEFAULT_STATE when nothing stored', () => {
    const state = loadProfileState('default')
    expect(state.incomeSources).toEqual([])
    expect(state.gainSources).toEqual([])
    expect(state.expenses).toEqual([])
    expect(state.settings.taxYear).toBe(DEFAULT_STATE.settings.taxYear)
  })

  it('merges stored partial settings with defaults (new fields appear)', () => {
    // Simulate old stored state that lacks new fields
    const legacy = {
      version: 1,
      incomeSources: [],
      gainSources: [],
      expenses: [],
      customExpenseCategories: [],
      settings: {
        taxYear: '2024-25',
        scottishTaxpayer: false,
        pensionContributionType: 'none',
        pensionContributionValue: 0,
        employerPensionContributionType: 'flat',
        employerPensionContributionValue: 0,
        pensionCarryForward: { threeYearsAgo: 0, twoYearsAgo: 0, oneYearAgo: 0 },
        studentLoanPlan: 'none',
        hasPostgradLoan: false,
        giftAidDonations: 0,
        marriageAllowance: 'none',
        childBenefitClaiming: false,
        numberOfChildren: 0,
        isaContributions: { cashISA: 0, stocksAndSharesISA: 0, lisaISA: 0, innovativeFinanceISA: 0 },
        seisInvestment: 0,
        eisInvestment: 0,
        vctInvestment: 0,
        hasBlindPersonsAllowance: false,
        capitalLossCarryForward: 0,
        previousYearSaTaxBill: 0,
        // New fields intentionally absent — should be filled from DEFAULT_STATE
      },
    }
    storageMock.getItem.mockReturnValueOnce(JSON.stringify(legacy))
    const state = loadProfileState('default')
    expect(state.settings.taxYear).toBe('2024-25')
    // New fields should come from DEFAULT_STATE
    expect(state.settings.badrLifetimeUsed).toBe(0)
    expect(state.settings.partnerIncome).toBe(0)
    expect(state.settings.taxCode).toBeUndefined()
  })

  it('restores income sources from storage', () => {
    const stored = {
      ...DEFAULT_STATE,
      incomeSources: [{ id: 'i1', name: 'Salary', type: 'employment', grossAmount: 50000 }],
    }
    storageMock.getItem.mockReturnValueOnce(JSON.stringify(stored))
    const state = loadProfileState('default')
    expect(state.incomeSources).toHaveLength(1)
    expect(state.incomeSources[0].grossAmount).toBe(50000)
  })

  it('returns DEFAULT_STATE when stored JSON is invalid', () => {
    storageMock.getItem.mockReturnValueOnce('not valid json{{{')
    const state = loadProfileState('default')
    expect(state).toEqual(DEFAULT_STATE)
  })

  it('never persists ui state — ui always comes from DEFAULT_STATE', () => {
    const stored = {
      ...DEFAULT_STATE,
      ui: { incomeDialogMode: 'add', editingIncomeId: 'test', expenseDialogMode: 'none', editingExpenseId: null, gainDialogMode: 'none', editingGainId: null },
    }
    storageMock.getItem.mockReturnValueOnce(JSON.stringify(stored))
    const state = loadProfileState('default')
    expect(state.ui.incomeDialogMode).toBe('none')
    expect(state.ui.editingIncomeId).toBeNull()
  })
})

// ─── saveProfileState ─────────────────────────────────────────────────────────

describe('saveProfileState', () => {
  it('returns true on success', () => {
    const result = saveProfileState('default', DEFAULT_STATE)
    expect(result).toBe(true)
  })

  it('omits ui from saved data', () => {
    saveProfileState('default', DEFAULT_STATE)
    const saved = JSON.parse(storageMock.setItem.mock.calls[0][1])
    expect(saved.ui).toBeUndefined()
  })

  it('returns false when localStorage throws (quota exceeded)', () => {
    storageMock.setItem.mockImplementationOnce(() => { throw new Error('QuotaExceededError') })
    const result = saveProfileState('default', DEFAULT_STATE)
    expect(result).toBe(false)
  })
})

// ─── parseImportedState ───────────────────────────────────────────────────────

describe('parseImportedState', () => {
  const validExport = JSON.stringify({
    version: 1,
    incomeSources: [],
    gainSources: [],
    expenses: [],
    customExpenseCategories: [],
    settings: DEFAULT_STATE.settings,
  })

  it('returns parsed object for valid export', () => {
    const result = parseImportedState(validExport)
    expect(result).not.toBeNull()
    expect(Array.isArray(result?.incomeSources)).toBe(true)
  })

  it('returns null for invalid JSON', () => {
    expect(parseImportedState('not json')).toBeNull()
  })

  it('returns null when incomeSources is missing', () => {
    const bad = JSON.stringify({ gainSources: [], expenses: [], settings: {} })
    expect(parseImportedState(bad)).toBeNull()
  })

  it('returns null when gainSources is missing', () => {
    const bad = JSON.stringify({ incomeSources: [], expenses: [], settings: {} })
    expect(parseImportedState(bad)).toBeNull()
  })

  it('returns null when expenses is missing', () => {
    const bad = JSON.stringify({ incomeSources: [], gainSources: [], settings: {} })
    expect(parseImportedState(bad)).toBeNull()
  })

  it('returns null when settings is missing', () => {
    const bad = JSON.stringify({ incomeSources: [], gainSources: [], expenses: [] })
    expect(parseImportedState(bad)).toBeNull()
  })

  it('returns null when settings is null', () => {
    const bad = JSON.stringify({ incomeSources: [], gainSources: [], expenses: [], settings: null })
    expect(parseImportedState(bad)).toBeNull()
  })

  it('returns null for top-level array', () => {
    expect(parseImportedState('[]')).toBeNull()
  })

  it('returns null for top-level string', () => {
    expect(parseImportedState('"hello"')).toBeNull()
  })
})
