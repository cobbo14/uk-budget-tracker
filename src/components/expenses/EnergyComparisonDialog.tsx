import { ExternalLink, Flame, Minus, TrendingDown, TrendingUp, Zap } from 'lucide-react'
import type { Expense, UtilityRate } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useBudget } from '@/hooks/useBudget'

// Ofgem price cap reference rates (typical, direct debit, average consumption)
// Source: https://www.ofgem.gov.uk/check-if-energy-price-cap-affects-you
const OFGEM_CAP = {
  updatedLabel: 'Q3 2025 (Jul–Sep)',
  electricity: {
    unitRate: { label: 'Unit Rate', value: 24.50, unit: 'p/kWh' },
    standingCharge: { label: 'Standing Charge', value: 61.64, unit: 'p/day' },
  },
  gas: {
    unitRate: { label: 'Unit Rate', value: 6.24, unit: 'p/kWh' },
    standingCharge: { label: 'Standing Charge', value: 31.65, unit: 'p/day' },
  },
}

const COMPARISON_LINKS = [
  { name: 'Ofgem', url: 'https://www.ofgem.gov.uk/check-if-energy-price-cap-affects-you' },
  { name: 'uSwitch', url: 'https://www.uswitch.com/gas-electricity/' },
  { name: 'MoneySupermarket', url: 'https://www.moneysupermarket.com/gas-and-electricity/' },
  { name: 'Cheap Energy Club', url: 'https://www.moneysavingexpert.com/utilities/cheap-energy-club/' },
]

function matchOfgemRate(rate: UtilityRate, utilityType: 'electricity' | 'gas') {
  const cap = OFGEM_CAP[utilityType]
  const unitLower = rate.unit.toLowerCase()
  const labelLower = rate.label.toLowerCase()
  if (unitLower.includes('kwh') || labelLower.includes('unit')) return cap.unitRate
  if (unitLower.includes('day') || labelLower.includes('standing')) return cap.standingCharge
  return null
}

function RateComparison({ rate, utilityType }: { rate: UtilityRate; utilityType: 'electricity' | 'gas' }) {
  const ref = matchOfgemRate(rate, utilityType)
  if (!ref) return null

  const diff = rate.value - ref.value
  const pctDiff = (diff / ref.value) * 100
  const absDiff = Math.abs(diff).toFixed(2)
  const absPct = Math.abs(pctDiff).toFixed(0)

  if (Math.abs(diff) < 0.5) {
    return (
      <Badge variant="outline" className="text-xs gap-1 shrink-0">
        <Minus className="h-3 w-3" />
        At cap
      </Badge>
    )
  }
  if (diff > 0) {
    return (
      <Badge variant="destructive" className="text-xs gap-1 shrink-0">
        <TrendingUp className="h-3 w-3" />
        +{absDiff}{rate.unit} above cap ({absPct}% higher)
      </Badge>
    )
  }
  return (
    <Badge className="text-xs gap-1 shrink-0 bg-green-600 hover:bg-green-700">
      <TrendingDown className="h-3 w-3" />
      {absDiff}{rate.unit} below cap ({absPct}% lower)
    </Badge>
  )
}

function EnergyExpenseComparison({ expense }: { expense: Expense }) {
  const utilityType = expense.utilityDetails!.type as 'electricity' | 'gas'
  const Icon = utilityType === 'electricity' ? Zap : Flame

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="font-medium">{expense.name}</span>
        {expense.utilityDetails?.provider && (
          <span className="text-sm text-muted-foreground truncate">· {expense.utilityDetails.provider}</span>
        )}
      </div>
      <div className="space-y-1.5">
        {expense.utilityDetails!.rates.map((rate, i) => (
          <div key={i} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground shrink-0">{rate.label}</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium shrink-0">{rate.value}{rate.unit}</span>
              <RateComparison rate={rate} utilityType={utilityType} />
            </div>
          </div>
        ))}
        {expense.utilityDetails!.rates.filter(r => matchOfgemRate(r, utilityType) === null).length === expense.utilityDetails!.rates.length && (
          <p className="text-xs text-muted-foreground">Rate units not recognised for comparison (expected p/kWh or p/day).</p>
        )}
      </div>
    </div>
  )
}

interface EnergyComparisonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EnergyComparisonDialog({ open, onOpenChange }: EnergyComparisonDialogProps) {
  const { expenses } = useBudget()

  const energyExpenses = expenses.filter(
    e => e.utilityDetails?.type === 'electricity' || e.utilityDetails?.type === 'gas'
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Energy Rate Comparison</DialogTitle>
          <DialogDescription>
            Your current rates vs the Ofgem price cap ({OFGEM_CAP.updatedLabel} typical rates for direct debit customers).
            Rates vary by region — check Ofgem for your area.
          </DialogDescription>
        </DialogHeader>

        {energyExpenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground space-y-1">
            <p className="font-medium">No electricity or gas expenses found</p>
            <p className="text-sm">Add an expense under the "Utilities" category with type set to Electricity or Gas, and enter your unit rate and standing charge.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {energyExpenses.map(expense => (
              <EnergyExpenseComparison key={expense.id} expense={expense} />
            ))}
          </div>
        )}

        <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Ofgem cap reference ({OFGEM_CAP.updatedLabel})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="space-y-0.5">
              <p className="font-medium flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Electricity
              </p>
              <p className="text-xs text-muted-foreground">
                Unit: {OFGEM_CAP.electricity.unitRate.value}p/kWh
              </p>
              <p className="text-xs text-muted-foreground">
                Standing: {OFGEM_CAP.electricity.standingCharge.value}p/day
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="font-medium flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5" /> Gas
              </p>
              <p className="text-xs text-muted-foreground">
                Unit: {OFGEM_CAP.gas.unitRate.value}p/kWh
              </p>
              <p className="text-xs text-muted-foreground">
                Standing: {OFGEM_CAP.gas.standingCharge.value}p/day
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Compare & switch supplier:</p>
          <div className="flex flex-wrap gap-2">
            {COMPARISON_LINKS.map(link => (
              <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  {link.name}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </a>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
