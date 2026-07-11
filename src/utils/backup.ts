import type { AppState } from '@/types'
import { exportStateAsJSON } from '@/services/localStorage'

// Key predates this module (was set directly by SettingsView) — keep it so
// existing users' last-export dates survive
const LAST_EXPORTED_KEY = 'lastExported'

/** Download the active profile's data as a JSON backup and record when. */
export function downloadBackup(state: AppState): void {
  const json = exportStateAsJSON(state)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'budget-tracker-export.json'
  a.click()
  URL.revokeObjectURL(url)
  try {
    localStorage.setItem(LAST_EXPORTED_KEY, Date.now().toString())
  } catch {
    // Storage errors never block the download itself
  }
}

/** Timestamp (ms) of the last JSON backup, or null if never exported. */
export function getLastExported(): number | null {
  try {
    const raw = localStorage.getItem(LAST_EXPORTED_KEY)
    if (!raw) return null
    const n = parseInt(raw, 10)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}
