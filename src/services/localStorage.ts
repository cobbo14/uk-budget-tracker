import type { AppState, Expense, Profile } from '@/types'
import { generateId } from '@/utils/ids'
import { DEFAULT_TAX_YEAR, TAX_RULES } from '@/taxRules'
import { resolveSalarySacrificeItem } from '@/utils/taxCalculations'

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
    sippContributionType: 'flat',
    employerMatchRate: 0,
    employerMatchCapPercent: 0,
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

/** Merge a partial persisted/imported state over the defaults so fields added
 *  in later versions are always present. UI state is never persisted. */
export function mergeWithDefaults(partial: Partial<AppState>): AppState {
  const merged: AppState = {
    ...DEFAULT_STATE,
    ...partial,
    settings: { ...DEFAULT_STATE.settings, ...partial.settings },
    ui: DEFAULT_STATE.ui,
  }
  // Migrate retired tax years (e.g. 2024-25) to the current default
  if (!TAX_RULES[merged.settings.taxYear]) {
    merged.settings = { ...merged.settings, taxYear: DEFAULT_TAX_YEAR }
  }
  // Migrate per-source employer pension contributions into the global setting.
  // They have no per-source tax meaning (the engine sums them with the global
  // amount for Annual Allowance funding only), and the input now lives solely
  // in Settings → Pension Contributions.
  const perSourceEmployer = merged.incomeSources.reduce((sum, s) => {
    if (!s.employerPensionAmount) return sum
    return sum + (s.employerPensionAmountType === 'percentage'
      ? s.grossAmount * (s.employerPensionAmount / 100)
      : s.employerPensionAmount)
  }, 0)
  // Legacy data predates the 'qualifying' basis, so only fold when the global
  // setting is flat or percentage — never overwrite a qualifying-earnings setup
  if (perSourceEmployer > 0 && merged.settings.employerPensionContributionType !== 'qualifying') {
    let globalFlat: number
    if (merged.settings.employerPensionContributionType === 'percentage'
        && merged.settings.employerPensionContributionValue > 0) {
      // Resolve the global percentage against pension-eligible income
      // (employment net of salary sacrifice + self-employment profit),
      // mirroring the engine, then convert to a flat amount
      const eligible = merged.incomeSources.reduce((sum, s) => {
        if (s.type === 'employment') {
          const sacrifice = (s.salarySacrificeItems ?? []).reduce((a, i) =>
            a + resolveSalarySacrificeItem(i, s, TAX_RULES[merged.settings.taxYear]), 0)
          return sum + Math.max(0, s.grossAmount + (s.bonus ?? 0) - sacrifice)
        }
        if (s.type === 'self-employment') {
          const expenses = s.usesTradingAllowance
            ? Math.min(1000, s.grossAmount)
            : (s.allowableExpenses ?? 0)
          return sum + Math.max(0, s.grossAmount - expenses)
        }
        return sum
      }, 0) + (merged.settings.transitionalProfitSpread ?? 0)
      globalFlat = eligible * (merged.settings.employerPensionContributionValue / 100)
    } else {
      globalFlat = merged.settings.employerPensionContributionType === 'flat'
        ? merged.settings.employerPensionContributionValue : 0
    }
    merged.settings = {
      ...merged.settings,
      employerPensionContributionType: 'flat',
      employerPensionContributionValue: Math.round(globalFlat + perSourceEmployer),
    }
    merged.incomeSources = merged.incomeSources.map(s =>
      s.employerPensionAmount
        ? { ...s, employerPensionAmount: undefined, employerPensionAmountType: undefined }
        : s,
    )
  }
  return merged
}

