import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useBudget } from '@/hooks/useBudget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/utils/formatting'
import { cn } from '@/lib/utils'

type Tab = 'income' | 'tax' | 'budget'

const INCOME_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f43f5e', '#a855f7']
const TAX_COLORS    = ['#ef4444', '#f97316', '#ec4899', '#14b8a6', '#6366f1', '#eab308']
const BUDGET_COLORS = ['#ef4444', '#f59e0b', '#10b981']

interface ChartEntry { name: string; value: number }

function DonutLegend({ data, colors, total }: { data: ChartEntry[]; colors: string[]; total: number }) {
  return (
    <div className="flex flex-col justify-center gap-1.5 min-w-0">
      {data.map((entry, i) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs min-w-0">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: colors[i % colors.length] }}
          />
          <span className="text-muted-foreground truncate flex-1">{entry.name}</span>
          <span className="font-medium tabular-nums shrink-0">{formatCurrency(entry.value)}</span>
          <span className="text-muted-foreground tabular-nums shrink-0 w-10 text-right">
            {formatPercent(total > 0 ? entry.value / total : 0)}
          </span>
        </div>
      ))}
    </div>
  )
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-muted-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export const IncomeAndTaxCharts = memo(function IncomeAndTaxCharts({ showMonthly }: { showMonthly: boolean }) {
  const { taxSummary: t, totalAnnualExpenses, leftoverIncome } = useBudget()
  const [activeTab, setActiveTab] = useState<Tab>('budget')
  const [isSmall, setIsSmall] = useState(() => window.matchMedia('(max-width: 639px)').matches)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 639px)')
    const handler = (e: MediaQueryListEvent) => setIsSmall(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  const v = useCallback((amount: number) => showMonthly ? amount / 12 : amount, [showMonthly])

  const incomeData = useMemo<ChartEntry[]>(() => [
    { name: 'Employment', value: v(t.employmentGross) },
    { name: 'Self-Employment', value: v(t.selfEmploymentGross) },
    { name: 'Rental', value: v(t.rentalGross) },
    { name: 'Pension', value: v(t.pensionIncomeGross) },
    { name: 'Dividends', value: v(t.dividendGross) },
    { name: 'Savings Interest', value: v(t.savingsIncome) },
    { name: 'Bond Gains', value: v(t.bondIncome) },
    { name: 'Child Benefit', value: v(t.childBenefitAnnual) },
  ].filter(d => d.value > 0), [v, t.employmentGross, t.selfEmploymentGross, t.rentalGross, t.pensionIncomeGross, t.dividendGross, t.savingsIncome, t.bondIncome, t.childBenefitAnnual])

  const taxData = useMemo<ChartEntry[]>(() => [
    { name: 'Income Tax', value: v(t.incomeTax) },
    { name: 'National Insurance', value: v(t.class1NI + t.class4NI) },
    { name: 'Dividend Tax', value: v(t.dividendTax) },
    { name: 'Capital Gains Tax', value: v(t.capitalGainsTax) },
    { name: 'Student Loan', value: v(t.studentLoan + t.postgradLoanRepayment) },
    { name: 'Child Benefit Charge', value: v(t.hicbc) },
    { name: 'Pension AA Charge', value: v(t.annualAllowanceCharge) },
  ].filter(d => d.value > 0), [v, t.incomeTax, t.class1NI, t.class4NI, t.dividendTax, t.capitalGainsTax, t.studentLoan, t.postgradLoanRepayment, t.hicbc, t.annualAllowanceCharge])

  const budgetData = useMemo<ChartEntry[]>(() => [
    { name: 'Tax & Deductions', value: v(t.totalTax) },
    { name: 'Expenses', value: v(totalAnnualExpenses) },
    { name: 'Leftover', value: Math.max(0, v(leftoverIncome)) },
  ].filter(d => d.value > 0), [v, t.totalTax, totalAnnualExpenses, leftoverIncome])

  const tabData: Record<Tab, { data: ChartEntry[]; colors: string[]; emptyMsg: string }> = {
    income: { data: incomeData, colors: INCOME_COLORS, emptyMsg: 'Add income sources to see a breakdown.' },
    tax:    { data: taxData,    colors: TAX_COLORS,    emptyMsg: 'No tax to display.' },
    budget: { data: budgetData, colors: BUDGET_COLORS, emptyMsg: 'Add income and expenses to see your budget split.' },
  }

  const { data, colors, emptyMsg } = tabData[activeTab]
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Breakdown</CardTitle>
          <div className="flex items-center gap-1 rounded-lg border p-1 text-sm">
            {(['income', 'tax', 'budget'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-md px-3 py-1 capitalize transition-colors',
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{emptyMsg}</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-[130px] w-[130px] sm:h-[160px] sm:w-[160px] shrink-0 mx-auto sm:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={isSmall ? 38 : 50}
                    outerRadius={isSmall ? 60 : 75}
                    dataKey="value"
                    strokeWidth={2}
                  >
                    {data.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0">
              <DonutLegend data={data} colors={colors} total={total} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})
