import { useEffect, useState } from 'react'
import { PoundSterling, Sun, Moon, AlertCircle, HelpCircle, Heart, MessageSquarePlus } from 'lucide-react'
import { ProfileSwitcher } from './ProfileSwitcher'
import { useBudget } from '@/hooks/useBudget'
import { useTour } from '@/components/tour/TourContext'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { getAvailableTaxYears, getTaxRules } from '@/taxRules'
import { UPDATE_SETTINGS } from '@/store/actions'

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, setDark] as const
}

export function Header() {
  const [dark, setDark] = useDarkMode()
  const { settings, dispatch, savedAt, saveError } = useBudget()
  const { startTour } = useTour()
  const [showSaved, setShowSaved] = useState(false)
  const years = getAvailableTaxYears()

  useEffect(() => {
    if (savedAt === 0) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- transient toast state driven by external savedAt trigger
    setShowSaved(true)
    const timer = setTimeout(() => setShowSaved(false), 2000)
    return () => clearTimeout(timer)
  }, [savedAt])

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4">
        <PoundSterling className="h-5 w-5 text-emerald-600 shrink-0" />
        <span className="font-semibold text-lg whitespace-nowrap">UK Budget Tracker</span>
        <div className="ml-2 shrink-0 flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Tax Year</span>
          <Select
            value={settings.taxYear}
            onValueChange={v => dispatch({ type: UPDATE_SETTINGS, payload: { taxYear: v } })}
          >
            <SelectTrigger className="h-8 text-xs w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y}>{getTaxRules(y).label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {showSaved && !saveError && (
            <span className="text-xs text-muted-foreground">Saved</span>
          )}
          {saveError && (
            <span className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Storage full
            </span>
          )}
          <ProfileSwitcher />
          <a
            href="https://ko-fi.com/cobbo14"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-2 py-1.5 text-xs text-pink-400 hover:text-pink-500 hover:bg-accent transition-colors flex items-center gap-1"
            aria-label="Support on Ko-fi"
          >
            <Heart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Show Some Love</span>
          </a>
          <a
            href="https://github.com/cobbo14/uk-budget-tracker/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Give Feedback"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </a>
          <button
            onClick={startTour}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Start help tour"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDark(d => !d)}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}
