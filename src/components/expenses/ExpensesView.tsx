import { useState } from 'react'
import { Heart, Plus, Receipt, Settings2, Undo2, Wifi, X, Zap } from 'lucide-react'
import { useBudget } from '@/hooks/useBudget'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExpenseCard } from './ExpenseCard'
import { ExpenseFormDialog } from './ExpenseFormDialog'
import { CategoryManagerDialog } from './CategoryManagerDialog'
import { EnergyComparisonDialog } from './EnergyComparisonDialog'
import { BroadbandComparisonDialog } from './BroadbandComparisonDialog'
import { OPEN_ADD_EXPENSE_DIALOG } from '@/store/actions'
import { EXPENSE_CATEGORY_LIST, getCategoryMeta } from '@/constants/expenseCategories'
import { formatCurrency } from '@/utils/formatting'
import { effectiveAnnual } from '@/store/selectors'

interface ExpensesViewProps {
  showMonthly: boolean
  onShowMonthlyChange: (v: boolean) => void
}

export function ExpensesView({ showMonthly, onShowMonthlyChange }: ExpensesViewProps) {
  const { expenses, expensesByCategory, customExpenseCategories, totalAnnualExpenses, dispatch, canUndo, undo } = useBudget()
  const viewMode = showMonthly ? 'monthly' : 'annual'
  const [manageOpen, setManageOpen] = useState(false)
  const [energyCompareOpen, setEnergyCompareOpen] = useState(false)
  const [broadbandCompareOpen, setBroadbandCompareOpen] = useState(false)

  const [supportDismissed, setSupportDismissed] = useState(
    () => localStorage.getItem('support_banner_dismissed') === '1'
  )
  const showSupportBanner = expenses.length >= 3 && !supportDismissed

  const hasEnergyExpenses = expenses.some(
    e => e.utilityDetails?.type === 'electricity' || e.utilityDetails?.type === 'gas'
  )
  const hasBroadbandExpenses = expenses.some(e => e.utilityDetails?.type === 'broadband')

  const allCategoryIds = [
    ...EXPENSE_CATEGORY_LIST,
    ...customExpenseCategories.map(c => c.id),
  ]
  const categoriesWithExpenses = allCategoryIds.filter(cat => (expensesByCategory.get(cat) ?? []).length > 0)

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Expenses</h2>
            <p className="text-sm text-muted-foreground">
              Total annual: {formatCurrency(totalAnnualExpenses)} · Monthly avg: {formatCurrency(totalAnnualExpenses / 12)}
            </p>
          </div>
          <Button data-tour="add-expense-btn" onClick={() => dispatch({ type: OPEN_ADD_EXPENSE_DIALOG })}>
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border overflow-hidden text-sm">
            <button
              className={`px-3 py-1.5 ${viewMode === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
              onClick={() => onShowMonthlyChange(true)}
            >
              Monthly
            </button>
            <button
              className={`px-3 py-1.5 ${viewMode === 'annual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
              onClick={() => onShowMonthlyChange(false)}
            >
              Annual
            </button>
          </div>
          {hasEnergyExpenses && (
            <Button variant="outline" size="sm" onClick={() => setEnergyCompareOpen(true)}>
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Compare</span> Energy
            </Button>
          )}
          {hasBroadbandExpenses && (
            <Button variant="outline" size="sm" onClick={() => setBroadbandCompareOpen(true)}>
              <Wifi className="h-4 w-4" />
              <span className="hidden sm:inline">Compare</span> Broadband
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
            <Settings2 className="h-4 w-4" />
            Categories
          </Button>
          <Button variant="ghost" size="sm" disabled={!canUndo} onClick={undo} title="Undo (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 sm:p-12 text-center">
          <Receipt className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No expenses yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your expenses to see how much you have left over.</p>
          <Button className="mt-4" onClick={() => dispatch({ type: OPEN_ADD_EXPENSE_DIALOG })}>
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {categoriesWithExpenses.map(cat => {
            const catExpenses = expensesByCategory.get(cat) ?? []
            const catMeta = getCategoryMeta(cat, customExpenseCategories)
            const catAnnual = catExpenses.reduce((sum, e) => sum + effectiveAnnual(e), 0)
            const catDisplay = viewMode === 'monthly' ? catAnnual / 12 : catAnnual

            return (
              <div key={cat}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={catMeta.color}>{catMeta.label}</Badge>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatCurrency(catDisplay)}{viewMode === 'monthly' ? '/mo' : '/yr'}
                  </span>
                </div>
                <div className="space-y-2">
                  {catExpenses.map(expense => (
                    <ExpenseCard key={expense.id} expense={expense} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showSupportBanner && (
        <div className="flex items-center gap-3 rounded-lg border border-pink-200 bg-pink-50 px-4 py-3 text-sm dark:border-pink-900 dark:bg-pink-950/30">
          <Heart className="h-4 w-4 shrink-0 text-pink-500" />
          <p className="flex-1 text-muted-foreground">
            Finding UK Budget Tracker useful?{' '}
            <a
              href="https://ko-fi.com/cobbo14"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-pink-600 hover:underline dark:text-pink-400"
            >
              Support the project on Ko-fi
            </a>{' '}
            to help keep it free and maintained.
          </p>
          <button
            onClick={() => {
              setSupportDismissed(true)
              localStorage.setItem('support_banner_dismissed', '1')
            }}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <ExpenseFormDialog />
      <CategoryManagerDialog open={manageOpen} onOpenChange={setManageOpen} />
      <EnergyComparisonDialog open={energyCompareOpen} onOpenChange={setEnergyCompareOpen} />
      <BroadbandComparisonDialog open={broadbandCompareOpen} onOpenChange={setBroadbandCompareOpen} />
    </div>
  )
}
