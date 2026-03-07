import { useMemo } from 'react'
import { useBudget } from '@/hooks/useBudget'
import { calculateTax } from '@/utils/taxCalculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent } from '@/utils/formatting'
import { cn } from '@/lib/utils'
import { PoundSterling, BookOpen, CalendarClock } from 'lucide-react'
import { IncomeAndTaxCharts } from './IncomeAndTaxCharts'
import { isRenewalSoon, effectiveAnnual } from '@/store/selectors'

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

function Row({ label, value, bonusValue, showBonusCol, indent, bold, highlight }: {
  label: string
  value: string
  bonusValue?: string
  showBonusCol?: boolean
  indent?: boolean
  bold?: boolean
  highlight?: 'green' | 'red'
}) {
  const valClass = cn(
    'text-sm font-medium tabular-nums',
    highlight === 'green' && 'text-emerald-600 dark:text-emerald-400',
    highlight === 'red' && 'text-red-600 dark:text-red-400',
  )
  return (
    <div className={cn('flex py-1.5', indent && 'pl-4')}>
      <span className={cn('text-sm text-muted-foreground flex-1 min-w-0', bold && 'text-foreground font-medium')}>
        {label}
      </span>
      <span className={cn(valClass, showBonusCol && 'w-24 sm:w-28 text-right shrink-0')}>
        {value}
      </span>
      {showBonusCol && (
        <span className={cn(valClass, 'w-24 sm:w-28 text-right shrink-0', !bonusValue && 'text-muted-foreground/30')}>
          {bonusValue || '—'}
        </span>
      )}
    </div>
  )
}


interface SummaryViewProps {
  showMonthly: boolean
  onShowMonthlyChange: (v: boolean) => void
}

