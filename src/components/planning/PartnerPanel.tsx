import { useBudget } from '@/hooks/useBudget'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/utils/formatting'

export function PartnerPanel() {
  const { settings, taxSummary, rules } = useBudget()
  const partnerIncome = settings.partnerIncome ?? 0

  if (partnerIncome <= 0) return null

  // Approximate partner net income (simplified: no pension, no NI nuances)
  // We apply a rough effective rate based on partner income level
  let approxPartnerTax = 0
  const partnerTaxable = Math.max(0, partnerIncome - rules.personalAllowance)
  if (partnerTaxable > 0) {
    const basicBandWidth = rules.incomeTaxBands[0].to
    const basicPortion = Math.min(partnerTaxable, basicBandWidth)
    const higherPortion = Math.max(0, partnerTaxable - basicBandWidth)
    approxPartnerTax = basicPortion * rules.incomeTaxBands[0].rate
      + higherPortion * rules.incomeTaxBands[1].rate
    // Add approximate NI
    if (partnerIncome > rules.niPrimaryThreshold) {
      const niLower = Math.min(partnerIncome, rules.niUpperEarningsLimit) - rules.niPrimaryThreshold
      const niUpper = Math.max(0, partnerIncome - rules.niUpperEarningsLimit)
      approxPartnerTax += niLower * rules.niRateLower + niUpper * rules.niRateUpper
    }
  }
  const approxPartnerNet = partnerIncome - approxPartnerTax

  const combinedGross = taxSummary.grossIncome + partnerIncome
  const combinedNet = taxSummary.netIncome + approxPartnerNet

  // Marriage Allowance direction recommendation
  // Transfer is only beneficial if one partner is a non-taxpayer (income < PA) and the other is a basic-rate taxpayer
  const myAdjustedIncome = taxSummary.adjustedNetIncome + taxSummary.dividendIncome
  const iAmBasicRate = myAdjustedIncome > rules.personalAllowance && myAdjustedIncome <= rules.personalAllowance + rules.incomeTaxBands[0].to
  const partnerIsNonTaxpayer = partnerIncome < rules.personalAllowance
  const iAmNonTaxpayer = myAdjustedIncome < rules.personalAllowance
  const partnerIsBasicRate = partnerIncome > rules.personalAllowance && partnerIncome <= rules.personalAllowance + rules.incomeTaxBands[0].to

  let marriageAllowanceNote: string | null = null
  if (partnerIsNonTaxpayer && iAmBasicRate) {
    marriageAllowanceNote = 'Your partner could transfer £1,260 of their Personal Allowance to you, saving you £252/yr in tax.'
  } else if (iAmNonTaxpayer && partnerIsBasicRate) {
    marriageAllowanceNote = 'You could transfer £1,260 of your Personal Allowance to your partner, saving them £252/yr in tax.'
  }

  // Child Benefit optimal claimer: the lower earner should be the named claimant
  let childBenefitNote: string | null = null
  if (taxSummary.childBenefitAnnual > 0) {
    if (myAdjustedIncome > rules.hicbcThreshold && partnerIncome <= rules.hicbcThreshold) {
      childBenefitNote = 'Your partner has the lower income — if they are the named Child Benefit claimant, the HICBC may not apply.'
    } else if (partnerIncome > rules.hicbcThreshold && myAdjustedIncome <= rules.hicbcThreshold) {
      childBenefitNote = 'You have the lower income — if you are the named Child Benefit claimant, the HICBC may not apply to your household.'
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">Household Overview</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Combined view using partner income from Settings. Partner net income is an estimate — it excludes pension, student loan, and other adjustments.
        </p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Combined household income</CardTitle>
          <CardDescription>Partner income: {formatCurrency(partnerIncome)}/yr (set in Settings)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md bg-muted/40 px-4 py-3 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your gross income</span>
              <span className="tabular-nums">{formatCurrency(taxSummary.grossIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Partner gross income</span>
              <span className="tabular-nums">{formatCurrency(partnerIncome)}</span>
            </div>
            <div className="flex justify-between border-t pt-1.5">
              <span className="text-muted-foreground font-medium">Combined gross</span>
              <span className="font-semibold tabular-nums">{formatCurrency(combinedGross)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your net income</span>
              <span className="tabular-nums">{formatCurrency(taxSummary.netIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Partner net income (est.)</span>
              <span className="tabular-nums">{formatCurrency(approxPartnerNet)}</span>
            </div>
            <div className="flex justify-between border-t pt-1.5">
              <span className="text-muted-foreground font-medium">Combined net (est.)</span>
              <span className="font-semibold tabular-nums">{formatCurrency(combinedNet)}</span>
            </div>
          </div>

          {marriageAllowanceNote && (
            <div className="rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
              <span className="font-medium">Marriage Allowance: </span>{marriageAllowanceNote}
            </div>
          )}

          {childBenefitNote && (
            <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              <span className="font-medium">Child Benefit: </span>{childBenefitNote}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
