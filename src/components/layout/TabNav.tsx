import { LayoutDashboard, Wallet, TrendingUp, ShoppingCart, Lightbulb, Settings, HelpCircle, BookOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TabId = 'summary' | 'income' | 'gains' | 'expenses' | 'planning' | 'settings' | 'help' | 'guide'

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'summary', label: 'Summary', icon: LayoutDashboard },
  { id: 'income', label: 'Income', icon: Wallet },
  { id: 'expenses', label: 'Expenses', icon: ShoppingCart },
  { id: 'planning', label: 'Planning', icon: Lightbulb },
  { id: 'gains', label: 'Gains', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: HelpCircle },
  { id: 'guide', label: 'Guides', icon: BookOpen },
]

interface TabNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav data-tour="tab-nav" className="sticky top-14 z-30 border-b bg-background">
      <div className="mx-auto max-w-4xl px-4 flex">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              data-tour={`tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium border-b-2 transition-colors sm:gap-1 sm:py-3 sm:text-xs',
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
