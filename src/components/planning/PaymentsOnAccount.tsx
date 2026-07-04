import { useBudget } from '@/hooks/useBudget'
import { useEmployeeMode } from '@/hooks/useEmployeeMode'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UPDATE_SETTINGS } from '@/store/actions'
import { formatCurrency } from '@/utils/formatting'

export function PaymentsOnAccount() {
  const { taxSummary: t, settings, dispatch } = useBudget()
  const employeeMode = useEmployeeMode()

  if (employeeMode || t.selfEmploymentGross <= 0) return null

  const saEstimate = t.selfAssessmentTaxEstimate
  // POA is based on the "relevant amount" — income tax + Class 4 NI + HICBC +
  // AA charge, net of tax deducted at source (PAYE). CGT and student loans are
  // settled via the balancing payment only.
  const hasEmployment = t.employmentGross > 0
  const employmentShare = hasEmployment ? t.employmentGross / (t.grossIncome || 1) : 0
  // Rough estimate: PAYE collects the proportion of income tax attributable to employment
  const payeEstimate = t.incomeTax * employmentShare
  const poaBase = Math.max(0, t.poaRelevantTax - payeEstimate)
  const deductedShare = t.poaRelevantTax > 0 ? payeEstimate / t.poaRelevantTax : 0

  // HMRC bases POAs on the previous year's actual bill when available;
  // otherwise we estimate from current-year figures.
  const previousBill = settings.previousYearSaTaxBill ?? 0
  const usingPreviousBill = previousBill > 0
  const poaBasis = usingPreviousBill ? previousBill : poaBase

  // HMRC: no POA if the relevant amount ≤ £1,000, or (when estimating) if
  // ≥ 80% of tax was collected at source
  const poaDue = poaBasis > 1000 && (usingPreviousBill || deductedShare < 0.8)
  const poaAmount = poaBasis / 2

  // Derive payment dates from tax year (e.g. "2025-26")
  const taxYear = settings.taxYear
  const startYear = parseInt(taxYear.split('-')[0])
  const jan31 = `31 January ${startYear + 1}`
  const jul31 = `31 July ${startYear + 1}`
  const balancingDate = `31 January ${startYear + 2}`

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">Payments on Account</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Advance tax payments for Self Assessment. HMRC bases them on your previous year&rsquo;s bill &mdash; enter it below for exact amounts, or leave at 0 to estimate from your current figures.
        </p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Estimated Self Assessment tax</CardTitle>
          <CardDescription>
            {poaDue
              ? 'Your relevant tax exceeds £1,000, so HMRC requires advance payments.'
              : 'No payments on account expected on these figures.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5 max-w-xs">
            <Label htmlFor="previous-sa-bill">Last year&rsquo;s SA bill (£, optional)</Label>
            <Input
              id="previous-sa-bill"
              type="number"
              min="0"
              step="100"
              placeholder="0"
              value={settings.previousYearSaTaxBill || ''}
              onChange={e => dispatch({
                type: UPDATE_SETTINGS,
                payload: { previousYearSaTaxBill: parseFloat(e.target.value) || 0 },
              })}
            />
          </div>

          <div className="rounded-md bg-muted/40 px-4 py-3 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated SA tax bill ({taxYear.replace('-', '/')})</span>
              <span className="font-medium tabular-nums">{formatCurrency(saEstimate)}</span>
            </div>
            {saEstimate - t.poaRelevantTax > 0.005 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">of which CGT / student loan (balancing payment only)</span>
                <span className="font-medium tabular-nums">{formatCurrency(saEstimate - t.poaRelevantTax)}</span>
              </div>
            )}
            {!usingPreviousBill && payeEstimate > 0.005 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">less tax collected at source via PAYE (estimated)</span>
                <span className="font-medium tabular-nums">−{formatCurrency(payeEstimate)}</span>
              </div>
            )}
            {usingPreviousBill && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Previous year&rsquo;s SA bill (POA basis)</span>
                <span className="font-medium tabular-nums">{formatCurrency(previousBill)}</span>
              </div>
            )}
            {poaDue ? (
              <>
                <div className="border-t pt-1.5 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">1st Payment on Account ({jan31})</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(poaAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">2nd Payment on Account ({jul31})</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(poaAmount)}</span>
                  </div>
                </div>
                <div className="border-t pt-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balancing payment ({balancingDate})</span>
                    <span className="text-xs text-muted-foreground">Difference between actual bill and POAs</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="border-t pt-1.5 text-xs text-muted-foreground">
                POAs are not required when the relevant amount is £1,000 or less, or when 80%+ of your tax is collected at source. Your full bill is due {balancingDate}.
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Each payment is 50% of the previous year&rsquo;s relevant amount (income tax and Class 4 NI, net of tax deducted at source — capital gains tax and student loan repayments are excluded and settled with the balancing payment). If your actual bill differs, the balancing payment on {balancingDate} adjusts the total. You can apply to reduce POAs if you expect a lower bill.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
