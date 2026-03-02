import { ExternalLink, Minus, TrendingDown, TrendingUp, Wifi } from 'lucide-react'
import type { Expense } from '@/types'
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

// Typical UK market average monthly costs by download speed tier
// Sources: Ofcom Connected Nations 2024, uSwitch market data
const SPEED_TIERS = [
  { label: 'Basic (ADSL)', minMbps: 0,   maxMbps: 17,       avgMonthly: 23, description: 'Up to 17 Mbps' },
  { label: 'Superfast',    minMbps: 17,  maxMbps: 80,       avgMonthly: 27, description: '17–80 Mbps' },
  { label: 'Ultrafast',    minMbps: 80,  maxMbps: 300,      avgMonthly: 32, description: '80–300 Mbps' },
  { label: 'Gigafast',     minMbps: 300, maxMbps: 600,      avgMonthly: 38, description: '300–600 Mbps' },
  { label: 'Full Fibre 1G',minMbps: 600, maxMbps: Infinity, avgMonthly: 45, description: '600 Mbps+' },
]

const COMPARISON_LINKS = [
  { name: 'uSwitch',            url: 'https://www.uswitch.com/broadband/' },
  { name: 'MoneySupermarket',   url: 'https://www.moneysupermarket.com/broadband/' },
  { name: 'comparethemarket',   url: 'https://www.comparethemarket.com/broadband/' },
  { name: 'Ofcom Checker',      url: 'https://checker.ofcom.org.uk/' },
]

function findRate(rates: NonNullable<Expense['utilityDetails']>['rates'], ...keywords: string[]) {
  return rates.find(r =>
    keywords.some(kw => r.label.toLowerCase().includes(kw))
  )
}

function getTierForSpeed(mbps: number) {
  return SPEED_TIERS.find(t => mbps >= t.minMbps && mbps < t.maxMbps) ?? SPEED_TIERS[SPEED_TIERS.length - 1]
}

function CostComparison({ monthlyCost, avgMonthly }: { monthlyCost: number; avgMonthly: number }) {
  const diff = monthlyCost - avgMonthly
  const absDiff = Math.abs(diff).toFixed(2)
  const absPct = Math.abs((diff / avgMonthly) * 100).toFixed(0)

  if (Math.abs(diff) < 1) {
    return (
      <Badge variant="outline" className="text-xs gap-1 shrink-0">
        <Minus className="h-3 w-3" />
        Around average
      </Badge>
    )
  }
  if (diff > 0) {
    return (
      <Badge variant="destructive" className="text-xs gap-1 shrink-0">
        <TrendingUp className="h-3 w-3" />
        £{absDiff}/mo above average ({absPct}% higher)
      </Badge>
    )
  }
  return (
    <Badge className="text-xs gap-1 shrink-0 bg-green-600 hover:bg-green-700">
      <TrendingDown className="h-3 w-3" />
      £{absDiff}/mo below average ({absPct}% lower)
    </Badge>
  )
}

function BroadbandExpenseComparison({ expense }: { expense: Expense }) {
  const rates = expense.utilityDetails!.rates
  const costRate = findRate(rates, 'cost', 'monthly')
  const downloadRate = findRate(rates, 'download')
  const uploadRate = findRate(rates, 'upload')

  const monthlyCost = costRate?.value
  const downloadMbps = downloadRate?.value

  const tier = downloadMbps != null ? getTierForSpeed(downloadMbps) : null

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Wifi className="h-4 w-4 shrink-0" />
        <span className="font-medium">{expense.name}</span>
        {expense.utilityDetails?.provider && (
          <span className="text-sm text-muted-foreground truncate">· {expense.utilityDetails.provider}</span>
        )}
      </div>

      <div className="space-y-1.5 text-sm">
        {/* Speed info */}
        {(downloadMbps != null || uploadRate != null) && (
          <div className="flex items-center gap-3 text-muted-foreground">
            {downloadMbps != null && (
              <span>↓ <span className="font-medium text-foreground">{downloadMbps} Mbps</span></span>
            )}
            {uploadRate != null && (
              <span>↑ <span className="font-medium text-foreground">{uploadRate.value} Mbps</span></span>
            )}
            {tier && (
              <Badge variant="secondary" className="text-xs">{tier.label}</Badge>
            )}
          </div>
        )}

        {/* Cost comparison */}
        {monthlyCost != null && tier != null ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground shrink-0">Monthly cost</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium shrink-0">£{monthlyCost.toFixed(2)}/mo</span>
              <CostComparison monthlyCost={monthlyCost} avgMonthly={tier.avgMonthly} />
            </div>
          </div>
        ) : monthlyCost != null ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground shrink-0">Monthly cost</span>
            <span className="font-medium">£{monthlyCost.toFixed(2)}/mo</span>
          </div>
        ) : null}

        {/* Cost per Mbps */}
        {monthlyCost != null && downloadMbps != null && downloadMbps > 0 && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground shrink-0">Cost per Mbps</span>
            <span className="font-medium text-xs">£{(monthlyCost / downloadMbps).toFixed(3)}/Mbps</span>
          </div>
        )}

        {monthlyCost == null && (
          <p className="text-xs text-muted-foreground">Add a "Monthly Cost" rate to enable comparison.</p>
        )}
        {downloadMbps == null && (
          <p className="text-xs text-muted-foreground">Add a "Download Speed" rate to see speed tier comparison.</p>
        )}
      </div>
    </div>
  )
}

interface BroadbandComparisonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BroadbandComparisonDialog({ open, onOpenChange }: BroadbandComparisonDialogProps) {
  const { expenses } = useBudget()

  const broadbandExpenses = expenses.filter(e => e.utilityDetails?.type === 'broadband')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Broadband Comparison</DialogTitle>
          <DialogDescription>
            Your broadband cost vs typical UK market averages by speed tier. Prices vary by area and
            provider — use the links below to check live deals.
          </DialogDescription>
        </DialogHeader>

        {broadbandExpenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground space-y-1">
            <p className="font-medium">No broadband expenses found</p>
            <p className="text-sm">Add an expense under "Utilities" with type set to Broadband, then enter your monthly cost and download speed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {broadbandExpenses.map(expense => (
              <BroadbandExpenseComparison key={expense.id} expense={expense} />
            ))}
          </div>
        )}

        <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            UK average monthly cost by speed tier
          </p>
          <div className="grid grid-cols-1 gap-1 text-xs">
            {SPEED_TIERS.map(tier => (
              <div key={tier.label} className="flex justify-between">
                <span className="text-muted-foreground">{tier.label} <span className="text-muted-foreground/60">({tier.description})</span></span>
                <span className="font-medium">~£{tier.avgMonthly}/mo</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Compare deals in your area:</p>
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
