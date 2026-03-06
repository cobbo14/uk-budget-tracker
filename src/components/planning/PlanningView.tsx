import { useBudget } from '@/hooks/useBudget'
import { Button } from '@/components/ui/button'
import { ThresholdWarnings } from './ThresholdWarnings'
import { PensionOptimiser } from './PensionOptimiser'
import { AnnualAllowancePanel } from './AnnualAllowancePanel'
import { PaymentsOnAccount } from './PaymentsOnAccount'
import { WhatIfCalculator } from './WhatIfCalculator'
import { TaxYearComparison } from './TaxYearComparison'
import { PayslipReconciliation } from './PayslipReconciliation'
import { PartnerPanel } from './PartnerPanel'

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
            <li>• Tax year comparison — see how next year's rules affect your bill</li>
            <li>• Payslip reconciliation — compare calculated vs actual take-home</li>
            <li>• Household overview — combined income with partner</li>
            <li>• Payments on Account calculator</li>
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
          <AnnualAllowancePanel />
          <PensionOptimiser />
          <TaxYearComparison />
          <PayslipReconciliation />
          <PartnerPanel />
          <PaymentsOnAccount />
          <WhatIfCalculator />
        </>
      )}
    </div>
  )
}
