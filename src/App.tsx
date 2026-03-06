import { useState, useEffect, lazy, Suspense } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ProfilesProvider, useProfiles } from '@/store/ProfilesContext'
import { TourProvider } from '@/components/tour/TourContext'
import { AppProvider } from '@/store/AppContext'
import { AppShell } from '@/components/layout/AppShell'
import { IncomeView } from '@/components/income/IncomeView'
import { ExpensesView } from '@/components/expenses/ExpensesView'
import { SettingsView } from '@/components/settings/SettingsView'
import { GainsView } from '@/components/gains/GainsView'
import { HelpView } from '@/components/help/HelpView'
import { GuideView } from '@/components/guide/GuideView'
import { LegalView } from '@/components/legal/LegalView'
import { CookieConsent } from '@/components/CookieConsent'
import { useBudget } from '@/hooks/useBudget'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SearchDialog } from '@/components/search/SearchDialog'
import type { TabId } from '@/components/layout/TabNav'

// Lazy-load the two heaviest views for better initial bundle size
const SummaryView = lazy(() => import('@/components/summary/SummaryView').then(m => ({ default: m.SummaryView })))
const PlanningView = lazy(() => import('@/components/planning/PlanningView').then(m => ({ default: m.PlanningView })))

const VALID_TABS: TabId[] = ['summary', 'income', 'gains', 'expenses', 'planning', 'settings', 'help', 'guide']
const LEGAL_PAGES = ['disclaimer', 'privacy', 'terms'] as const

function getTabFromHash(): TabId {
  const hash = window.location.hash.slice(1)
  if (hash === 'guide' || hash.startsWith('guide/')) return 'guide'
  if (LEGAL_PAGES.includes(hash as typeof LEGAL_PAGES[number])) return 'summary' // legal pages render independently
  return VALID_TABS.includes(hash as TabId) ? (hash as TabId) : 'summary'
}

function getLegalPageFromHash(): typeof LEGAL_PAGES[number] | null {
  const hash = window.location.hash.slice(1)
  if (LEGAL_PAGES.includes(hash as typeof LEGAL_PAGES[number])) return hash as typeof LEGAL_PAGES[number]
  return null
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>(getTabFromHash)
  const [legalPage, setLegalPage] = useState<typeof LEGAL_PAGES[number] | null>(getLegalPageFromHash)
  const [showMonthly, setShowMonthly] = useState(
    () => localStorage.getItem('showMonthly') !== 'false',
  )
  const [budgetingMode, setBudgetingMode] = useState(
    () => localStorage.getItem('budgetingMode') === 'true',
  )
  const [searchOpen, setSearchOpen] = useState(false)
  const { canUndo, undo } = useBudget()

  useEffect(() => {
    function handleHashChange() {
      setActiveTab(getTabFromHash())
      setLegalPage(getLegalPageFromHash())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    localStorage.setItem('showMonthly', showMonthly ? 'true' : 'false')
  }, [showMonthly])

  useEffect(() => {
    localStorage.setItem('budgetingMode', budgetingMode ? 'true' : 'false')
  }, [budgetingMode])

  // Update document title per tab (guide pages set their own titles)
  useEffect(() => {
    if (activeTab === 'guide') return
    const BASE = 'UK Budget Tracker'
    const TAB_TITLES: Record<string, string> = {
      summary: `${BASE} — Free Tax Calculator & Pension Optimiser 2024-27`,
      income: `Income Tax Calculator — ${BASE}`,
      expenses: `Expenses & Budgeting — ${BASE}`,
      planning: `Tax Planning & Pension Optimiser — ${BASE}`,
      gains: `Capital Gains Tax Calculator — ${BASE}`,
      settings: `Settings — ${BASE}`,
      help: `Help & Guide — ${BASE}`,
    }
    document.title = TAB_TITLES[activeTab] ?? BASE
  }, [activeTab])

  // Global Ctrl+Z / Cmd+Z undo shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && canUndo) {
        e.preventDefault()
        undo()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, undo])

  function handleTabChange(tab: TabId) {
    window.location.hash = tab
    setActiveTab(tab)
  }

  function handleSearchNavigate(tab: TabId, targetSelector?: string, hash?: string) {
    if (hash) {
      window.location.hash = hash
      setActiveTab(tab)
    } else {
      handleTabChange(tab)
    }
    if (targetSelector) {
      const tryScroll = (attempts: number) => {
        const el = document.querySelector(targetSelector)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else if (attempts > 0) {
          setTimeout(() => tryScroll(attempts - 1), 150)
        }
      }
      setTimeout(() => tryScroll(3), 100)
    }
  }

  function handleBudgetingModeChange(enabled: boolean) {
    setBudgetingMode(enabled)
    if (enabled && (activeTab === 'planning' || activeTab === 'gains')) {
      handleTabChange('summary')
    }
  }

  return (
    <>
      <AppShell activeTab={activeTab} onTabChange={handleTabChange} budgetingMode={budgetingMode} onBudgetingModeChange={handleBudgetingModeChange} onSearchOpen={() => setSearchOpen(true)}>
        <ErrorBoundary>
          <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
            {legalPage ? (
              <LegalView page={legalPage} />
            ) : (
              <>
                {activeTab === 'summary' && <SummaryView showMonthly={showMonthly} onShowMonthlyChange={setShowMonthly} />}
                {activeTab === 'income' && <IncomeView />}
                {activeTab === 'gains' && <GainsView />}
                {activeTab === 'expenses' && <ExpensesView showMonthly={showMonthly} onShowMonthlyChange={setShowMonthly} />}
                {activeTab === 'planning' && <PlanningView />}
                {activeTab === 'settings' && <SettingsView />}
                {activeTab === 'help' && <HelpView />}
                {activeTab === 'guide' && <GuideView />}
              </>
            )}
          </Suspense>
        </ErrorBoundary>
        <CookieConsent />
      </AppShell>
      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onNavigate={handleSearchNavigate}
        budgetingMode={budgetingMode}
      />
    </>
  )
}

function AppInner() {
  const { activeProfileId } = useProfiles()
  return (
    // key forces a full remount (and fresh state) when the active profile changes
    <AppProvider key={activeProfileId} profileId={activeProfileId}>
      <AppContent />
    </AppProvider>
  )
}

export default function App() {
  return (
    <TooltipProvider delayDuration={300}>
      <TourProvider>
        <ProfilesProvider>
          <AppInner />
        </ProfilesProvider>
      </TourProvider>
    </TooltipProvider>
  )
}
