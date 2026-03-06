import { LayoutDashboard, Wallet, TrendingUp, ShoppingCart, Lightbulb, Settings, HelpCircle, BookOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'

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

const BUDGETING_HIDDEN_TABS: TabId[] = ['planning', 'gains']

interface TabNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  budgetingMode: boolean
  onBudgetingModeChange: (enabled: boolean) => void
  employeeMode: boolean
  onEmployeeModeChange: (enabled: boolean) => void
}

export function TabNav({ activeTab, onTabChange, budgetingMode, onBudgetingModeChange, employeeMode, onEmployeeModeChange }: TabNavProps) {
  const visibleTabs = budgetingMode ? TABS.filter(t => !BUDGETING_HIDDEN_TABS.includes(t.id)) : TABS

  return (
    <nav data-tour="tab-nav" className="sticky top-14 z-30 border-b bg-background">
      <div className="mx-auto max-w-4xl px-4 flex items-end">
        {visibleTabs.map(tab => {
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
        <div className="shrink-0 ml-1 mb-1.5 sm:mb-2 flex flex-col gap-1">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground whitespace-nowrap">
              <span className="hidden sm:inline">{employeeMode ? 'Employee' : 'Sole Trader'}</span>
              <span className="sm:hidden">{employeeMode ? 'E' : 'ST'}</span>
            </span>
            <Switch
              checked={!employeeMode}
              onCheckedChange={v => onEmployeeModeChange(!v)}
              className="data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-emerald-500"
            />
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground whitespace-nowrap">
              <span className="hidden sm:inline">{budgetingMode ? 'Budgeting' : 'Standard'}</span>
              <span className="sm:hidden">{budgetingMode ? 'B' : 'S'}</span>
            </span>
            <Switch
              checked={budgetingMode}
              onCheckedChange={onBudgetingModeChange}
              className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-emerald-500"
            />
          </label>
        </div>
      </div>
    </nav>
  )
}
