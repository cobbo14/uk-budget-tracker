import { Plus, TrendingUp, Undo2 } from 'lucide-react'
import { useBudget } from '@/hooks/useBudget'
import { Button } from '@/components/ui/button'
import { IncomeCard } from './IncomeCard'
import { IncomeFormDialog } from './IncomeFormDialog'
import { OPEN_ADD_INCOME_DIALOG } from '@/store/actions'
import { formatCurrency } from '@/utils/formatting'

const INCOME_TYPE_ORDER = ['employment', 'self-employment', 'rental', 'dividend', 'bond'] as const

const TYPE_HEADERS: Record<string, string> = {
  employment: 'Employment (PAYE)',
  'self-employment': 'Self-Employment',
  rental: 'Rental Income',
  dividend: 'Dividends',
  bond: 'Bond Gains',
}

export function IncomeView() {
  const { incomeSources, taxSummary, dispatch, canUndo, undo } = useBudget()

  const grouped = INCOME_TYPE_ORDER.map(type => ({
    type,
    label: TYPE_HEADERS[type],
    sources: incomeSources.filter(s => s.type === type),
  })).filter(g => g.sources.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Income Sources</h2>
          <p className="text-sm text-muted-foreground">
            Total gross: {formatCurrency(taxSummary.grossIncome)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled={!canUndo} onClick={undo} title="Undo (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
          <Button data-tour="add-income-btn" onClick={() => dispatch({ type: OPEN_ADD_INCOME_DIALOG })}>
            <Plus className="h-4 w-4" />
            Add Income
          </Button>
        </div>
      </div>

      {incomeSources.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center">
          <TrendingUp className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No income sources yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your income sources to see your tax calculation.</p>
          <Button className="mt-4" onClick={() => dispatch({ type: OPEN_ADD_INCOME_DIALOG })}>
            <Plus className="h-4 w-4" />
            Add Income Source
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ type, label, sources }) => (
            <div key={type}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{label}</h3>
              <div className="space-y-2">
                {sources.map(source => (
                  <IncomeCard key={source.id} source={source} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <IncomeFormDialog />
    </div>
  )
}