export function loadProfileState(profileId: string): AppState {
  try {
    const raw = localStorage.getItem(profileStateKey(profileId))
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<AppState>
    return mergeWithDefaults(parsed)
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
 * an expense copy with matching splitGroupId, save back. Profiles that are
 * NOT in splitConfig have any stale copy removed (participant was removed
 * from the split). Participants that don't exist in the profile list are
 * skipped, so imported data can't create orphan storage keys.
 */
export function syncSplitToOtherProfiles(expense: Expense, currentProfileId: string): void {
  if (!expense.splitConfig || !expense.splitGroupId) return

  const participantIds = new Set(expense.splitConfig.map(p => p.profileId))
  for (const profile of loadProfiles().profiles) {
    if (profile.id === currentProfileId) continue

    const participant = expense.splitConfig.find(p => p.profileId === profile.id)
    const profileState = loadProfileState(profile.id)
    const existingIndex = profileState.expenses.findIndex(
      e => e.splitGroupId === expense.splitGroupId
    )

    if (!participantIds.has(profile.id)) {
      // No longer part of the split — remove any stale copy
      if (existingIndex >= 0) {
        saveProfileState(profile.id, {
          ...profileState,
          expenses: profileState.expenses.filter((_, i) => i !== existingIndex),
        })
      }
      continue
    }

    const copy: Expense = {
      ...expense,
      id: existingIndex >= 0
        ? profileState.expenses[existingIndex].id
        : generateId(),
      splitPercentage: participant!.percentage,
      splitOriginProfileId: expense.splitOriginProfileId,
      splitConfig: undefined, // only origin keeps the config
    }

    const updatedExpenses = existingIndex >= 0
      ? profileState.expenses.map((e, i) => i === existingIndex ? copy : e)
      : [...profileState.expenses, copy]

    saveProfileState(profile.id, {
      ...profileState,
      expenses: updatedExpenses,
    })
  }
}

/**
 * Remove a split expense from all other profiles' localStorage.
 */
export function deleteSplitFromOtherProfiles(
  splitGroupId: string,
  currentProfileId: string,
): void {
  for (const profile of loadProfiles().profiles) {
    if (profile.id === currentProfileId) continue
    const profileState = loadProfileState(profile.id)
    const filtered = profileState.expenses.filter(e => e.splitGroupId !== splitGroupId)
    if (filtered.length !== profileState.expenses.length) {
      saveProfileState(profile.id, { ...profileState, expenses: filtered })
    }
  }
}

/**
 * Remove a participant from the origin profile's split config (a non-origin
 * profile opting out of a split). Percentages are left untouched — the origin
 * sees the "must add up to 100%" validation on their next edit and rebalances.
 */
export function removeParticipantFromSplit(
  splitGroupId: string,
  participantProfileId: string,
  originProfileId: string,
): void {
  const originState = loadProfileState(originProfileId)
  const updated = originState.expenses.map(e => {
    if (e.splitGroupId !== splitGroupId || !e.splitConfig) return e
    return { ...e, splitConfig: e.splitConfig.filter(p => p.profileId !== participantProfileId) }
  })
  saveProfileState(originProfileId, { ...originState, expenses: updated })
}

/**
 * Detach other profiles' copies of a split when the ORIGIN removes only its
 * own copy: the copies become standalone expenses (splitGroupId and
 * splitOriginProfileId stripped, splitPercentage kept so the effective
 * amount is unchanged).
 */
export function detachSplitCopies(splitGroupId: string, originProfileId: string): void {
  for (const profile of loadProfiles().profiles) {
    if (profile.id === originProfileId) continue
    const profileState = loadProfileState(profile.id)
    let dirty = false
    const updated = profileState.expenses.map(e => {
      if (e.splitGroupId !== splitGroupId) return e
      dirty = true
      return { ...e, splitGroupId: undefined, splitOriginProfileId: undefined, splitConfig: undefined }
    })
    if (dirty) {
      saveProfileState(profile.id, { ...profileState, expenses: updated })
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
    // Deep validation — reject if individual items are missing required fields
    for (const s of parsed.incomeSources) {
      if (!s || typeof s.id !== 'string' || typeof s.type !== 'string' || typeof s.grossAmount !== 'number') return null
    }
    for (const g of parsed.gainSources) {
      if (!g || typeof g.id !== 'string' || typeof g.gainAmount !== 'number') return null
    }
    for (const e of parsed.expenses) {
      if (!e || typeof e.id !== 'string' || typeof e.name !== 'string' || typeof e.amount !== 'number') return null
    }
    // Settings: drop keys with the wrong type rather than rejecting the file —
    // mergeWithDefaults fills the gaps, preventing NaN/undefined cascades
    const s = parsed.settings as Record<string, unknown>
    const numericKeys = [
      'pensionContributionValue', 'employerPensionContributionValue', 'sippContribution',
      'employerMatchRate', 'employerMatchCapPercent',
      'giftAidDonations', 'numberOfChildren', 'seisInvestment', 'eisInvestment', 'vctInvestment',
      'capitalLossCarryForward', 'previousYearSaTaxBill', 'badrLifetimeUsed', 'partnerIncome',
      'transitionalProfitSpread',
    ]
    for (const key of numericKeys) {
      if (key in s && typeof s[key] !== 'number') delete s[key]
    }
    if ('taxYear' in s && typeof s.taxYear !== 'string') delete s.taxYear
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
