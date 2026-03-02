import { useMemo } from 'react'
import { useBudget } from '@/hooks/useBudget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateTax } from '@/utils/taxCalculations'
import { getAvailableTaxYears, getTaxRules } from '@/taxRules'
import { formatCurrency, formatPercent } from '@/utils/formatting'

export function TaxYearComparison() {
  const { incomeSources, gainSources, settings, rules, taxSummary } = useBudget()

  const allYears = getAvailableTaxYears()
  const currentIdx = allYears.indexOf(settings.taxYear)
  const nextYear = currentIdx >= 0 && currentIdx < allYears.length - 1
    ? allYears[currentIdx + 1]
    : null

  const nextRules = nextYear ? getTaxRules(nextYear) : null

  const nextSummary = useMemo(() => {
    if (!nextRules) return null
    return calculateTax(incomeSources, settings, nextRules, gainSources)
  }, [incomeSources, gainSources, settings, nextRules])

  if (!nextSummary || !nextRules) return null

  const rows: Array<{ label: string; current: string; next: string; highlight?: boolean }> = [
    {
      label: 'Gross income',
      current: formatCurrency(taxSummary.grossIncome),
      next: formatCurrency(nextSummary.grossIncome),
    },
    {
      label: 'Total tax',
      current: formatCurrency(taxSummary.totalTax),
      next: formatCurrency(nextSummary.totalTax),
      highlight: true,
    },
    {
      label: 'Net income',
      current: formatCurrency(taxSummary.netIncome),
      next: formatCurrency(nextSummary.netIncome),
      highlight: true,
    },
    {
      label: 'Effective rate',
      current: formatPercent(taxSummary.effectiveTaxRate),
      next: formatPercent(nextSummary.effectiveTaxRate),
    },
    {
      label: 'Distance to higher-rate',
      current: formatCurrency(Math.max(0, rules.niUpperEarningsLimit - (taxSummary.adjustedNetIncome + taxSummary.dividendIncome))),
      next: formatCurrency(Math.max(0, nextRules.niUpperEarningsLimit - (nextSummary.adjustedNetIncome + nextSummary.dividendIncome))),
    },
  ]

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">Tax Year Comparison</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          How your tax bill changes from {rules.label} to {nextRules.label} with the same income.
        </p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {rules.label} vs {nextRules.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b">
                <th className="text-left pb-2 font-medium"></th>
                <th className="text-right pb-2 font-medium">{rules.label}</th>
                <th className="text-right pb-2 font-medium">{nextRules.label}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.label} className="border-b last:border-0">
                  <td className="py-2 text-muted-foreground">{row.label}</td>
                  <td className={`py-2 text-right tabular-nums ${row.highlight ? 'font-medium' : ''}`}>
                    {row.current}
                  </td>
                  <td className={`py-2 text-right tabular-nums ${row.highlight ? 'font-medium' : ''}`}>
                    {row.next}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
