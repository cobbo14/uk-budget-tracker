import { useState } from 'react'
import { Pencil, Trash2, Users } from 'lucide-react'
import type { Expense } from '@/types'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from '@/components/ui/tooltip'
import { formatCurrency } from '@/utils/formatting'
import { effectiveAmount, toAnnual } from '@/store/selectors'
import { useBudget } from '@/hooks/useBudget'
import { useProfiles } from '@/store/ProfilesContext'
import { deleteSplitFromOtherProfiles } from '@/services/localStorage'
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
  const { profiles, activeProfileId } = useProfiles()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [splitDeleteOpen, setSplitDeleteOpen] = useState(false)

  const isSplit = !!expense.splitGroupId
  const effectiveAmt = effectiveAmount(expense)
  const annual = toAnnual(effectiveAmt, expense.frequency)

  return (
    <div className="flex items-start justify-between rounded-lg border bg-card p-3 sm:items-center">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium truncate">{expense.name}</span>
          {isSplit && (
            <Tooltip>
              <TooltipTrigger>
                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                Split expense ({expense.splitPercentage}% your share)
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {isSplit ? (
            <>
              {formatCurrency(effectiveAmt)}{FREQ_LABELS[expense.frequency]}
              {expense.frequency !== 'annual' && <> · {formatCurrency(annual)}/year</>}
              <span className="text-xs"> ({expense.splitPercentage}% of {formatCurrency(expense.amount)})</span>
            </>
          ) : (
            <>
              {formatCurrency(expense.amount)}{FREQ_LABELS[expense.frequency]}
              {expense.frequency !== 'annual' && <> · {formatCurrency(annual)}/year</>}
            </>
          )}
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
      <div className="flex items-center gap-1 shrink-0 ml-2 sm:ml-3">
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
          onClick={() => isSplit ? setSplitDeleteOpen(true) : setConfirmOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Standard delete confirm for non-split expenses */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete expense"
        description={`Are you sure you want to delete "${expense.name}"? This cannot be undone.`}
        onConfirm={() => dispatch({ type: DELETE_EXPENSE, payload: expense.id })}
      />

      {/* Split delete dialog with two options */}
      {isSplit && (
        <Dialog open={splitDeleteOpen} onOpenChange={setSplitDeleteOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete split expense</DialogTitle>
              <DialogDescription>
                This expense is split across profiles. How would you like to proceed?
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  dispatch({ type: DELETE_EXPENSE, payload: expense.id })
                  setSplitDeleteOpen(false)
                }}
              >
                Remove from this profile only
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  dispatch({ type: DELETE_EXPENSE, payload: expense.id })
                  if (expense.splitGroupId) {
                    deleteSplitFromOtherProfiles(
                      expense.splitGroupId,
                      activeProfileId,
                      profiles.map(p => p.id),
                    )
                  }
                  setSplitDeleteOpen(false)
                }}
              >
                Delete from all profiles
              </Button>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setSplitDeleteOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
