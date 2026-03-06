import { useBudget } from '@/hooks/useBudget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent } from '@/utils/formatting'
import { cn } from '@/lib/utils'
import { PoundSterling, BookOpen, CalendarClock } from 'lucide-react'
import { IncomeAndTaxCharts } from './IncomeAndTaxCharts'
import { UPDATE_SETTINGS } from '@/store/actions'
import { isRenewalSoon, effectiveAnnual } from '@/store/selectors'
import type { ISAContributions } from '@/types'

function HeadlineCard({ label, monthly, annual, description, color, showMonthly }: {
  label: string
  monthly: number
  annual: number
  description?: string
  color?: string
  showMonthly: boolean
}) {
  const primary = showMonthly ? monthly : annual
  const secondary = showMonthly ? annual : monthly
  const primarySuffix = showMonthly ? '/mo' : '/yr'
  const secondaryLabel = showMonthly ? 'annual' : 'monthly'

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn('text-2xl font-bold mt-1', color)}>
          {formatCurrency(primary)}
          <span className="text-sm font-normal text-muted-foreground">{primarySuffix}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatCurrency(secondary)} {secondaryLabel}{description ? ` · ${description}` : ''}
        </p>
      </CardContent>
    </Card>
  )
}

function Row({ label, value, indent, bold, highlight }: {
  label: string
  value: string
  indent?: boolean
  bold?: boolean
  highlight?: 'green' | 'red'
}) {
  return (
    <div className={cn('flex justify-between py-1.5', indent && 'pl-4')}>
      <span className={cn('text-sm text-muted-foreground', bold && 'text-foreground font-medium')}>
        {label}
      </span>
      <span className={cn(
        'text-sm font-medium tabular-nums',
        highlight === 'green' && 'text-emerald-600 dark:text-emerald-400',
        highlight === 'red' && 'text-red-600 dark:text-red-400',
      )}>
        {value}
      </span>
    </div>
  )
}

function TwoColRow({ label, annual, monthly, bold, highlight }: {
  label: string
  annual: number
  monthly: number
  bold?: boolean
  highlight?: 'green' | 'red'
}) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className={cn('text-sm text-muted-foreground', bold && 'text-foreground font-medium')}>
        {label}
      </span>
      <div className={cn(
        'flex gap-3 sm:gap-8 text-sm font-medium tabular-nums',
        highlight === 'green' && 'text-emerald-600 dark:text-emerald-400',
        highlight === 'red' && 'text-red-600 dark:text-red-400',
      )}>
        <span>{formatCurrency(annual)}</span>
        <span>{formatCurrency(monthly)}</span>
      </div>
    </div>
  )
}

const ISA_ANNUAL_LIMIT = 20_000
const LISA_ANNUAL_MAX = 4_000

interface SummaryViewProps {
  showMonthly: boolean
  onShowMonthlyChange: (v: boolean) => void
}

