import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DEFAULT_STATE,
  loadProfileState,
  saveProfileState,
  parseImportedState,
  mergeWithDefaults,
  syncSplitToOtherProfiles,
  deleteSplitFromOtherProfiles,
  removeParticipantFromSplit,
  detachSplitCopies,
} from './localStorage'
import { DEFAULT_TAX_YEAR } from '@/taxRules'
import type { AppState, Expense } from '@/types'

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
    // Retired tax year migrates to the current default
    expect(state.settings.taxYear).toBe(DEFAULT_TAX_YEAR)
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

// ─── mergeWithDefaults ────────────────────────────────────────────────────────

describe('mergeWithDefaults', () => {
  it('fills settings fields missing from older exports with defaults', () => {
    const partial = {
      incomeSources: [],
      gainSources: [],
      expenses: [],
      settings: { taxYear: '2025-26' },
    } as unknown as Partial<AppState>
    const merged = mergeWithDefaults(partial)
    expect(merged.settings.taxYear).toBe('2025-26')
    expect(merged.settings.isaContributions).toEqual(DEFAULT_STATE.settings.isaContributions)
    expect(merged.settings.pensionCarryForward).toEqual(DEFAULT_STATE.settings.pensionCarryForward)
    expect(merged.ui).toEqual(DEFAULT_STATE.ui)
  })

  it('migrates retired tax years to the current default', () => {
    const partial = {
      incomeSources: [],
      gainSources: [],
      expenses: [],
      settings: { taxYear: '2024-25' },
    } as unknown as Partial<AppState>
    expect(mergeWithDefaults(partial).settings.taxYear).toBe(DEFAULT_TAX_YEAR)
  })

  describe('per-source employer pension migration', () => {
    const employment = (over: Record<string, unknown> = {}) => ({
      id: '1', name: 'Job', type: 'employment', grossAmount: 60000, ...over,
    })

    it('folds a flat per-source employer contribution into a flat global', () => {
      const merged = mergeWithDefaults({
        incomeSources: [employment({ employerPensionAmount: 3000, employerPensionAmountType: 'flat' })],
        settings: { employerPensionContributionType: 'flat', employerPensionContributionValue: 2000 },
      } as unknown as Partial<AppState>)
      expect(merged.settings.employerPensionContributionType).toBe('flat')
      expect(merged.settings.employerPensionContributionValue).toBe(5000)
      expect(merged.incomeSources[0].employerPensionAmount).toBeUndefined()
      expect(merged.incomeSources[0].employerPensionAmountType).toBeUndefined()
    })

    it('resolves a percentage per-source contribution against that source gross', () => {
      const merged = mergeWithDefaults({
        incomeSources: [employment({ employerPensionAmount: 5, employerPensionAmountType: 'percentage' })],
        settings: {},
      } as unknown as Partial<AppState>)
      expect(merged.settings.employerPensionContributionType).toBe('flat')
      expect(merged.settings.employerPensionContributionValue).toBe(3000) // 5% × £60,000
    })

    it('converts a percentage global to flat before folding', () => {
      // Global 3% of £60,000 eligible = £1,800, plus per-source £1,000 → £2,800
      const merged = mergeWithDefaults({
        incomeSources: [employment({ employerPensionAmount: 1000, employerPensionAmountType: 'flat' })],
        settings: { employerPensionContributionType: 'percentage', employerPensionContributionValue: 3 },
      } as unknown as Partial<AppState>)
      expect(merged.settings.employerPensionContributionType).toBe('flat')
      expect(merged.settings.employerPensionContributionValue).toBe(2800)
    })

    it('is idempotent — a second merge changes nothing', () => {
      const first = mergeWithDefaults({
        incomeSources: [employment({ employerPensionAmount: 3000, employerPensionAmountType: 'flat' })],
        settings: { employerPensionContributionType: 'flat', employerPensionContributionValue: 2000 },
      } as unknown as Partial<AppState>)
      const second = mergeWithDefaults(first)
      expect(second.settings.employerPensionContributionValue).toBe(5000)
      expect(second.incomeSources).toEqual(first.incomeSources)
    })

    it('does not touch profiles without per-source employer contributions', () => {
      const merged = mergeWithDefaults({
        incomeSources: [employment()],
        settings: { employerPensionContributionType: 'percentage', employerPensionContributionValue: 3 },
      } as unknown as Partial<AppState>)
      expect(merged.settings.employerPensionContributionType).toBe('percentage')
      expect(merged.settings.employerPensionContributionValue).toBe(3)
    })
  })
})

// ─── Split expense lifecycle ─────────────────────────────────────────────────

