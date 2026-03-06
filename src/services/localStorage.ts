import type { AppState, Expense, Profile } from '@/types'
import { generateId } from '@/utils/ids'
import { DEFAULT_TAX_YEAR } from '@/taxRules'

const LEGACY_KEY = 'uk_budget_tracker_v1'
const PROFILES_KEY = 'uk_budget_tracker_profiles'
const profileStateKey = (id: string) => `uk_budget_tracker_state_${id}`

const SCHEMA_VERSION = 1

export const DEFAULT_STATE: AppState = {
  version: SCHEMA_VERSION,
  incomeSources: [],
  gainSources: [],
  expenses: [],
  customExpenseCategories: [],
  settings: {
    taxYear: DEFAULT_TAX_YEAR,
    scottishTaxpayer: false,
    pensionContributionType: 'none',
    pensionContributionValue: 0,
    employerPensionContributionType: 'flat',
    employerPensionContributionValue: 0,
    sippContribution: 0,
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
    badrLifetimeUsed: 0,
    taxCode: undefined,
    transitionalProfitSpread: undefined,
    partnerIncome: 0,
  },
  ui: {
    incomeDialogMode: 'none',
    editingIncomeId: null,
    expenseDialogMode: 'none',
    editingExpenseId: null,
    gainDialogMode: 'none',
    editingGainId: null,
  },
}

interface PersistedProfiles {
  profiles: Profile[]
  activeProfileId: string
}

export function loadProfiles(): PersistedProfiles {
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedProfiles
      if (Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
        return parsed
      }
    }
    // First run: migrate any existing data to a "Default" profile
    const defaultProfile: Profile = { id: 'default', name: 'Default' }
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      localStorage.setItem(profileStateKey('default'), legacy)
    }
    const initial: PersistedProfiles = { profiles: [defaultProfile], activeProfileId: 'default' }
    localStorage.setItem(PROFILES_KEY, JSON.stringify(initial))
    return initial
  } catch {
    return { profiles: [{ id: 'default', name: 'Default' }], activeProfileId: 'default' }
  }
}

export function saveProfiles(data: PersistedProfiles): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(data))
  } catch {
    // Silently ignore storage errors
  }
}

export function loadProfileState(profileId: string): AppState {
  try {
    const raw = localStorage.getItem(profileStateKey(profileId))
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      ...DEFAULT_STATE,
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
      // UI state is never persisted
      ui: DEFAULT_STATE.ui,
    }
  } catch {
    return DEFAULT_STATE
  }
}

/** Returns true on success, false if quota exceeded or any storage error. */
export function saveProfileState(profileId: string, state: AppState): boolean {
  try {
    const { ui: _ui, ...persisted } = state
    localStorage.setItem(profileStateKey(profileId), JSON.stringify(persisted))
    return true
  } catch {
    return false
  }
}

/**
 * Sync a split expense to other profiles' localStorage.
 * For each participant (excl. currentProfileId): load their state, upsert
 * an expense copy with matching splitGroupId, save back.
 */
export function syncSplitToOtherProfiles(expense: Expense, currentProfileId: string): void {
  if (!expense.splitConfig || !expense.splitGroupId) return

  for (const participant of expense.splitConfig) {
    if (participant.profileId === currentProfileId) continue

    const profileState = loadProfileState(participant.profileId)
    const existingIndex = profileState.expenses.findIndex(
      e => e.splitGroupId === expense.splitGroupId
    )
    const copy: Expense = {
      ...expense,
      id: existingIndex >= 0
        ? profileState.expenses[existingIndex].id
        : generateId(),
      splitPercentage: participant.percentage,
      splitOriginProfileId: expense.splitOriginProfileId,
      splitConfig: undefined, // only origin keeps the config
    }

    const updatedExpenses = existingIndex >= 0
      ? profileState.expenses.map((e, i) => i === existingIndex ? copy : e)
      : [...profileState.expenses, copy]

    saveProfileState(participant.profileId, {
      ...profileState,
      expenses: updatedExpenses,
    })
  }
}

/**
 * Remove a split expense from other profiles' localStorage.
 */
export function deleteSplitFromOtherProfiles(
  splitGroupId: string,
  currentProfileId: string,
  allProfileIds: string[],
): void {
  for (const profileId of allProfileIds) {
    if (profileId === currentProfileId) continue
    const profileState = loadProfileState(profileId)
    const filtered = profileState.expenses.filter(e => e.splitGroupId !== splitGroupId)
    if (filtered.length !== profileState.expenses.length) {
      saveProfileState(profileId, { ...profileState, expenses: filtered })
    }
  }
}

export function deleteProfileState(profileId: string): void {
  try {
    localStorage.removeItem(profileStateKey(profileId))
  } catch {
    // Silently ignore storage errors
  }
}

export function exportStateAsJSON(state: AppState): string {
  const { ui: _ui, ...persisted } = state
  return JSON.stringify(persisted, null, 2)
}

export function parseImportedState(json: string): Partial<AppState> | null {
  try {
    const parsed = JSON.parse(json)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
    // Structural validation — reject if required arrays/objects are missing
    if (!Array.isArray(parsed.incomeSources)) return null
    if (!Array.isArray(parsed.gainSources)) return null
    if (!Array.isArray(parsed.expenses)) return null
    if (parsed.customExpenseCategories !== undefined && !Array.isArray(parsed.customExpenseCategories)) return null
    if (typeof parsed.settings !== 'object' || parsed.settings === null) return null
    return parsed as Partial<AppState>
  } catch {
    return null
  }
}

// Legacy exports kept for backward compatibility with SettingsView
export function loadState(): AppState {
  const { activeProfileId } = loadProfiles()
  return loadProfileState(activeProfileId)
}

export function saveState(state: AppState): void {
  const { activeProfileId } = loadProfiles()
  saveProfileState(activeProfileId, state)
}
