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
import { useBudget } from '@/hooks/useBudget'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import type { TabId } from '@/components/layout/TabNav'

// Lazy-load the two heaviest views for better initial bundle size
const SummaryView = lazy(() => import('@/components/summary/SummaryView').then(m => ({ default: m.SummaryView })))
const PlanningView = lazy(() => import('@/components/planning/PlanningView').then(m => ({ default: m.PlanningView })))

const VALID_TABS: TabId[] = ['summary', 'income', 'gains', 'expenses', 'planning', 'settings', 'help']

function getTabFromHash(): TabId {
  const hash = window.location.hash.slice(1) as TabId
  return VALID_TABS.includes(hash) ? hash : 'summary'
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>(getTabFromHash)
  const [showMonthly, setShowMonthly] = useState(
    () => localStorage.getItem('showMonthly') !== 'false',
  )
  const { canUndo, undo } = useBudget()

  useEffect(() => {
    function handleHashChange() {
      setActiveTab(getTabFromHash())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    localStorage.setItem('showMonthly', showMonthly ? 'true' : 'false')
  }, [showMonthly])

  // Global Ctrl+Z / Cmd+Z undo shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && canUndo) {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, undo])

  function handleTabChange(tab: TabId) {
    window.location.hash = tab
    setActiveTab(tab)
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={handleTabChange}>
      <ErrorBoundary>
        <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
          {activeTab === 'summary' && <SummaryView showMonthly={showMonthly} onShowMonthlyChange={setShowMonthly} />}
          {activeTab === 'income' && <IncomeView />}
          {activeTab === 'gains' && <GainsView />}
          {activeTab === 'expenses' && <ExpensesView showMonthly={showMonthly} onShowMonthlyChange={setShowMonthly} />}
          {activeTab === 'planning' && <PlanningView />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'help' && <HelpView />}
        </Suspense>
      </ErrorBoundary>
    </AppShell>
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