export function SummaryView({ showMonthly, onShowMonthlyChange }: SummaryViewProps) {
  const { taxSummary, totalAnnualExpenses, leftoverIncome, incomeSources, expenses, settings, rules, dispatch } = useBudget()
  const t = taxSummary
  const hasData = incomeSources.length > 0
  const v = (amount: number) => showMonthly ? amount / 12 : amount

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Summary</h2>
        <div className="flex items-center gap-1 rounded-lg border p-1 text-sm">
          <button
            onClick={() => onShowMonthlyChange(true)}
            className={cn('rounded-md px-3 py-1 transition-colors', showMonthly ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
          >
            Monthly
          </button>
          <button
            onClick={() => onShowMonthlyChange(false)}
            className={cn('rounded-md px-3 py-1 transition-colors', !showMonthly ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
          >
            Annual
          </button>
        </div>
      </div>

      {/* Headline cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <HeadlineCard
          label="Gross Income"
          monthly={t.grossIncome / 12}
          annual={t.grossIncome}
          description="before tax"
          showMonthly={showMonthly}
        />
        <HeadlineCard
          label="Total Tax"
          monthly={t.totalTax / 12}
          annual={t.totalTax}
          description={`${formatPercent(t.effectiveTaxRate)} effective`}
          showMonthly={showMonthly}
        />
        <HeadlineCard
          label="Net Income"
          monthly={t.netIncome / 12}
          annual={t.netIncome}
          description="after tax"
          color="text-emerald-600 dark:text-emerald-400"
          showMonthly={showMonthly}
        />
        <HeadlineCard
          label="Leftover"
          monthly={leftoverIncome / 12}
          annual={leftoverIncome}
          description="after expenses"
          color={leftoverIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
          showMonthly={showMonthly}
        />
      </div>

      {hasData && (
        <>
          {/* Income → Net bar */}
          <BudgetBar netIncome={t.netIncome} totalExpenses={totalAnnualExpenses} />

          {/* Visual breakdown charts */}
          <IncomeAndTaxCharts showMonthly={showMonthly} />

          {/* Tax breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tax Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {t.employmentGross > 0 && (
                <Row label="Employment gross" value={formatCurrency(v(t.employmentGross))} />
              )}
              {t.bikTotal > 0 && (
                <Row label="Benefits in Kind (P11D)" value={`+${formatCurrency(v(t.bikTotal))}`} indent />
              )}
              {t.selfEmploymentGross > 0 && (
                <>
                  <Row label="Self-employment gross" value={formatCurrency(v(t.selfEmploymentGross))} />
                  {t.selfEmploymentAllowableExpenses > 0 && (
                    <Row label="Allowable business expenses" value={`−${formatCurrency(v(t.selfEmploymentAllowableExpenses))}`} indent />
                  )}
                </>
              )}
              {t.rentalGross > 0 && (
                <>
                  <Row label="Rental gross" value={formatCurrency(v(t.rentalGross))} />
                  {t.rentalAllowableExpenses > 0 && (
                    <Row label="Rental expenses" value={`−${formatCurrency(v(t.rentalAllowableExpenses))}`} indent />
                  )}
                </>
              )}
              {t.savingsIncome > 0 && (
                <>
                  <Row label="Savings / Interest income" value={formatCurrency(v(t.savingsIncome))} />
                  {t.savingsAllowanceApplied > 0 && (
                    <Row label="Personal Savings Allowance" value={`−${formatCurrency(v(t.savingsAllowanceApplied))}`} indent />
                  )}
                </>
              )}
              {t.dividendGross > 0 && (
                <Row label="Dividend income" value={formatCurrency(v(t.dividendGross))} />
              )}

              {t.totalDeductions > 0 && (
                <>
                  <Separator className="my-2" />
                  <Row label="Pension contributions" value={`−${formatCurrency(v(t.totalDeductions))}`} />
                </>
              )}

              <Separator className="my-2" />
              <Row label="Personal allowance (effective)" value={`−${formatCurrency(v(t.effectivePersonalAllowance))}`} />
              {t.blindPersonsAllowanceApplied > 0 && (
                <Row label="incl. Blind Person's Allowance" value={`+${formatCurrency(v(t.blindPersonsAllowanceApplied))}`} indent />
              )}
              <Row label="Taxable income (non-dividend)" value={formatCurrency(v(t.taxableNonDividendIncome))} bold />

              <Separator className="my-2" />
              <Row label="Income Tax" value={formatCurrency(v(t.incomeTax))} highlight="red" />
              {t.class1NI > 0 && <Row label="National Insurance (Class 1)" value={formatCurrency(v(t.class1NI))} highlight="red" indent />}
              {t.class2NI > 0 && <Row label="National Insurance (Class 2)" value={formatCurrency(v(t.class2NI))} highlight="red" indent />}
              {t.class4NI > 0 && <Row label="National Insurance (Class 4)" value={formatCurrency(v(t.class4NI))} highlight="red" indent />}
              {t.dividendTax > 0 && <Row label="Dividend Tax" value={formatCurrency(v(t.dividendTax))} highlight="red" />}
              {t.mortgageTaxCredit > 0 && (
                <Row label="Mortgage Interest Tax Credit" value={`−${formatCurrency(v(t.mortgageTaxCredit))}`} highlight="green" />
              )}
              {t.studentLoan > 0 && <Row label="Student Loan Repayment" value={formatCurrency(v(t.studentLoan))} highlight="red" />}
              {(t.seisRelief > 0 || t.eisRelief > 0 || t.vctRelief > 0) && (
                <>
                  {t.seisRelief > 0 && <Row label="SEIS Relief (50%)" value={`−${formatCurrency(v(t.seisRelief))}`} highlight="green" indent />}
                  {t.eisRelief > 0 && <Row label="EIS Relief (30%)" value={`−${formatCurrency(v(t.eisRelief))}`} highlight="green" indent />}
                  {t.vctRelief > 0 && <Row label="VCT Relief (30%)" value={`−${formatCurrency(v(t.vctRelief))}`} highlight="green" indent />}
                </>
              )}
              {t.hicbc > 0 && (
                <>
                  <Row label="Child Benefit received" value={formatCurrency(v(t.childBenefitAnnual))} highlight="green" />
                  <Row
                    label={`HICBC charge${t.hicbcMarginalRate > 0 ? ` (+${formatPercent(t.hicbcMarginalRate)} marginal)` : ''}`}
                    value={formatCurrency(v(t.hicbc))}
                    highlight="red"
                    indent
                  />
                </>
              )}
              {t.childBenefitAnnual > 0 && t.hicbc === 0 && (
                <Row label="Child Benefit received" value={formatCurrency(v(t.childBenefitAnnual))} highlight="green" />
              )}
              {t.annualAllowanceCharge > 0 && (
                <Row label="Pension AA Charge" value={formatCurrency(v(t.annualAllowanceCharge))} highlight="red" />
              )}

              <Separator className="my-2" />
              <Row label="Total Tax &amp; Deductions" value={formatCurrency(v(t.totalTax))} bold highlight="red" />
              <Row label="Net Income" value={formatCurrency(v(t.netIncome))} bold highlight="green" />
            </CardContent>
          </Card>

          {/* Expenses summary */}
          {expenses.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Budget Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-x-4 text-xs text-muted-foreground font-medium mb-1 px-0">
                  <span></span>
                  <div className="flex justify-end gap-3 sm:gap-8 pr-0">
                    <span>Annual</span>
                    <span>Monthly</span>
                  </div>
                </div>
                <TwoColRow label="Net income (after tax)" annual={t.netIncome} monthly={t.netIncome / 12} highlight="green" />
                <TwoColRow label="Total expenses" annual={-totalAnnualExpenses} monthly={-totalAnnualExpenses / 12} highlight="red" />
                <Separator className="my-2" />
                <TwoColRow
                  label="Leftover income"
                  annual={leftoverIncome}
                  monthly={leftoverIncome / 12}
                  bold
                  highlight={leftoverIncome >= 0 ? 'green' : 'red'}
                />
              </CardContent>
            </Card>
          )}

          {/* Upcoming renewals */}
          {(() => {
            const upcoming = expenses.filter(e => isRenewalSoon(e))
            if (upcoming.length === 0) return null
            return (
              <Card className="border-amber-300 dark:border-amber-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    Upcoming Renewals
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {upcoming.map(e => {
                    const annual = effectiveAnnual(e)
                    const formatted = new Date(e.renewalDate! + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    return (
                      <div key={e.id} className="flex items-center justify-between py-1.5">
                        <div>
                          <span className="text-sm font-medium">{e.name}</span>
                          <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">Renews {formatted}</span>
                        </div>
                        <span className="text-sm font-medium tabular-nums">
                          {formatCurrency(showMonthly ? annual / 12 : annual)}
                          <span className="text-xs text-muted-foreground">{showMonthly ? '/mo' : '/yr'}</span>
                        </span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })()}
        </>
      )}

      {!hasData && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 sm:p-12 text-center">
          <PoundSterling className="h-10 w-10 mb-4 text-muted-foreground" />
          <p className="font-medium">Get started with your tax summary</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your income sources to see your personalised tax breakdown, ISA tracker, and budget overview.</p>
          <Button className="mt-4" onClick={() => { window.location.hash = 'income' }}>
            Add your first income source →
          </Button>
        </div>
      )}

      {/* ISA Allowance Tracker — always visible so users know where to enter contributions */}
      {(() => {
        const isa = settings.isaContributions ?? { cashISA: 0, stocksAndSharesISA: 0, lisaISA: 0, innovativeFinanceISA: 0 }
        const total = (isa.cashISA ?? 0) + (isa.stocksAndSharesISA ?? 0) + (isa.lisaISA ?? 0) + (isa.innovativeFinanceISA ?? 0)
        const remaining = ISA_ANNUAL_LIMIT - total
        const overLimit = total > ISA_ANNUAL_LIMIT
        const lisaOverLimit = (isa.lisaISA ?? 0) > LISA_ANNUAL_MAX
        const usedPct = Math.min(100, (total / ISA_ANNUAL_LIMIT) * 100)

        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ISA Allowance {rules.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {total > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Used: {formatCurrency(total)}</span>
                    <span>{overLimit ? <span className="text-destructive">Over by {formatCurrency(total - ISA_ANNUAL_LIMIT)}</span> : `${formatCurrency(remaining)} remaining`}</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden bg-muted">
                    <div
                      className={cn('h-full transition-all', overLimit ? 'bg-red-500' : usedPct >= 90 ? 'bg-amber-400' : 'bg-emerald-500')}
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>£0</span>
                    <span>£{ISA_ANNUAL_LIMIT.toLocaleString()}</span>
                  </div>
                </div>
              )}
              {(['cashISA', 'stocksAndSharesISA', 'lisaISA', 'innovativeFinanceISA'] as (keyof ISAContributions)[]).map(key => {
                const labels: Record<keyof ISAContributions, string> = {
                  cashISA: 'Cash ISA (£)',
                  stocksAndSharesISA: 'Stocks & Shares ISA (£)',
                  lisaISA: 'Lifetime ISA — LISA (£, max £4,000)',
                  innovativeFinanceISA: 'Innovative Finance ISA (£)',
                }
                return (
                  <div key={key} className="grid gap-1.5 w-full max-w-xs">
                    <Label htmlFor={`isa-${key}`}>{labels[key]}</Label>
                    <Input
                      id={`isa-${key}`}
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={(settings.isaContributions?.[key] ?? 0) || ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0
                        const capped = key === 'lisaISA' ? Math.min(val, 4000) : val
                        dispatch({
                          type: UPDATE_SETTINGS,
                          payload: {
                            isaContributions: {
                              ...(settings.isaContributions ?? { cashISA: 0, stocksAndSharesISA: 0, lisaISA: 0, innovativeFinanceISA: 0 }),
                              [key]: capped,
                            },
                          },
                        })
                      }}
                    />
                  </div>
                )
              })}
              {lisaOverLimit && (
                <p className="text-xs text-destructive">LISA exceeds the £{LISA_ANNUAL_MAX.toLocaleString()} annual sub-limit.</p>
              )}
            </CardContent>
          </Card>
        )
      })()}

      {/* Tax Guides */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium">Tax Guides</span>
          </div>
          <p className="text-sm text-muted-foreground">
            <a href="#guide/uk-income-tax-rates" className="text-emerald-600 font-medium hover:underline">Income Tax</a>
            {' · '}
            <a href="#guide/salary-sacrifice-guide" className="text-emerald-600 font-medium hover:underline">Salary Sacrifice</a>
            {' · '}
            <a href="#guide/reduce-tax-above-100k" className="text-emerald-600 font-medium hover:underline">£100k Trap</a>
            {' · '}
            <a href="#guide/capital-gains-tax-guide" className="text-emerald-600 font-medium hover:underline">CGT</a>
            {' · '}
            <a href="#guide/student-loan-guide" className="text-emerald-600 font-medium hover:underline">Student Loans</a>
            {' · '}
            <a href="#guide/isa-guide" className="text-emerald-600 font-medium hover:underline">ISAs</a>
            {' · '}
            <a href="#guide/dividend-tax-guide" className="text-emerald-600 font-medium hover:underline">Dividends</a>
            {' · '}
            <a href="#guide" className="text-emerald-600 font-medium hover:underline">All guides &rarr;</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function BudgetBar({ netIncome, totalExpenses }: { netIncome: number; totalExpenses: number }) {
  if (netIncome <= 0) return null
  const expensePct = Math.min(100, totalExpenses > 0 ? (totalExpenses / netIncome) * 100 : 0)
  const leftoverPct = 100 - expensePct
  const isOverspent = totalExpenses > netIncome

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Expenses {formatPercent(expensePct / 100)}</span>
          <span>Leftover {formatPercent(leftoverPct / 100)}</span>
        </div>
        <div className="flex h-4 rounded-full overflow-hidden bg-muted">
          <div
            className={cn('transition-all', isOverspent ? 'bg-red-500' : 'bg-amber-400')}
            style={{ width: `${Math.min(100, expensePct)}%` }}
          />
          {!isOverspent && (
            <div className="flex-1 bg-emerald-500" />
          )}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatCurrency(totalExpenses)}</span>
          <span>{formatCurrency(Math.max(0, netIncome - totalExpenses))}</span>
        </div>
      </CardContent>
    </Card>
  )
}
