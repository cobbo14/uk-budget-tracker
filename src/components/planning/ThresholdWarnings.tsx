import { useBudget } from '@/hooks/useBudget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/utils/formatting'
import { getThresholdAlerts } from '@/utils/planningUtils'
import { cn } from '@/lib/utils'

export function ThresholdWarnings() {
  const { taxSummary, rules } = useBudget()

  if (taxSummary.grossIncome === 0) return null

  const alerts = getThresholdAlerts(taxSummary, rules)
  // Only show thresholds that are relevant (within £50k below or any amount over)
  const relevant = alerts.filter(a => a.gap <= 50000)

  if (relevant.length === 0) return null

  return (
    <div data-tour="threshold-warnings" className="space-y-3">
      <h3 className="text-base font-semibold">Tax Thresholds</h3>
      {relevant.map(alert => {
        const pct = Math.min(100, (alert.currentIncome / alert.threshold) * 100)
        const barColor = alert.isOver
          ? 'bg-amber-400'
          : alert.isNear
            ? 'bg-amber-400'
            : 'bg-emerald-500'

        return (
          <Card key={alert.name} className={cn(
            'border',
            alert.isOver && 'border-amber-200 dark:border-amber-800/60',
            !alert.isOver && alert.isNear && 'border-amber-300 dark:border-amber-800',
          )}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{alert.name}</CardTitle>
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  alert.isOver
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300'
                    : alert.isNear
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                )}>
                  {alert.isOver ? `${formatCurrency(Math.abs(alert.gap))} over` : `${formatCurrency(alert.gap)} headroom`}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <p className="text-xs text-muted-foreground">{alert.description}</p>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{formatCurrency(alert.currentIncome)} income</span>
                  <span>{formatCurrency(alert.threshold)} threshold</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', barColor)}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>

              {/* Pension tip */}
              {alert.isOver && alert.pensionToReach > 0 && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  💡 A pension contribution of{' '}
                  <span className="font-medium text-foreground">
                    {formatCurrency(alert.pensionToReach)}
                  </span>{' '}
                  would bring your income below this threshold.
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
