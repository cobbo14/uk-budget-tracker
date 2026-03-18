import type { ReactNode } from 'react'
import { Header } from './Header'
import { TabNav, type TabId } from './TabNav'
import { TourOverlay } from '@/components/tour/TourOverlay'

interface AppShellProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  budgetingMode: boolean
  onBudgetingModeChange: (enabled: boolean) => void
  employeeMode: boolean
  onEmployeeModeChange: (enabled: boolean) => void
  onSearchOpen: () => void
  children: ReactNode
}

export function AppShell({ activeTab, onTabChange, budgetingMode, onBudgetingModeChange, employeeMode, onEmployeeModeChange, onSearchOpen, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onSearchOpen={onSearchOpen} />
      <TabNav activeTab={activeTab} onTabChange={onTabChange} budgetingMode={budgetingMode} onBudgetingModeChange={onBudgetingModeChange} employeeMode={employeeMode} onEmployeeModeChange={onEmployeeModeChange} />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 flex-1">
        {children}
      </main>
      <footer className="border-t bg-muted/40 mt-8">
        <div className="mx-auto max-w-5xl px-4 py-6 space-y-3">
          <p className="text-xs text-muted-foreground">
            Tax rates sourced from{' '}
            <a href="https://www.gov.uk/income-tax-rates" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
              HMRC official guidance
            </a>
            . Updated for the 2024/25, 2025/26, and 2026/27 tax years.
            This calculator is for estimation purposes only and does not constitute financial advice.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
            <a href="#guide" className="text-muted-foreground hover:text-foreground transition-colors">
              Tax Guides
            </a>
            <a href="#disclaimer" className="text-muted-foreground hover:text-foreground transition-colors">
              Disclaimer
            </a>
            <a href="#privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Use
            </a>
          </div>
        </div>
      </footer>
      <TourOverlay />
    </div>
  )
}
