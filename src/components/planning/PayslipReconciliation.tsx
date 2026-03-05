import { useState } from 'react'
import { useBudget } from '@/hooks/useBudget'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/utils/formatting'

export function PayslipReconciliation() {
  const { taxSummary, settings } = useBudget()
  const [payslipNet, setPayslipNet] = useState('')

  if (taxSummary.grossIncome <= 0) return null

  const calculatedMonthly = taxSummary.netIncome / 12
  const payslipValue = parseFloat(payslipNet)
  const hasPayslip = !isNaN(payslipValue) && payslipValue > 0
  const diff = hasPayslip ? payslipValue - calculatedMonthly : null

  const reasons = [
    {
      show: taxSummary.salarySacrificeTotal > 0,
      text: `Salary sacrifice (${formatCurrency(taxSummary.salarySacrificeTotal)}/yr) is deducted via payroll before PAYE — may not appear separately on payslip.`,
    },
    {
      show: taxSummary.bikTotal > 0,
      text: `Benefits in Kind (${formatCurrency(taxSummary.bikTotal)}/yr P11D value) increase your tax code adjustment — the tax collection timing differs from Self Assessment.`,
    },
    {
      show: (settings.taxCode ?? '') !== '',
      text: `Non-standard tax code "${settings.taxCode}" may reflect adjustments HMRC has made (e.g. underpaid tax from prior years, benefits in kind, or other income).`,
    },
    {
      show: taxSummary.studentLoan > 0,
      text: `Student loan repayments (${formatCurrency(taxSummary.studentLoan)}/yr) are collected via PAYE using your plan's threshold — timing and amounts may differ from Self Assessment calculations.`,
    },
    {
      show: taxSummary.postgradLoanRepayment > 0,
      text: `Postgraduate loan repayments (${formatCurrency(taxSummary.postgradLoanRepayment)}/yr) are deducted via payroll.`,
    },
    {
      show: true,
      text: 'This tool calculates annual tax and divides by 12. Actual payslips may vary month-to-month due to irregular income, backdated pay, or one-off adjustments.',
    },
  ].filter(r => r.show)

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">Payslip Reconciliation</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Compare your calculated take-home with your actual payslip to understand the difference.
        </p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Monthly net pay check</CardTitle>
          <CardDescription>Enter the net pay from your latest payslip.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1.5 max-w-xs">
            <Label htmlFor="payslip-net">Monthly net pay from payslip (£)</Label>
            <Input
              id="payslip-net"
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 2500"
              value={payslipNet}
              onChange={e => setPayslipNet(e.target.value)}
            />
          </div>

          <div className="rounded-md bg-muted/40 px-4 py-3 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Calculated monthly net</span>
              <span className="font-medium tabular-nums">{formatCurrency(calculatedMonthly)}</span>
            </div>
            {hasPayslip && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payslip monthly net</span>
                  <span className="font-medium tabular-nums">{formatCurrency(payslipValue)}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5">
                  <span className="text-muted-foreground">Difference</span>
                  <span className={`font-semibold tabular-nums ${(diff ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                    {(diff ?? 0) >= 0 ? '+' : ''}{formatCurrency(diff ?? 0)}
                  </span>
                </div>
              </>
            )}
          </div>

          {hasPayslip && Math.abs(diff ?? 0) > 10 && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Common reasons for the difference:</p>
              <ul className="space-y-1.5">
                {reasons.map((r, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-muted-foreground/50 shrink-0">•</span>
                    <span>{r.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
