import { useState } from 'react'
import { Download, TriangleAlert } from 'lucide-react'
import { useBudget } from '@/hooks/useBudget'
import { Button } from '@/components/ui/button'
import { downloadBackup, getLastExported } from '@/utils/backup'

/** Nudge threshold: backups older than this count as stale */
const STALE_MS = 30 * 24 * 60 * 60 * 1000
/** "Remind me later" hides the banner for this long */
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000
const SNOOZE_KEY = 'backupNudgeSnoozedUntil'

/** iOS Safari running as a plain website (not installed to the home screen) —
 *  the case where ITP can evict localStorage after 7 days of no visits */
function isUninstalledIosSafari(): boolean {
  const isIos = /iP(hone|ad|od)/.test(navigator.userAgent)
  const isStandalone =
    (navigator as { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  return isIos && !isStandalone
}

/**
 * App-wide reminder that data lives only in this browser. Shown when the user
 * has real data and the last JSON backup is missing or over 30 days old.
 */
export function BackupNudge() {
  const { state, incomeSources, expenses, gainSources } = useBudget()
  // Render-time clock snapshot (day-granularity checks, so staleness is fine);
  // bumping it after export/snooze re-runs the localStorage-derived checks
  const [now, setNow] = useState(() => Date.now())

  const hasData = incomeSources.length + expenses.length + gainSources.length > 0
  if (!hasData) return null
  // Don't stack on top of first-run onboarding
  if (localStorage.getItem('welcomeCompleted') !== 'true') return null
  const snoozedUntil = parseInt(localStorage.getItem(SNOOZE_KEY) ?? '0', 10)
  if (Number.isFinite(snoozedUntil) && snoozedUntil > now) return null
  const lastExported = getLastExported()
  if (lastExported !== null && now - lastExported < STALE_MS) return null

  const lastLabel = lastExported
    ? new Date(lastExported).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-4">
      <div
        data-testid="backup-nudge"
        className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <TriangleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 hidden sm:block" />
        <div className="flex-1 text-sm">
          <p>
            Your data is stored only in this browser — {lastLabel
              ? <>last backup <span className="font-medium">{lastLabel}</span>.</>
              : <span className="font-medium">no backup yet.</span>}
          </p>
          {isUninstalledIosSafari() && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Tip: install as an app (Share → Add to Home Screen) so Safari never auto-deletes your data.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => {
              downloadBackup(state)
              setNow(Date.now())
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Export backup
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              try {
                localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS))
              } catch {
                // storage full — banner will just reappear next visit
              }
              setNow(Date.now())
            }}
          >
            Remind me later
          </Button>
        </div>
      </div>
    </div>
  )
}
