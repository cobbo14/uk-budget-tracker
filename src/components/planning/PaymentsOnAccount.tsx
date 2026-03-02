import { useBudget } from '@/hooks/useBudget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/utils/formatting'
import { cn } from '@/lib/utils'
import { UPDATE_SETTINGS } from '@/store/actions'

/** Derive the year boundaries from a taxYear string like "2025-26". */
function parseTaxYear(taxYear: string): { startYear: number; endYear: number } {
  const startYear = parseInt(taxYear.split('-')[0], 10)
  return { startYear, endYear: startYear + 1 }
}

const POA_THRESHOLD = 1000

export function PaymentsOnAccount() {
  const { taxSummary, settings, dispatch } = useBudget()

  const prevYearBill = settings.previousYearSaTaxBill ?? 0
  const currentYearEstimate = taxSummary.selfAssessmentTaxEstimate

  const hasPrevYear = prevYearBill > POA_THRESHOLD
  const hasCurrentYear = currentYearEstimate > POA_THRESHOLD

  const { endYear } = parseTaxYear(settings.taxYear)

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">Payments on Account</h3>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Self-Assessment Advance Payments</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <p className="text-xs text-muted-foreground">
            When your self-assessment tax bill exceeds £{POA_THRESHOLD.toLocaleString()}, HMRC requires two advance payments
            each equal to 50% of the previous year's bill — due 31 January and 31 July.
          </p>

          {/* Input for previous year SA tax bill */}
          <div className="grid gap-1.5 max-w-xs">
            <Label htmlFor="prev-sa-tax">Last year's self-assessment tax bill (£)</Label>
            <Input
              id="prev-sa-tax"
              type="number"
              min="0"
              step="100"
              placeholder="0"
              value={prevYearBill || ''}
              onChange={e => dispatch({ type: UPDATE_SETTINGS, payload: { previousYearSaTaxBill: parseFloat(e.target.value) || 0 } })}
            />
            <p className="text-xs text-muted-foreground">
              SA tax paid for last year (excluding PAYE). Used to calculate current Payment on Account amounts.
            </p>
          </div>

          {/* Current year Payments on Account (based on previous year's bill) */}
          {hasPrevYear && (
            <div className="space-y-2">
              <p className="text-xs font-medium">
                Current year payments (based on {endYear - 2}/{String(endYear - 1).slice(-2)} bill of {formatCurrency(prevYearBill)})
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className={cn('rounded-lg border bg-muted/30 px-3 py-2 text-xs space-y-0.5')}>
                  <p className="font-medium">1st Payment on Account</p>
                  <p className="text-muted-foreground">31 January {endYear}</p>
                  <p className="text-base font-semibold">{formatCurrency(prevYearBill / 2)}</p>
                </div>
                <div className={cn('rounded-lg border bg-muted/30 px-3 py-2 text-xs space-y-0.5')}>
                  <p className="font-medium">2nd Payment on Account</p>
                  <p className="text-muted-foreground">31 July {endYear}</p>
                  <p className="text-base font-semibold">{formatCurrency(prevYearBill / 2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Next year Payments on Account (based on current year's projected bill) */}
          {hasCurrentYear && (
            <div className="space-y-2">
              <p className="text-xs font-medium">
                Next year's projected payments (based on current {endYear - 1}/{String(endYear).slice(-2)} estimate of {formatCurrency(currentYearEstimate)})
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs space-y-0.5">
                  <p className="font-medium">1st Payment on Account</p>
                  <p className="text-muted-foreground">31 January {endYear + 1}</p>
                  <p className="text-base font-semibold">{formatCurrency(currentYearEstimate / 2)}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs space-y-0.5">
                  <p className="font-medium">2nd Payment on Account</p>
                  <p className="text-muted-foreground">31 July {endYear + 1}</p>
                  <p className="text-base font-semibold">{formatCurrency(currentYearEstimate / 2)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Estimate based on projected self-assessment tax (income tax + self-employment NI + other non-PAYE tax).
                Actual amounts depend on HMRC's calculation and any balancing payment adjustments.
              </p>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
