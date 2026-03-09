import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { IncomeSource } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatCurrency } from '@/utils/formatting'
import { useBudget } from '@/hooks/useBudget'
import { DELETE_INCOME, OPEN_EDIT_INCOME_DIALOG } from '@/store/actions'

const TYPE_LABELS: Record<IncomeSource['type'], string> = {
  employment: 'PAYE',
  'self-employment': 'Self-Employed',
  dividend: 'Dividend',
  rental: 'Rental',
  bond: 'Bond',
  savings: 'Savings Interest',
}

interface IncomeCardProps {
  source: IncomeSource
}

export function IncomeCard({ source }: IncomeCardProps) {
  const { dispatch } = useBudget()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const seDeduction = source.usesTradingAllowance
    ? Math.min(1000, source.grossAmount)
    : (source.allowableExpenses ?? 0)
  const netGross = source.type === 'self-employment'
    ? source.grossAmount - seDeduction
    : source.type === 'rental'
      ? source.grossAmount - (source.rentalExpenses ?? 0)
      : source.grossAmount

  const totalSacrifice = (source.salarySacrificeItems ?? []).reduce((sum, i) =>
    sum + (i.amountType === 'percentage' ? source.grossAmount * (i.annualAmount / 100) : i.annualAmount), 0)
  const totalBIK = (source.benefitsInKind ?? []).reduce((sum, i) => {
    if (i.type === 'companyCar' && i.bikRate != null) return sum + i.annualValue * (i.bikRate / 100)
    return sum + i.annualValue
  }, 0)

  return (
    <div className="flex items-start justify-between rounded-lg border bg-card p-3 sm:p-4 sm:items-center">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{source.name}</span>
          <Badge variant="secondary" className="shrink-0">{TYPE_LABELS[source.type]}</Badge>
          {source.fromISA && <Badge variant="outline" className="shrink-0 text-emerald-600 border-emerald-300">ISA</Badge>}
          {source.isProjection && <Badge variant="outline" className="shrink-0 text-blue-600 border-blue-300">Projected</Badge>}
        </div>
        <div className="mt-1 text-sm text-muted-foreground flex flex-wrap gap-x-1.5">
          {source.isProjection && source.ytdAmount != null && source.ytdMonths != null ? (
            <span>YTD: {formatCurrency(source.ytdAmount)} over {source.ytdMonths}mo → Annual: {formatCurrency(source.grossAmount)}</span>
          ) : (
            <span>Gross: {formatCurrency(source.grossAmount)}</span>
          )}
          {source.bonus != null && source.bonus > 0 && (
            <span>· Bonus: {formatCurrency(source.bonus)}</span>
          )}
          {source.type === 'self-employment' && source.usesTradingAllowance && (
            <><span>· Trading Allowance: {formatCurrency(Math.min(1000, source.grossAmount))}</span><span>· Net: {formatCurrency(netGross)}</span></>
          )}
          {source.type === 'self-employment' && !source.usesTradingAllowance && source.allowableExpenses != null && source.allowableExpenses > 0 && (
            <><span>· Expenses: {formatCurrency(source.allowableExpenses)}</span><span>· Net: {formatCurrency(netGross)}</span></>
          )}
          {source.type === 'rental' && (
            <>
              {source.rentalExpenses != null && source.rentalExpenses > 0 && <span>· Expenses: {formatCurrency(source.rentalExpenses)}</span>}
              {source.mortgageInterestAnnual != null && source.mortgageInterestAnnual > 0 && <span>· Mortgage interest: {formatCurrency(source.mortgageInterestAnnual)}</span>}
            </>
          )}
          {totalSacrifice > 0 && (
            <span>· Sacrifice: {formatCurrency(totalSacrifice)}</span>
          )}
          {totalBIK > 0 && (
            <span>· BIK: {formatCurrency(totalBIK)}</span>
          )}
        </div>
        {totalSacrifice > 0 && source.salarySacrificeItems && source.salarySacrificeItems.length > 0 && (
          <div className="mt-0.5 text-xs text-muted-foreground/70">
            {source.salarySacrificeItems.map(i => {
              const resolved = i.amountType === 'percentage' ? source.grossAmount * (i.annualAmount / 100) : i.annualAmount
              return (
                <span key={i.id} className="mr-2">
                  {i.name}: {i.amountType === 'percentage' ? `${i.annualAmount}% (${formatCurrency(resolved)})` : formatCurrency(i.annualAmount)}
                </span>
              )
            })}
          </div>
        )}
        {totalBIK > 0 && source.benefitsInKind && source.benefitsInKind.length > 0 && (
          <div className="mt-0.5 text-xs text-muted-foreground/70">
            {source.benefitsInKind.map(i => {
              if (i.type === 'companyCar' && i.bikRate != null) {
                const taxable = i.annualValue * (i.bikRate / 100)
                return <span key={i.id} className="mr-2">{i.name}: {formatCurrency(i.annualValue)} × {i.bikRate}% = {formatCurrency(taxable)}</span>
              }
              return <span key={i.id} className="mr-2">{i.name}: {formatCurrency(i.annualValue)}</span>
            })}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2 sm:ml-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-10 sm:w-10"
          onClick={() => dispatch({ type: OPEN_EDIT_INCOME_DIALOG, payload: source.id })}
          aria-label={`Edit ${source.name}`}
        >
          <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-10 sm:w-10 text-destructive hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
          aria-label={`Delete ${source.name}`}
        >
          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete income source"
        description={`Are you sure you want to delete "${source.name}"? This cannot be undone.`}
        onConfirm={() => dispatch({ type: DELETE_INCOME, payload: source.id })}
      />
    </div>
  )
}
