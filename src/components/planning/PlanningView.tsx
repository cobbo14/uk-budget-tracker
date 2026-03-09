import { useBudget } from '@/hooks/useBudget'
import { Button } from '@/components/ui/button'
import { ThresholdWarnings } from './ThresholdWarnings'
import { PensionOptimiser } from './PensionOptimiser'
import { AnnualAllowancePanel } from './AnnualAllowancePanel'

import { WhatIfCalculator } from './WhatIfCalculator'
import { TaxYearComparison } from './TaxYearComparison'
import { PayslipReconciliation } from './PayslipReconciliation'
import { PartnerPanel } from './PartnerPanel'
import { PensionProjection } from './PensionProjection'
import { PaymentsOnAccount } from './PaymentsOnAccount'

export function PlanningView() {
  const { incomeSources } = useBudget()
  const hasData = incomeSources.length > 0

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Planning</h2>

      {!hasData && (
        <div className="rounded-xl border-2 border-dashed p-8">
          <p className="font-medium">Planning tools unlock when you add income</p>
          <p className="text-sm text-muted-foreground mt-1">Once you add income sources, you'll get access to:</p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            <li>• Threshold warnings (Personal Allowance, Higher Rate, HICBC)</li>
            <li>• Pension Annual Allowance check with carry-forward</li>
            <li>• Pension Optimiser — see tax saved at different contribution levels</li>
            <li>• Pension pot projection — compound growth to retirement with withdrawal tax</li>
            <li>• Tax year comparison — see how next year's rules affect your bill</li>
            <li>• Payslip reconciliation — compare calculated vs actual take-home</li>
            <li>• Payments on Account — estimated Self Assessment advance payments</li>
            <li>• Household overview — combined income with partner</li>
            <li>• What-If Calculator — model income adjustments</li>
          </ul>
          <Button className="mt-4" onClick={() => { window.location.hash = 'income' }}>
            Add income to unlock →
          </Button>
        </div>
      )}

      {hasData && (
        <>
          <ThresholdWarnings />
          <div data-search="payments-on-account"><PaymentsOnAccount /></div>
          <div data-search="annual-allowance"><AnnualAllowancePanel /></div>
          <PensionOptimiser />
          <div data-search="pension-projection"><PensionProjection /></div>
          <div data-search="tax-year-comparison"><TaxYearComparison /></div>
          <div data-search="payslip-reconciliation"><PayslipReconciliation /></div>
          <div data-search="partner-panel"><PartnerPanel /></div>
          <div data-search="what-if"><WhatIfCalculator /></div>
        </>
      )}
    </div>
  )
}
