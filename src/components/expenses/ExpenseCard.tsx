import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Expense } from '@/types'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatCurrency } from '@/utils/formatting'
import { toAnnual } from '@/store/selectors'
import { useBudget } from '@/hooks/useBudget'
import { DELETE_EXPENSE, OPEN_EDIT_EXPENSE_DIALOG } from '@/store/actions'

const FREQ_LABELS: Record<Expense['frequency'], string> = {
  weekly: '/week',
  monthly: '/month',
  annual: '/year',
}

interface ExpenseCardProps {
  expense: Expense
}

export function ExpenseCard({ expense }: ExpenseCardProps) {
  const { dispatch } = useBudget()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const annual = toAnnual(expense.amount, expense.frequency)

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-3">
      <div className="flex-1 min-w-0">
        <span className="font-medium truncate block">{expense.name}</span>
        <span className="text-sm text-muted-foreground">
          {formatCurrency(expense.amount)}{FREQ_LABELS[expense.frequency]}
          {expense.frequency !== 'annual' && <> · {formatCurrency(annual)}/year</>}
        </span>
        {expense.utilityDetails && (
          <span className="text-xs text-muted-foreground block truncate">
            {[
              expense.utilityDetails.provider,
              ...expense.utilityDetails.rates.map(r =>
                [r.label, `${r.value}${r.unit}`].filter(Boolean).join(': ')
              ),
            ].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => dispatch({ type: OPEN_EDIT_EXPENSE_DIALOG, payload: expense.id })}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-destructive hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete expense"
        description={`Are you sure you want to delete "${expense.name}"? This cannot be undone.`}
        onConfirm={() => dispatch({ type: DELETE_EXPENSE, payload: expense.id })}
      />
    </div>
  )
}