export function SummaryView({ showMonthly, onShowMonthlyChange }: SummaryViewProps) {
  const { taxSummary, totalAnnualExpenses, leftoverIncome, incomeSources, gainSources, settings, rules, expenses } = useBudget()
  const t = taxSummary
  const hasData = incomeSources.length > 0
  const v = (amount: number) => showMonthly ? amount / 12 : amount
  const hasBonus = t.bonusTotal > 0
  const showBonusCol = showMonthly && hasBonus

  // Compute per-component marginal tax on bonus by running tax calc without it
  const bonusMarginal = useMemo(() => {
    if (!hasBonus) return null
    const sourcesWithoutBonus = incomeSources.map(s => ({ ...s, bonus: undefined }))
    const w = calculateTax(sourcesWithoutBonus, settings, rules, gainSources)
    return {
      total: t.totalTax - w.totalTax,
      incomeTax: t.incomeTax - w.incomeTax,
      class1NI: t.class1NI - w.class1NI,
      class2NI: t.class2NI - w.class2NI,
      class4NI: t.class4NI - w.class4NI,
      dividendTax: t.dividendTax - w.dividendTax,
      studentLoan: t.studentLoan - w.studentLoan,
      postgradLoan: t.postgradLoanRepayment - w.postgradLoanRepayment,
      hicbc: t.hicbc - w.hicbc,
      annualAllowanceCharge: t.annualAllowanceCharge - w.annualAllowanceCharge,
    }
  }, [hasBonus, incomeSources, settings, rules, gainSources, t])
  const bonusMarginalTax = bonusMarginal?.total ?? 0
  const netBonus = t.bonusTotal - bonusMarginalTax

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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HeadlineCard
          label="Gross Income"
          monthly={showMonthly && hasBonus ? (t.grossIncome - t.bonusTotal) / 12 : t.grossIncome / 12}
          annual={showMonthly && hasBonus ? t.grossIncome - t.bonusTotal : t.grossIncome}
          description={showMonthly && hasBonus ? `excl. ${formatCurrency(t.bonusTotal)} one-off bonus` : !showMonthly && hasBonus ? `incl. ${formatCurrency(t.bonusTotal)} one-off bonus` : 'before tax'}
          showMonthly={showMonthly}
        />
        <HeadlineCard
          label="Total Tax"
          monthly={showMonthly && hasBonus ? (t.totalTax - bonusMarginalTax) / 12 : t.totalTax / 12}
          annual={showMonthly && hasBonus ? t.totalTax - bonusMarginalTax : t.totalTax}
          description={`${formatPercent(t.effectiveTaxRate)} effective`}
          showMonthly={showMonthly}
        />
        <HeadlineCard
          label="Net Income"
          monthly={showMonthly && hasBonus ? (t.netIncome - netBonus) / 12 : t.netIncome / 12}
          annual={showMonthly && hasBonus ? t.netIncome - netBonus : t.netIncome}
          description={showMonthly && hasBonus ? `excl. ${formatCurrency(netBonus)} net bonus` : !showMonthly && hasBonus ? `incl. ${formatCurrency(netBonus)} net bonus` : 'after tax'}
          color="text-emerald-600 dark:text-emerald-400"
          showMonthly={showMonthly}
        />
        <HeadlineCard
          label="Leftover"
          monthly={showMonthly && hasBonus ? (leftoverIncome - netBonus) / 12 : leftoverIncome / 12}
          annual={showMonthly && hasBonus ? leftoverIncome - netBonus : leftoverIncome}
          description={showMonthly && hasBonus ? 'excl. net bonus' : !showMonthly && hasBonus ? 'incl. net bonus' : 'after expenses'}
          color={(showMonthly && hasBonus ? leftoverIncome - netBonus : leftoverIncome) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
          showMonthly={showMonthly}
        />
      </div>

      {hasData && (
        <>
          {/* Visual breakdown charts */}
          <IncomeAndTaxCharts showMonthly={showMonthly} />

          {/* Tax breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tax Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Column headers when bonus column is shown */}
              {showBonusCol && (
                <div className="flex py-1.5 pt-3">
                  <span className="flex-1" />
                  <span className="w-24 sm:w-28 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Monthly</span>
                  <span className="w-24 sm:w-28 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">One-off</span>
                </div>
              )}
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 pt-2">Income</p>
              {t.employmentGross > 0 && (
                <>
                  <Row
                    label={hasBonus ? 'Employment salary' : 'Employment gross'}
                    value={hasBonus ? formatCurrency(v(t.employmentGross - t.bonusTotal)) : formatCurrency(v(t.employmentGross))}
                    bonusValue={formatCurrency(t.bonusTotal)}
                    showBonusCol={showBonusCol}
                  />
                  {hasBonus && !showBonusCol && (
                    <Row label="One-off bonus" value={formatCurrency(v(t.bonusTotal))} indent />
                  )}
                </>
              )}
              {t.salarySacrificeTotal > 0 && (
                <Row label="Salary sacrifice" value={`−${formatCurrency(v(t.salarySacrificeTotal))}`} indent showBonusCol={showBonusCol} />
              )}
              {t.bikTotal > 0 && (
                <Row label="Benefits in Kind (P11D)" value={`+${formatCurrency(v(t.bikTotal))}`} indent showBonusCol={showBonusCol} />
              )}
              {t.selfEmploymentGross > 0 && (
                <>
                  <Row label="Self-employment gross" value={formatCurrency(v(t.selfEmploymentGross))} showBonusCol={showBonusCol} />
                  {t.selfEmploymentAllowableExpenses > 0 && (
                    <Row label="Allowable business expenses" value={`−${formatCurrency(v(t.selfEmploymentAllowableExpenses))}`} indent showBonusCol={showBonusCol} />
                  )}
                </>
              )}
              {t.rentalGross > 0 && (
                <>
                  <Row label="Rental gross" value={formatCurrency(v(t.rentalGross))} showBonusCol={showBonusCol} />
                  {t.rentalAllowableExpenses > 0 && (
                    <Row label="Rental expenses" value={`−${formatCurrency(v(t.rentalAllowableExpenses))}`} indent showBonusCol={showBonusCol} />
                  )}
                </>
              )}
              {t.savingsIncome > 0 && (
                <>
                  <Row label="Savings / Interest income" value={formatCurrency(v(t.savingsIncome))} showBonusCol={showBonusCol} />
                  {t.savingsAllowanceApplied > 0 && (
                    <Row label="Personal Savings Allowance" value={`−${formatCurrency(v(t.savingsAllowanceApplied))}`} indent showBonusCol={showBonusCol} />
                  )}
                </>
              )}
              {t.dividendGross > 0 && (
                <Row label="Dividend income" value={formatCurrency(v(t.dividendGross))} showBonusCol={showBonusCol} />
              )}

              {t.totalDeductions > 0 && (
                <>
                  <Separator className="my-2" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 pt-2">Deductions</p>
                  <Row label="Pension contributions" value={`−${formatCurrency(v(t.totalDeductions))}`} showBonusCol={showBonusCol} />
                </>
              )}

              <Separator className="my-2" />
              {!t.totalDeductions && <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 pt-2">Deductions</p>}
              <Row label="Personal allowance (effective)" value={`−${formatCurrency(v(t.effectivePersonalAllowance))}`} showBonusCol={showBonusCol} />
              {t.blindPersonsAllowanceApplied > 0 && (
                <Row label="incl. Blind Person's Allowance" value={`+${formatCurrency(v(t.blindPersonsAllowanceApplied))}`} indent showBonusCol={showBonusCol} />
              )}
              <Row label="Taxable income (non-dividend)" value={formatCurrency(v(t.taxableNonDividendIncome))} bold showBonusCol={showBonusCol} />

              <Separator className="my-2" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 pt-2">Tax & National Insurance</p>
              <Row label="Income Tax" value={showBonusCol ? formatCurrency(v(t.incomeTax - (bonusMarginal?.incomeTax ?? 0))) : formatCurrency(v(t.incomeTax))} highlight="red" showBonusCol={showBonusCol} bonusValue={bonusMarginal?.incomeTax ? formatCurrency(bonusMarginal.incomeTax) : undefined} />
              {t.class1NI > 0 && <Row label="National Insurance (Class 1)" value={showBonusCol ? formatCurrency(v(t.class1NI - (bonusMarginal?.class1NI ?? 0))) : formatCurrency(v(t.class1NI))} highlight="red" indent showBonusCol={showBonusCol} bonusValue={bonusMarginal?.class1NI ? formatCurrency(bonusMarginal.class1NI) : undefined} />}
              {t.class2NI > 0 && <Row label="National Insurance (Class 2)" value={formatCurrency(v(t.class2NI))} highlight="red" indent showBonusCol={showBonusCol} />}
              {t.class4NI > 0 && <Row label="National Insurance (Class 4)" value={formatCurrency(v(t.class4NI))} highlight="red" indent showBonusCol={showBonusCol} />}
              {t.dividendTax > 0 && <Row label="Dividend Tax" value={formatCurrency(v(t.dividendTax))} highlight="red" showBonusCol={showBonusCol} />}
              {t.mortgageTaxCredit > 0 && (
                <Row label="Mortgage Interest Tax Credit" value={`−${formatCurrency(v(t.mortgageTaxCredit))}`} highlight="green" showBonusCol={showBonusCol} />
              )}
              {t.studentLoan > 0 && <Row label="Student Loan Repayment" value={showBonusCol ? formatCurrency(v(t.studentLoan - (bonusMarginal?.studentLoan ?? 0))) : formatCurrency(v(t.studentLoan))} highlight="red" showBonusCol={showBonusCol} bonusValue={bonusMarginal?.studentLoan ? formatCurrency(bonusMarginal.studentLoan) : undefined} />}
              {(t.seisRelief > 0 || t.eisRelief > 0 || t.vctRelief > 0) && (
                <>
                  {t.seisRelief > 0 && <Row label="SEIS Relief (50%)" value={`−${formatCurrency(v(t.seisRelief))}`} highlight="green" indent showBonusCol={showBonusCol} />}
                  {t.eisRelief > 0 && <Row label="EIS Relief (30%)" value={`−${formatCurrency(v(t.eisRelief))}`} highlight="green" indent showBonusCol={showBonusCol} />}
                  {t.vctRelief > 0 && <Row label="VCT Relief (30%)" value={`−${formatCurrency(v(t.vctRelief))}`} highlight="green" indent showBonusCol={showBonusCol} />}
                </>
              )}
              {t.hicbc > 0 && (
                <>
                  <Row label="Child Benefit received" value={formatCurrency(v(t.childBenefitAnnual))} highlight="green" showBonusCol={showBonusCol} />
                  <Row
                    label={`HICBC charge${t.hicbcMarginalRate > 0 ? ` (+${formatPercent(t.hicbcMarginalRate)} marginal)` : ''}`}
                    value={showBonusCol ? formatCurrency(v(t.hicbc - (bonusMarginal?.hicbc ?? 0))) : formatCurrency(v(t.hicbc))}
                    highlight="red"
                    indent
                    showBonusCol={showBonusCol}
                    bonusValue={bonusMarginal?.hicbc ? formatCurrency(bonusMarginal.hicbc) : undefined}
                  />
                </>
              )}
              {t.childBenefitAnnual > 0 && t.hicbc === 0 && (
                <Row label="Child Benefit received" value={formatCurrency(v(t.childBenefitAnnual))} highlight="green" showBonusCol={showBonusCol} />
              )}
              {t.annualAllowanceCharge > 0 && (
                <Row label="Pension AA Charge" value={showBonusCol ? formatCurrency(v(t.annualAllowanceCharge - (bonusMarginal?.annualAllowanceCharge ?? 0))) : formatCurrency(v(t.annualAllowanceCharge))} highlight="red" showBonusCol={showBonusCol} bonusValue={bonusMarginal?.annualAllowanceCharge ? formatCurrency(bonusMarginal.annualAllowanceCharge) : undefined} />
              )}

              <Separator className="my-2" />
              <Row label="Total Tax &amp; Deductions" value={showBonusCol ? formatCurrency(v(t.totalTax - bonusMarginalTax)) : formatCurrency(v(t.totalTax))} bold highlight="red" showBonusCol={showBonusCol} bonusValue={formatCurrency(bonusMarginalTax)} />
              <Row label="Net Income" value={showBonusCol ? formatCurrency(v(t.netIncome - netBonus)) : formatCurrency(v(t.netIncome))} bold highlight="green" showBonusCol={showBonusCol} bonusValue={formatCurrency(netBonus)} />
            </CardContent>
          </Card>

          {/* Expenses summary */}
          {expenses.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Budget Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {showBonusCol && (
                  <div className="flex py-1.5 pt-3">
                    <span className="flex-1" />
                    <span className="w-24 sm:w-28 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Monthly</span>
                    <span className="w-24 sm:w-28 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">One-off</span>
                  </div>
                )}
                <Row label="Net income (after tax)" value={showBonusCol ? formatCurrency(v(t.netIncome - netBonus)) : formatCurrency(v(t.netIncome))} highlight="green" showBonusCol={showBonusCol} bonusValue={formatCurrency(netBonus)} />
                <Row label="Total expenses" value={`−${formatCurrency(v(totalAnnualExpenses))}`} highlight="red" showBonusCol={showBonusCol} />
                <Separator className="my-2" />
                <Row
                  label="Leftover income"
                  value={showBonusCol ? formatCurrency(v(leftoverIncome - netBonus)) : formatCurrency(v(leftoverIncome))}
                  bold
                  highlight={(showBonusCol ? leftoverIncome - netBonus : leftoverIncome) >= 0 ? 'green' : 'red'}
                  showBonusCol={showBonusCol}
                  bonusValue={formatCurrency(netBonus)}
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
          <p className="mt-1 text-sm text-muted-foreground">Add your income sources to see your personalised tax breakdown and budget overview.</p>
          <Button className="mt-4" onClick={() => { window.location.hash = 'income' }}>
            Add your first income source →
          </Button>
        </div>
      )}


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