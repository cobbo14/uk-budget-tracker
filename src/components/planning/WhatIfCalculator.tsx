import { useState, useMemo } from 'react'
import { useBudget } from '@/hooks/useBudget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/utils/formatting'
import { computeWhatIf } from '@/utils/planningUtils'
import { cn } from '@/lib/utils'
import type { AppSettings } from '@/types'

function CompareRow({ label, current, scenario }: {
  label: string
  current: string
  scenario: string
}) {
  const changed = current !== scenario
  return (
    <div className="flex items-center py-1.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground flex-1">{label}</span>
      <span className="text-sm font-medium tabular-nums w-28 text-right">{current}</span>
      <span className={cn(
        'text-sm font-medium tabular-nums w-28 text-right',
        changed && 'text-emerald-600 dark:text-emerald-400',
      )}>
        {scenario}
      </span>
    </div>
  )
}

export function WhatIfCalculator() {
  const { taxSummary, incomeSources, settings, rules, totalAnnualExpenses } = useBudget()

  const [incomeAdjustment, setIncomeAdjustment] = useState(0)
  const [pensionType, setPensionType] = useState<AppSettings['pensionContributionType']>(settings.pensionContributionType)
  const [pensionValue, setPensionValue] = useState(settings.pensionContributionValue)
  const [scottish, setScottish] = useState(settings.scottishTaxpayer)

  const scenario = useMemo(
    () => computeWhatIf(
      incomeSources, settings, rules, totalAnnualExpenses,
      incomeAdjustment, pensionType, pensionValue, scottish,
    ),
    [incomeSources, settings, rules, totalAnnualExpenses,
     incomeAdjustment, pensionType, pensionValue, scottish],
  )

  if (taxSummary.grossIncome === 0) return null

  const scenarioLeftover = scenario.leftoverIncome

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">What-If Calculator</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Adjust values below to see the impact on your tax and take-home pay.
        </p>
      </div>

      {/* Inputs */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          {/* Income adjustment */}
          <div>
            <label htmlFor="whatif-income-adj" className="text-sm font-medium">Income adjustment</label>
            <p className="text-xs text-muted-foreground mb-1">Applied across your employment income</p>
            <div className="flex items-center gap-3">
              <input
                id="whatif-income-adj"
                type="range"
                min={-50000}
                max={100000}
                step={1000}
                value={incomeAdjustment}
                onChange={e => setIncomeAdjustment(Number(e.target.value))}
                className="flex-1 accent-emerald-600"
              />
              <span className={cn(
                'text-sm font-medium tabular-nums w-24 text-right',
                incomeAdjustment > 0 && 'text-emerald-600 dark:text-emerald-400',
                incomeAdjustment < 0 && 'text-red-600 dark:text-red-400',
              )}>
                {incomeAdjustment >= 0 ? '+' : ''}{formatCurrency(incomeAdjustment)}
              </span>
            </div>
          </div>

          {/* Pension */}
          <div>
            <label className="text-sm font-medium">Pension contribution</label>
            <div className="flex gap-2 mt-1">
              <select
                value={pensionType}
                onChange={e => {
                  const t = e.target.value as AppSettings['pensionContributionType']
                  setPensionType(t)
                  if (t === 'none') setPensionValue(0)
                }}
                className="text-sm border rounded-md px-2 py-1 bg-background"
              >
                <option value="none">None</option>
                <option value="percentage">%</option>
                <option value="flat">£ flat</option>
              </select>
              {pensionType !== 'none' && (
                <input
                  type="number"
                  min={0}
                  max={pensionType === 'percentage' ? 100 : 200000}
                  step={pensionType === 'percentage' ? 0.5 : 100}
                  value={pensionValue}
                  onChange={e => setPensionValue(Number(e.target.value))}
                  className="text-sm border rounded-md px-2 py-1 bg-background w-24"
                />
              )}
            </div>
          </div>

          {/* Scottish taxpayer */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Scottish taxpayer</span>
            <button
              role="switch"
              aria-checked={scottish}
              aria-label="Scottish taxpayer"
              onClick={() => setScottish(s => !s)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                scottish ? 'bg-emerald-600' : 'bg-muted',
              )}
            >
              <span className={cn(
                'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                scottish ? 'translate-x-6' : 'translate-x-1',
              )} />
            </button>
          </div>

          {/* Reset */}
          <button
            onClick={() => {
              setIncomeAdjustment(0)
              setPensionType(settings.pensionContributionType)
              setPensionValue(settings.pensionContributionValue)
              setScottish(settings.scottishTaxpayer)
            }}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            Reset to current settings
          </button>
        </CardContent>
      </Card>

      {/* Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex">
            <CardTitle className="text-sm flex-1">Metric</CardTitle>
            <span className="text-sm font-semibold w-28 text-right">Current</span>
            <span className="text-sm font-semibold w-28 text-right text-emerald-600 dark:text-emerald-400">Scenario</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CompareRow
            label="Gross Income"
            current={formatCurrency(taxSummary.grossIncome)}
            scenario={formatCurrency(scenario.taxSummary.grossIncome)}
          />
          <CompareRow
            label="Total Tax"
            current={formatCurrency(taxSummary.totalTax)}
            scenario={formatCurrency(scenario.taxSummary.totalTax)}
          />
          <CompareRow
            label="Net Income"
            current={formatCurrency(taxSummary.netIncome)}
            scenario={formatCurrency(scenario.taxSummary.netIncome)}
          />
          <CompareRow
            label="Monthly Take-Home"
            current={formatCurrency(taxSummary.netIncome / 12)}
            scenario={formatCurrency(scenario.taxSummary.netIncome / 12)}
          />
          <CompareRow
            label="Effective Rate"
            current={formatPercent(taxSummary.effectiveTaxRate)}
            scenario={formatPercent(scenario.taxSummary.effectiveTaxRate)}
          />
          <CompareRow
            label="Leftover (after expenses)"
            current={formatCurrency(taxSummary.netIncome - totalAnnualExpenses)}
            scenario={formatCurrency(scenarioLeftover)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
