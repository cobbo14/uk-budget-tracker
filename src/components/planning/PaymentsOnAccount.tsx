import { useBudget } from '@/hooks/useBudget'
import { useEmployeeMode } from '@/hooks/useEmployeeMode'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/utils/formatting'

export function PaymentsOnAccount() {
  const { taxSummary: t, settings } = useBudget()
  const employeeMode = useEmployeeMode()

  if (employeeMode || t.selfEmploymentGross <= 0) return null

  const saEstimate = t.selfAssessmentTaxEstimate

  // HMRC: no POA if SA bill ≤ £1,000
  if (saEstimate <= 1000) return null

  // HMRC: no POA if ≥ 80% of tax was collected at source (PAYE)
  // Approximate: if there's employment income, the PAYE portion covers employment IT + Class 1 NI
  // selfAssessmentTaxEstimate already excludes Class 1 NI, so compare employment IT share
  const totalIT = t.incomeTax
  const hasEmployment = t.employmentGross > 0
  if (hasEmployment && totalIT > 0) {
    // Rough estimate: PAYE covers the proportion of IT attributable to employment
    const employmentShare = t.employmentGross / (t.grossIncome || 1)
    const payeEstimate = totalIT * employmentShare
    if (payeEstimate / saEstimate >= 0.8) return null
  }

  const poaAmount = saEstimate / 2

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
          Estimated advance tax payments for Self Assessment. HMRC uses the previous year&rsquo;s bill &mdash; this estimate is based on your current figures.
        </p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Estimated Self Assessment tax</CardTitle>
          <CardDescription>Your SA bill exceeds £1,000, so HMRC requires advance payments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md bg-muted/40 px-4 py-3 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated SA tax bill</span>
              <span className="font-medium tabular-nums">{formatCurrency(saEstimate)}</span>
            </div>
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
          </div>
          <p className="text-xs text-muted-foreground">
            Each payment is 50% of the estimated bill. If your actual tax bill differs, the balancing payment on {balancingDate} adjusts the total. You can apply to reduce POAs if you expect a lower bill.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
