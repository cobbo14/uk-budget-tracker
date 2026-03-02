import type { ReactNode } from 'react'
import { Header } from './Header'
import { TabNav, type TabId } from './TabNav'
import { TourOverlay } from '@/components/tour/TourOverlay'

interface AppShellProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  children: ReactNode
}

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TabNav activeTab={activeTab} onTabChange={onTabChange} />
      <main className="mx-auto max-w-4xl px-4 py-6">
        {children}
      </main>
      <TourOverlay />
    </div>
  )
}