describe('split expense lifecycle', () => {
  function seedProfiles(ids: string[]) {
    localStorage.setItem('uk_budget_tracker_profiles', JSON.stringify({
      profiles: ids.map(id => ({ id, name: id })),
      activeProfileId: ids[0],
    }))
  }

  function splitExpense(overrides: Partial<Expense> = {}): Expense {
    return {
      id: 'e1',
      name: 'Rent',
      category: 'housing',
      amount: 1000,
      frequency: 'monthly',
      splitGroupId: 'g1',
      splitPercentage: 50,
      splitOriginProfileId: 'a',
      splitConfig: [
        { profileId: 'a', percentage: 50 },
        { profileId: 'b', percentage: 50 },
      ],
      ...overrides,
    }
  }

  it('syncSplitToOtherProfiles upserts a copy into each participant profile', () => {
    seedProfiles(['a', 'b'])
    syncSplitToOtherProfiles(splitExpense(), 'a')
    const b = loadProfileState('b')
    expect(b.expenses).toHaveLength(1)
    expect(b.expenses[0].splitGroupId).toBe('g1')
    expect(b.expenses[0].splitPercentage).toBe(50)
    expect(b.expenses[0].splitConfig).toBeUndefined() // only origin keeps the config
  })

  it('prunes stale copies from profiles removed from the split', () => {
    seedProfiles(['a', 'b', 'c'])
    // Initial sync includes b and c
    syncSplitToOtherProfiles(splitExpense({
      splitConfig: [
        { profileId: 'a', percentage: 40 },
        { profileId: 'b', percentage: 30 },
        { profileId: 'c', percentage: 30 },
      ],
    }), 'a')
    expect(loadProfileState('c').expenses).toHaveLength(1)
    // c is removed from the split — its copy must disappear on the next sync
    syncSplitToOtherProfiles(splitExpense({
      splitConfig: [
        { profileId: 'a', percentage: 50 },
        { profileId: 'b', percentage: 50 },
      ],
    }), 'a')
    expect(loadProfileState('c').expenses).toHaveLength(0)
    expect(loadProfileState('b').expenses).toHaveLength(1)
  })

  it('skips participants that are not real profiles (imported foreign data)', () => {
    seedProfiles(['a', 'b'])
    syncSplitToOtherProfiles(splitExpense({
      splitConfig: [
        { profileId: 'a', percentage: 50 },
        { profileId: 'ghost', percentage: 50 },
      ],
    }), 'a')
    expect(localStorage.getItem('uk_budget_tracker_state_ghost')).toBeNull()
  })

  it('deleteSplitFromOtherProfiles removes copies from every other profile', () => {
    seedProfiles(['a', 'b', 'c'])
    syncSplitToOtherProfiles(splitExpense({
      splitConfig: [
        { profileId: 'a', percentage: 40 },
        { profileId: 'b', percentage: 30 },
        { profileId: 'c', percentage: 30 },
      ],
    }), 'a')
    deleteSplitFromOtherProfiles('g1', 'a')
    expect(loadProfileState('b').expenses).toHaveLength(0)
    expect(loadProfileState('c').expenses).toHaveLength(0)
  })

  it('removeParticipantFromSplit drops the participant from the origin config', () => {
    seedProfiles(['a', 'b'])
    saveProfileState('a', { ...DEFAULT_STATE, expenses: [splitExpense()] })
    removeParticipantFromSplit('g1', 'b', 'a')
    const origin = loadProfileState('a')
    expect(origin.expenses[0].splitConfig).toEqual([{ profileId: 'a', percentage: 50 }])
  })

  it('detachSplitCopies turns other profiles’ copies into standalone expenses', () => {
    seedProfiles(['a', 'b'])
    syncSplitToOtherProfiles(splitExpense(), 'a')
    detachSplitCopies('g1', 'a')
    const copy = loadProfileState('b').expenses[0]
    expect(copy.splitGroupId).toBeUndefined()
    expect(copy.splitOriginProfileId).toBeUndefined()
    expect(copy.splitPercentage).toBe(50) // effective amount unchanged
  })
})

describe('parseImportedState — settings type checks', () => {
  it('drops mistyped settings keys instead of rejecting the file', () => {
    const json = JSON.stringify({
      incomeSources: [],
      gainSources: [],
      expenses: [],
      settings: { taxYear: 123, numberOfChildren: 'five', giftAidDonations: 250 },
    })
    const parsed = parseImportedState(json)
    expect(parsed).not.toBeNull()
    const settings = parsed!.settings as unknown as Record<string, unknown>
    expect(settings.taxYear).toBeUndefined()
    expect(settings.numberOfChildren).toBeUndefined()
    expect(settings.giftAidDonations).toBe(250)
  })
})
