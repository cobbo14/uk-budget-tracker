import type { Page } from '@playwright/test'

export interface SeedProfile {
  id: string
  name: string
}

/**
 * Seed localStorage before the app boots: profile list, per-profile state,
 * and the flags that suppress first-run overlays (welcome guide).
 *
 * NOTE: addInitScript re-runs on every navigation and clears storage first,
 * so call page.goto() exactly once per test after seeding — a second goto
 * would wipe state the app saved during the test.
 */
export async function seedApp(page: Page, opts: {
  profiles?: SeedProfile[]
  activeProfileId?: string
  /** Partial AppState per profile id (see baseState) */
  states?: Record<string, object>
  /** Raw extra localStorage entries */
  extra?: Record<string, string>
} = {}): Promise<void> {
  const profiles = opts.profiles ?? [{ id: 'default', name: 'Default' }]
  const activeProfileId = opts.activeProfileId ?? profiles[0].id
  const states = opts.states ?? {}
  const extra = opts.extra ?? {}
  await page.addInitScript(({ profiles, activeProfileId, states, extra }) => {
    localStorage.clear()
    localStorage.setItem('welcomeCompleted', 'true')
    localStorage.setItem('budgetingMode', 'false')
    localStorage.setItem('uk_budget_tracker_profiles', JSON.stringify({ profiles, activeProfileId }))
    for (const [id, state] of Object.entries(states)) {
      localStorage.setItem(`uk_budget_tracker_state_${id}`, JSON.stringify(state))
    }
    for (const [key, value] of Object.entries(extra)) {
      localStorage.setItem(key, value)
    }
  }, { profiles, activeProfileId, states, extra })
}

/** Minimal persisted AppState with overridable slices. */
export function baseState(partial: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: 1,
    incomeSources: [],
    gainSources: [],
    expenses: [],
    customExpenseCategories: [],
    settings: { taxYear: '2025-26' },
    ...partial,
  }
}

/**
 * Read a profile's persisted state after waiting out the 300 ms debounced
 * save and the deferred cross-profile split sync.
 */
export async function readProfileState(
  page: Page,
  profileId: string,
): Promise<Record<string, unknown> | null> {
  await page.waitForTimeout(600)
  return page.evaluate(id => {
    const raw = localStorage.getItem(`uk_budget_tracker_state_${id}`)
    return raw ? JSON.parse(raw) : null
  }, profileId)
}
