import { useState, useMemo } from 'react'
import { useBudget } from '@/hooks/useBudget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/utils/formatting'
import { cn } from '@/lib/utils'
import {
  calculateLtdScenario,
  calculateSoleTraderScenario,
  findOptimalSalary,
} from '@/utils/ltdCalculations'

function Row({ label, ltd, sole, highlight }: {
  label: string
  ltd: string
  sole: string
  highlight?: 'ltd' | 'sole'
}) {
  return (
    <div className="flex items-center py-1.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground flex-1">{label}</span>
      <span className={cn(
        'text-sm font-medium tabular-nums w-28 text-right',
        highlight === 'ltd' && 'text-emerald-600 dark:text-emerald-400',
      )}>
        {ltd}
      </span>
      <span className={cn(
        'text-sm font-medium tabular-nums w-28 text-right',
        highlight === 'sole' && 'text-emerald-600 dark:text-emerald-400',
      )}>
        {sole}
      </span>
    </div>
  )
}

export function LtdVsSoleTraderPanel() {
  const { incomeSources, settings, rules } = useBudget()

  // Default profit: self-employment gross, or total gross income
  const defaultProfit = useMemo(() => {
    const seGross = incomeSources
      .filter(s => s.type === 'self-employment')
      .reduce((sum, s) => sum + s.grossAmount, 0)
    if (seGross > 0) return seGross
    return incomeSources.reduce((sum, s) => sum + s.grossAmount, 0)
  }, [incomeSources])

  const [profit, setProfit] = useState(defaultProfit)
  const [profitInput, setProfitInput] = useState(String(defaultProfit || ''))

  const optimalSalary = useMemo(
    () => findOptimalSalary(profit, settings, rules),
    [profit, settings, rules],
  )
  const [salary, setSalary] = useState(optimalSalary)

  const ltdResult = useMemo(
    () => calculateLtdScenario(profit, salary, settings, rules),
    [profit, salary, settings, rules],
  )

  const soleResult = useMemo(
    () => calculateSoleTraderScenario(profit, settings, rules),
    [profit, settings, rules],
  )

  const ltdSaves = ltdResult.netTakeHome - soleResult.netTakeHome
  const ltdIsBetter = ltdSaves > 0

  const maxSalary = Math.min(profit, 50_000)

  if (incomeSources.length === 0) return null

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">Limited Company vs Sole Trader</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Compare net take-home under each business structure for the same profit.
        </p>
      </div>

      {/* Inputs */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          {/* Profit */}
          <div className="grid gap-1.5 max-w-xs">
            <Label htmlFor="ltd-profit">Annual Profit / Turnover (£)</Label>
            <Input
              id="ltd-profit"
              type="number"
              min="0"
              step="1000"
              value={profitInput}
              onChange={e => {
                setProfitInput(e.target.value)
                const val = parseFloat(e.target.value) || 0
                setProfit(val)
                setSalary(findOptimalSalary(val, settings, rules))
              }}
            />
          </div>

          {/* Salary slider (Ltd Co only) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Director salary (Ltd Co)</label>
              <span className="text-sm font-medium tabular-nums">{formatCurrency(salary)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={maxSalary}
              step={100}
              value={Math.min(salary, maxSalary)}
              onChange={e => setSalary(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>£0</span>
              <button
                onClick={() => setSalary(optimalSalary)}
                className="text-xs text-emerald-600 dark:text-emerald-400 underline underline-offset-2"
              >
                Optimal: {formatCurrency(optimalSalary)}
              </button>
              <span>{formatCurrency(maxSalary)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex">
            <CardTitle className="text-sm flex-1">Metric</CardTitle>
            <span className="text-sm font-semibold w-28 text-right">Ltd Co</span>
            <span className="text-sm font-semibold w-28 text-right">Sole Trader</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Row
            label="Gross Profit"
            ltd={formatCurrency(profit)}
            sole={formatCurrency(profit)}
          />
          <Row
            label="Corp / SE Income Tax"
            ltd={formatCurrency(ltdResult.corpTax + ltdResult.salaryIncomeTax)}
            sole={formatCurrency(soleResult.incomeTax)}
          />
          <Row
            label="National Insurance"
            ltd={formatCurrency(ltdResult.employerNI + ltdResult.employeeNI)}
            sole={formatCurrency(soleResult.class4NI + soleResult.class2NI)}
          />
          <Row
            label="Dividend Tax"
            ltd={formatCurrency(ltdResult.dividendTax)}
            sole="—"
          />
          <Row
            label="Total Tax & NI"
            ltd={formatCurrency(ltdResult.totalTax)}
            sole={formatCurrency(soleResult.totalTax)}
          />
          <Row
            label="Net Take-Home"
            ltd={formatCurrency(ltdResult.netTakeHome)}
            sole={formatCurrency(soleResult.netTakeHome)}
            highlight={ltdIsBetter ? 'ltd' : 'sole'}
          />
        </CardContent>
      </Card>

      {/* Winner banner */}
      <div className={cn(
        'rounded-lg px-4 py-3 text-sm font-medium',
        ltdIsBetter
          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
          : 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      )}>
        {ltdIsBetter
          ? `Ltd Co saves you ${formatCurrency(Math.abs(ltdSaves))} vs sole trader at this profit level.`
          : ltdSaves < 0
            ? `Sole trader saves you ${formatCurrency(Math.abs(ltdSaves))} vs Ltd Co at this profit level.`
            : 'Both structures give the same net take-home at this profit level.'}
      </div>

      {/* Caveat */}
      <p className="text-xs text-muted-foreground">
        Note: Ltd Co typically involves accountancy costs of ~£1,000–£2,000/yr (not included above), plus additional admin. Pension contributions and gift aid are excluded for a clean comparison.
      </p>
    </div>
  )
}
