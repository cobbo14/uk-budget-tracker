import { useMemo, type ReactNode } from 'react'
import { useBudget } from '@/hooks/useBudget'
import { calculateTax } from '@/utils/taxCalculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
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

function TooltipBreakdown({ items }: { items: { label: string; value: string; bold?: boolean }[] }) {
  if (items.length === 0) return null
  return (
    <div className="py-0.5 min-w-48">
      {items.map((item, i) => (
        <div key={i} className={cn(
          'flex justify-between gap-6 text-xs leading-5',
          item.bold && 'font-medium border-t border-border/40 pt-1 mt-1',
        )}>
          <span className={cn('whitespace-nowrap', !item.bold && 'text-muted-foreground')}>{item.label}</span>
          <span className="tabular-nums whitespace-nowrap">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function Row({ label, value, bonusValue, showBonusCol, indent, bold, highlight, tooltip }: {
  label: string
  value: string
  bonusValue?: string
  showBonusCol?: boolean
  indent?: boolean
  bold?: boolean
  highlight?: 'green' | 'red'
  tooltip?: ReactNode
}) {
  const valClass = cn(
    'text-sm font-medium tabular-nums',
    highlight === 'green' && 'text-emerald-600 dark:text-emerald-400',
    highlight === 'red' && 'text-red-600 dark:text-red-400',
  )
  const row = (
    <div className={cn('flex py-1.5', indent && 'pl-4', tooltip && 'cursor-help')}>
      <span className={cn('text-sm text-muted-foreground flex-1 min-w-0', bold && 'text-foreground font-medium')}>
        {label}
      </span>
      <span className={cn(valClass, showBonusCol && 'w-20 sm:w-28 text-right shrink-0')}>
        {value}
      </span>
      {showBonusCol && (
        <span className={cn(valClass, 'w-20 sm:w-28 text-right shrink-0', !bonusValue && 'text-muted-foreground/30')}>
          {bonusValue || '—'}
        </span>
      )}
    </div>
  )
  if (!tooltip) return row
  return (
    <Tooltip>
      <TooltipTrigger asChild>{row}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm">
        {tooltip}
      </TooltipContent>
    </Tooltip>
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

  // Pre-compute tooltip breakdown data
  const td = useMemo(() => {
    const emp = incomeSources.filter(s => s.type === 'employment')
    const se = incomeSources.filter(s => s.type === 'self-employment')
    const rent = incomeSources.filter(s => s.type === 'rental')
    const div = incomeSources.filter(s => s.type === 'dividend' && !s.fromISA)
    const sav = incomeSources.filter(s => s.type === 'savings')

    const ssItems = emp.flatMap(s =>
      (s.salarySacrificeItems ?? []).map(i => ({
        name: i.name || i.type,
        amount: i.amountType === 'percentage' ? s.grossAmount * (i.annualAmount / 100) : i.annualAmount,
      }))
    )
    const bikItems = emp.flatMap(s =>
      (s.benefitsInKind ?? []).map(i => ({
        name: i.name || i.type,
        amount: i.type === 'companyCar' && i.bikRate != null ? i.annualValue * (i.bikRate / 100) : i.annualValue,
      }))
    )

    // Individual expenses sorted by annual amount (descending)
    const expItems = expenses
      .map(e => ({ name: e.name, annual: effectiveAnnual(e) }))
      .sort((a, b) => b.annual - a.annual)

    // NI band amounts
    const effEmpGross = t.employmentGross - t.salarySacrificeTotal
    const ni1Lower = Math.max(0, Math.min(effEmpGross, rules.niUpperEarningsLimit) - rules.niPrimaryThreshold)
    const ni1Upper = Math.max(0, effEmpGross - rules.niUpperEarningsLimit)
    const seProfit = Math.max(0, t.selfEmploymentGross - t.selfEmploymentAllowableExpenses)
    const ni4Lower = Math.max(0, Math.min(seProfit, rules.selfEmployedClass4UpperThreshold) - rules.selfEmployedClass4LowerThreshold)
    const ni4Upper = Math.max(0, seProfit - rules.selfEmployedClass4UpperThreshold)

    // Pension breakdown
    const sipp = settings.sippContribution ?? 0
    const employeePension = t.totalDeductions - sipp

    // PA breakdown
    const adjustedTotal = t.adjustedNetIncome + t.dividendGross + t.savingsIncome
    const taperReduction = Math.max(0, Math.min(rules.personalAllowance, Math.floor(Math.max(0, adjustedTotal - rules.personalAllowanceTaperThreshold) / 2)))

    // IT breakdown
    const grossIT = t.incomeTax + t.seisRelief + t.eisRelief + t.vctRelief + t.bondTopSlicingRelief
    const nonSavingsIT = grossIT - t.savingsTax

    // Student loan info
    const sl = rules.studentLoan
    const slInfo = settings.studentLoanPlan === 'plan1' ? { name: 'Plan 1', threshold: sl.plan1Threshold, rate: sl.plan1Rate }
      : settings.studentLoanPlan === 'plan2' ? { name: 'Plan 2', threshold: sl.plan2Threshold, rate: sl.plan2Rate }
      : settings.studentLoanPlan === 'plan4' ? { name: 'Plan 4', threshold: sl.plan4Threshold, rate: sl.plan4Rate }
      : settings.studentLoanPlan === 'postgrad' ? { name: 'Postgrad', threshold: sl.postgradThreshold, rate: sl.postgradRate }
      : null

    return {
      emp, se, rent, div, sav, ssItems, bikItems, expItems,
      ni1Lower, ni1Upper, ni4Lower, ni4Upper,
      sipp, employeePension, taperReduction,
      nonSavingsIT, grossIT, slInfo,
    }
  }, [incomeSources, expenses, t, settings, rules])

  // Tooltip builder: lists individual sources by name
  const srcTip = (sources: { name: string; grossAmount: number }[]) =>
    sources.length > 0 ? <TooltipBreakdown items={sources.map(s => ({ label: s.name, value: formatCurrency(v(s.grossAmount)) }))} /> : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Free UK Tax Calculator 2024–27</h1>
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
              <h2 className="text-base font-semibold leading-none tracking-tight">Income Tax & National Insurance Breakdown</h2>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Column headers when bonus column is shown */}
              {showBonusCol && (
                <div className="flex py-1.5 pt-3">
                  <span className="flex-1" />
                  <span className="w-20 sm:w-28 text-right text-[11px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Monthly</span>
                  <span className="w-20 sm:w-28 text-right text-[11px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">One-off</span>
                </div>
              )}
              <p className="text-[11px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 pt-2">Income</p>
              {t.employmentGross > 0 && (
                <>
                  <Row
                    label={hasBonus ? 'Employment salary' : 'Employment gross'}
                    value={hasBonus ? formatCurrency(v(t.employmentGross - t.bonusTotal)) : formatCurrency(v(t.employmentGross))}
                    bonusValue={formatCurrency(t.bonusTotal)}
                    showBonusCol={showBonusCol}
                    tooltip={srcTip(td.emp)}
                  />
                  {hasBonus && !showBonusCol && (
                    <Row label="One-off bonus" value={formatCurrency(v(t.bonusTotal))} indent
                      tooltip={td.emp.some(s => s.bonus) ? <TooltipBreakdown items={td.emp.filter(s => s.bonus).map(s => ({ label: s.name, value: formatCurrency(v(s.bonus!)) }))} /> : undefined}
                    />
                  )}
                </>
              )}
              {t.salarySacrificeTotal > 0 && (
                <Row label="Salary sacrifice" value={`−${formatCurrency(v(t.salarySacrificeTotal))}`} indent showBonusCol={showBonusCol}
                  tooltip={td.ssItems.length > 0 ? <TooltipBreakdown items={td.ssItems.map(i => ({ label: i.name, value: formatCurrency(v(i.amount)) }))} /> : undefined}
                />
              )}
              {t.bikTotal > 0 && (
                <Row label="Benefits in Kind (P11D)" value={`+${formatCurrency(v(t.bikTotal))}`} indent showBonusCol={showBonusCol}
                  tooltip={td.bikItems.length > 0 ? <TooltipBreakdown items={td.bikItems.map(i => ({ label: i.name, value: formatCurrency(v(i.amount)) }))} /> : undefined}
                />
              )}
              {t.selfEmploymentGross > 0 && (
                <>
                  <Row label="Self-employment gross" value={formatCurrency(v(t.selfEmploymentGross))} showBonusCol={showBonusCol}
                    tooltip={srcTip(td.se)}
                  />
                  {t.selfEmploymentAllowableExpenses > 0 && (
                    <Row label="Allowable business expenses" value={`−${formatCurrency(v(t.selfEmploymentAllowableExpenses))}`} indent showBonusCol={showBonusCol}
                      tooltip={<TooltipBreakdown items={td.se.filter(s => (s.allowableExpenses ?? 0) > 0 || s.usesTradingAllowance).map(s => ({ label: s.name, value: formatCurrency(v(s.usesTradingAllowance ? Math.min(1000, s.grossAmount) : (s.allowableExpenses ?? 0))) }))} />}
                    />
                  )}
                </>
              )}
              {t.rentalGross > 0 && (
                <>
                  <Row label="Rental gross" value={formatCurrency(v(t.rentalGross))} showBonusCol={showBonusCol}
                    tooltip={srcTip(td.rent)}
                  />
                  {t.rentalAllowableExpenses > 0 && (
                    <Row label="Rental expenses" value={`−${formatCurrency(v(t.rentalAllowableExpenses))}`} indent showBonusCol={showBonusCol}
                      tooltip={<TooltipBreakdown items={td.rent.filter(s => (s.rentalExpenses ?? 0) > 0).map(s => ({ label: s.name, value: formatCurrency(v(s.rentalExpenses ?? 0)) }))} />}
                    />
                  )}
                </>
              )}
              {t.savingsIncome > 0 && (
                <>
                  <Row label="Savings / Interest income" value={formatCurrency(v(t.savingsIncome))} showBonusCol={showBonusCol}
                    tooltip={srcTip(td.sav)}
                  />
                  {t.savingsAllowanceApplied > 0 && (
                    <Row label="Personal Savings Allowance" value={`−${formatCurrency(v(t.savingsAllowanceApplied))}`} indent showBonusCol={showBonusCol} />
                  )}
                </>
              )}
              {t.dividendGross > 0 && (
                <Row label="Dividend income" value={formatCurrency(v(t.dividendGross))} showBonusCol={showBonusCol}
                  tooltip={srcTip(td.div)}
                />
              )}

              {t.totalDeductions > 0 && (
                <>
                  <Separator className="my-2" />
                  <p className="text-[11px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 pt-2">Deductions</p>
                  <Row label="Pension contributions" value={`−${formatCurrency(v(t.totalDeductions))}`} showBonusCol={showBonusCol}
                    tooltip={(td.employeePension > 0 && td.sipp > 0) ? <TooltipBreakdown items={[
                      { label: 'Employee pension', value: formatCurrency(v(td.employeePension)) },
                      { label: 'SIPP', value: formatCurrency(v(td.sipp)) },
                    ]} /> : undefined}
                  />
                </>
              )}

              <Separator className="my-2" />
              {!t.totalDeductions && <p className="text-[11px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 pt-2">Deductions</p>}
              <Row label="Personal allowance (effective)" value={`−${formatCurrency(v(t.effectivePersonalAllowance))}`} showBonusCol={showBonusCol}
                tooltip={(td.taperReduction > 0 || t.blindPersonsAllowanceApplied > 0 || settings.marriageAllowance === 'transferring') ? <TooltipBreakdown items={[
                  { label: 'Standard PA', value: formatCurrency(v(rules.personalAllowance)) },
                  ...(td.taperReduction > 0 ? [{ label: 'Taper reduction', value: `−${formatCurrency(v(td.taperReduction))}` }] : []),
                  ...(t.blindPersonsAllowanceApplied > 0 ? [{ label: "Blind Person's Allowance", value: `+${formatCurrency(v(t.blindPersonsAllowanceApplied))}` }] : []),
                  ...(settings.marriageAllowance === 'transferring' ? [{ label: 'Marriage Allowance', value: `−${formatCurrency(v(rules.marriageAllowanceTransfer))}` }] : []),
                  { label: 'Effective PA', value: formatCurrency(v(t.effectivePersonalAllowance)), bold: true },
                ]} /> : undefined}
              />
              {t.blindPersonsAllowanceApplied > 0 && (
                <Row label="incl. Blind Person's Allowance" value={`+${formatCurrency(v(t.blindPersonsAllowanceApplied))}`} indent showBonusCol={showBonusCol} />
              )}
              <Row label="Taxable income (non-dividend)" value={formatCurrency(v(t.taxableNonDividendIncome))} bold showBonusCol={showBonusCol}
                tooltip={<TooltipBreakdown items={[
                  { label: 'Adjusted net income', value: formatCurrency(v(t.adjustedNetIncome)) },
                  { label: 'Personal allowance', value: `−${formatCurrency(v(t.effectivePersonalAllowance))}` },
                  { label: 'Taxable income', value: formatCurrency(v(t.taxableNonDividendIncome)), bold: true },
                ]} />}
              />

              <Separator className="my-2" />
              <p className="text-[11px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 pt-2">Tax & National Insurance</p>
              <Row label="Income Tax" value={showBonusCol ? formatCurrency(v(t.incomeTax - (bonusMarginal?.incomeTax ?? 0))) : formatCurrency(v(t.incomeTax))} highlight="red" showBonusCol={showBonusCol} bonusValue={bonusMarginal?.incomeTax ? formatCurrency(bonusMarginal.incomeTax) : undefined}
                tooltip={(t.savingsTax > 0 || t.bondTopSlicingRelief > 0 || t.seisRelief + t.eisRelief + t.vctRelief > 0) ? <TooltipBreakdown items={[
                  { label: 'Non-savings income tax', value: formatCurrency(v(td.nonSavingsIT)) },
                  ...(t.savingsTax > 0 ? [{ label: 'Savings income tax', value: formatCurrency(v(t.savingsTax)) }] : []),
                  ...(t.bondTopSlicingRelief > 0 ? [{ label: 'Top-slicing relief', value: `−${formatCurrency(v(t.bondTopSlicingRelief))}` }] : []),
                  ...(t.seisRelief > 0 ? [{ label: 'SEIS relief', value: `−${formatCurrency(v(t.seisRelief))}` }] : []),
                  ...(t.eisRelief > 0 ? [{ label: 'EIS relief', value: `−${formatCurrency(v(t.eisRelief))}` }] : []),
                  ...(t.vctRelief > 0 ? [{ label: 'VCT relief', value: `−${formatCurrency(v(t.vctRelief))}` }] : []),
                  { label: 'After reliefs', value: formatCurrency(v(t.incomeTax)), bold: true },
                ]} /> : undefined}
              />
              {t.class1NI > 0 && <Row label="National Insurance (Class 1)" value={showBonusCol ? formatCurrency(v(t.class1NI - (bonusMarginal?.class1NI ?? 0))) : formatCurrency(v(t.class1NI))} highlight="red" indent showBonusCol={showBonusCol} bonusValue={bonusMarginal?.class1NI ? formatCurrency(bonusMarginal.class1NI) : undefined}
                tooltip={td.ni1Upper > 0 ? <TooltipBreakdown items={[
                  { label: `Main rate (${(rules.niRateLower * 100).toFixed(0)}%)`, value: formatCurrency(v(td.ni1Lower * rules.niRateLower)) },
                  { label: `Upper rate (${(rules.niRateUpper * 100).toFixed(0)}%)`, value: formatCurrency(v(td.ni1Upper * rules.niRateUpper)) },
                ]} /> : undefined}
              />}
              {t.class2NI > 0 && <Row label="National Insurance (Class 2)" value={formatCurrency(v(t.class2NI))} highlight="red" indent showBonusCol={showBonusCol}
                tooltip={<TooltipBreakdown items={[{ label: `Flat rate ${formatCurrency(rules.selfEmployedClass2WeeklyRate)}/wk × 52`, value: formatCurrency(v(t.class2NI)) }]} />}
              />}
              {t.class2NI === 0 && t.selfEmploymentGross > 0 && <Row label="National Insurance (Class 2)" value="£0" highlight="green" indent showBonusCol={showBonusCol}
                tooltip={<TooltipBreakdown items={[
                  { label: `Profit below Small Profits Threshold (${formatCurrency(rules.selfEmployedSmallProfitsThreshold)})`, value: 'Exempt' },
                  { label: 'You can still pay voluntarily to protect State Pension', value: '' },
                ]} />}
              />}
              {t.class4NI > 0 && <Row label="National Insurance (Class 4)" value={formatCurrency(v(t.class4NI))} highlight="red" indent showBonusCol={showBonusCol}
                tooltip={td.ni4Upper > 0 ? <TooltipBreakdown items={[
                  { label: `Main rate (${(rules.selfEmployedClass4Lower * 100).toFixed(0)}%)`, value: formatCurrency(v(td.ni4Lower * rules.selfEmployedClass4Lower)) },
                  { label: `Upper rate (${(rules.selfEmployedClass4Upper * 100).toFixed(0)}%)`, value: formatCurrency(v(td.ni4Upper * rules.selfEmployedClass4Upper)) },
                ]} /> : undefined}
              />}
              {t.dividendTax > 0 && <Row label="Dividend Tax" value={formatCurrency(v(t.dividendTax))} highlight="red" showBonusCol={showBonusCol}
                tooltip={<TooltipBreakdown items={[
                  { label: 'Gross dividends', value: formatCurrency(v(t.dividendGross)) },
                  { label: `Less allowance`, value: `−${formatCurrency(v(rules.dividendAllowance))}` },
                  { label: 'Taxable dividends', value: formatCurrency(v(Math.max(0, t.dividendGross - rules.dividendAllowance))), bold: true },
                ]} />}
              />}
              {t.mortgageTaxCredit > 0 && (
                <Row label="Mortgage Interest Tax Credit" value={`−${formatCurrency(v(t.mortgageTaxCredit))}`} highlight="green" showBonusCol={showBonusCol}
                  tooltip={<TooltipBreakdown items={[{ label: 'Mortgage interest at 20%', value: formatCurrency(v(t.mortgageTaxCredit)) }]} />}
                />
              )}
              {t.studentLoan > 0 && <Row label="Student Loan Repayment" value={showBonusCol ? formatCurrency(v(t.studentLoan - (bonusMarginal?.studentLoan ?? 0))) : formatCurrency(v(t.studentLoan))} highlight="red" showBonusCol={showBonusCol} bonusValue={bonusMarginal?.studentLoan ? formatCurrency(bonusMarginal.studentLoan) : undefined}
                tooltip={td.slInfo ? <TooltipBreakdown items={[
                  { label: td.slInfo.name, value: `${(td.slInfo.rate * 100).toFixed(0)}% above ${formatCurrency(td.slInfo.threshold)}` },
                ]} /> : undefined}
              />}
              {(t.seisRelief > 0 || t.eisRelief > 0 || t.vctRelief > 0) && (
                <>
                  {t.seisRelief > 0 && <Row label="SEIS Relief (50%)" value={`−${formatCurrency(v(t.seisRelief))}`} highlight="green" indent showBonusCol={showBonusCol} />}
                  {t.eisRelief > 0 && <Row label="EIS Relief (30%)" value={`−${formatCurrency(v(t.eisRelief))}`} highlight="green" indent showBonusCol={showBonusCol} />}
                  {t.vctRelief > 0 && <Row label="VCT Relief (30%)" value={`−${formatCurrency(v(t.vctRelief))}`} highlight="green" indent showBonusCol={showBonusCol} />}
                </>
              )}
              {t.hicbc > 0 && (
                <>
                  <Row label="Child Benefit received" value={formatCurrency(v(t.childBenefitAnnual))} highlight="green" showBonusCol={showBonusCol}
                    tooltip={settings.numberOfChildren > 1 ? <TooltipBreakdown items={[
                      { label: 'Eldest child', value: `${formatCurrency(rules.childBenefitEldestWeekly)}/wk` },
                      { label: `Additional × ${settings.numberOfChildren - 1}`, value: `${formatCurrency(rules.childBenefitAdditionalWeekly)}/wk` },
                    ]} /> : undefined}
                  />
                  <Row
                    label={`HICBC charge${t.hicbcMarginalRate > 0 ? ` (+${formatPercent(t.hicbcMarginalRate)} marginal)` : ''}`}
                    value={showBonusCol ? formatCurrency(v(t.hicbc - (bonusMarginal?.hicbc ?? 0))) : formatCurrency(v(t.hicbc))}
                    highlight="red"
                    indent
                    showBonusCol={showBonusCol}
                    bonusValue={bonusMarginal?.hicbc ? formatCurrency(bonusMarginal.hicbc) : undefined}
                    tooltip={<TooltipBreakdown items={[
                      { label: `Taper: ${formatCurrency(rules.hicbcThreshold)}–${formatCurrency(rules.hicbcTaperEnd)}`, value: `${formatPercent(t.hicbc / t.childBenefitAnnual)} clawed back` },
                    ]} />}
                  />
                </>
              )}
              {t.childBenefitAnnual > 0 && t.hicbc === 0 && (
                <Row label="Child Benefit received" value={formatCurrency(v(t.childBenefitAnnual))} highlight="green" showBonusCol={showBonusCol}
                  tooltip={settings.numberOfChildren > 1 ? <TooltipBreakdown items={[
                    { label: 'Eldest child', value: `${formatCurrency(rules.childBenefitEldestWeekly)}/wk` },
                    { label: `Additional × ${settings.numberOfChildren - 1}`, value: `${formatCurrency(rules.childBenefitAdditionalWeekly)}/wk` },
                  ]} /> : undefined}
                />
              )}
              {t.annualAllowanceCharge > 0 && (
                <Row label="Pension AA Charge" value={showBonusCol ? formatCurrency(v(t.annualAllowanceCharge - (bonusMarginal?.annualAllowanceCharge ?? 0))) : formatCurrency(v(t.annualAllowanceCharge))} highlight="red" showBonusCol={showBonusCol} bonusValue={bonusMarginal?.annualAllowanceCharge ? formatCurrency(bonusMarginal.annualAllowanceCharge) : undefined}
                  tooltip={<TooltipBreakdown items={[
                    { label: 'Total pension funding', value: formatCurrency(v(t.totalPensionFunding)) },
                    { label: 'Available allowance', value: `−${formatCurrency(v(t.totalAnnualAllowanceAvailable))}` },
                    { label: 'Excess taxed at marginal rate', value: formatCurrency(v(t.annualAllowanceExcess)), bold: true },
                  ]} />}
                />
              )}

              <Separator className="my-2" />
              <Row label="Total Tax &amp; Deductions" value={showBonusCol ? formatCurrency(v(t.totalTax - bonusMarginalTax)) : formatCurrency(v(t.totalTax))} bold highlight="red" showBonusCol={showBonusCol} bonusValue={formatCurrency(bonusMarginalTax)}
                tooltip={<TooltipBreakdown items={[
                  ...(t.incomeTax > 0 ? [{ label: 'Income Tax', value: formatCurrency(v(t.incomeTax)) }] : []),
                  ...(t.nationalInsurance > 0 ? [{ label: 'National Insurance', value: formatCurrency(v(t.nationalInsurance)) }] : []),
                  ...(t.dividendTax > 0 ? [{ label: 'Dividend Tax', value: formatCurrency(v(t.dividendTax)) }] : []),
                  ...(t.studentLoan > 0 ? [{ label: 'Student Loan', value: formatCurrency(v(t.studentLoan)) }] : []),
                  ...(t.postgradLoanRepayment > 0 ? [{ label: 'Postgrad Loan', value: formatCurrency(v(t.postgradLoanRepayment)) }] : []),
                  ...(t.capitalGainsTax > 0 ? [{ label: 'Capital Gains Tax', value: formatCurrency(v(t.capitalGainsTax)) }] : []),
                  ...(t.hicbc > 0 ? [{ label: 'HICBC', value: formatCurrency(v(t.hicbc)) }] : []),
                  ...(t.annualAllowanceCharge > 0 ? [{ label: 'Pension AA charge', value: formatCurrency(v(t.annualAllowanceCharge)) }] : []),
                  ...(t.mortgageTaxCredit > 0 ? [{ label: 'Mortgage relief', value: `−${formatCurrency(v(t.mortgageTaxCredit))}` }] : []),
                  ...(t.marriageAllowanceCredit > 0 ? [{ label: 'Marriage allowance', value: `−${formatCurrency(v(t.marriageAllowanceCredit))}` }] : []),
                  { label: 'Total', value: formatCurrency(v(t.totalTax)), bold: true },
                ]} />}
              />
              <Row label="Net Income" value={showBonusCol ? formatCurrency(v(t.netIncome - netBonus)) : formatCurrency(v(t.netIncome))} bold highlight="green" showBonusCol={showBonusCol} bonusValue={formatCurrency(netBonus)}
                tooltip={<TooltipBreakdown items={[
                  ...incomeSources.map(s => ({ label: s.name, value: formatCurrency(v(s.grossAmount + (s.bonus ?? 0))) })),
                  ...(t.selfEmploymentAllowableExpenses > 0 ? [{ label: 'Business expenses', value: `−${formatCurrency(v(t.selfEmploymentAllowableExpenses))}` }] : []),
                  ...(t.rentalAllowableExpenses > 0 ? [{ label: 'Rental expenses', value: `−${formatCurrency(v(t.rentalAllowableExpenses))}` }] : []),
                  ...(t.totalDeductions > 0 ? [{ label: 'Pension deductions', value: `−${formatCurrency(v(t.totalDeductions))}` }] : []),
                  ...(t.salarySacrificeTotal > 0 ? [{ label: 'Salary sacrifice', value: `−${formatCurrency(v(t.salarySacrificeTotal))}` }] : []),
                  { label: 'Total tax', value: `−${formatCurrency(v(t.totalTax))}` },
                  { label: 'Net income', value: formatCurrency(v(t.netIncome)), bold: true },
                ]} />}
              />
            </CardContent>
          </Card>

          {/* Expenses summary */}
          {expenses.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <h2 className="text-base font-semibold leading-none tracking-tight">Budget Summary</h2>
              </CardHeader>
              <CardContent className="pt-0">
                {showBonusCol && (
                  <div className="flex py-1.5 pt-3">
                    <span className="flex-1" />
                    <span className="w-20 sm:w-28 text-right text-[11px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Monthly</span>
                    <span className="w-20 sm:w-28 text-right text-[11px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">One-off</span>
                  </div>
                )}
                <Row label="Net income (after tax)" value={showBonusCol ? formatCurrency(v(t.netIncome - netBonus)) : formatCurrency(v(t.netIncome))} highlight="green" showBonusCol={showBonusCol} bonusValue={formatCurrency(netBonus)}
                  tooltip={<TooltipBreakdown items={[
                    { label: 'Gross income', value: formatCurrency(v(t.grossIncome)) },
                    ...(t.selfEmploymentAllowableExpenses > 0 ? [{ label: 'Business expenses', value: `−${formatCurrency(v(t.selfEmploymentAllowableExpenses))}` }] : []),
                    ...(t.rentalAllowableExpenses > 0 ? [{ label: 'Rental expenses', value: `−${formatCurrency(v(t.rentalAllowableExpenses))}` }] : []),
                    ...(t.totalDeductions > 0 ? [{ label: 'Pension deductions', value: `−${formatCurrency(v(t.totalDeductions))}` }] : []),
                    ...(t.salarySacrificeTotal > 0 ? [{ label: 'Salary sacrifice', value: `−${formatCurrency(v(t.salarySacrificeTotal))}` }] : []),
                    { label: 'Total tax', value: `−${formatCurrency(v(t.totalTax))}` },
                    { label: 'Net income', value: formatCurrency(v(t.netIncome)), bold: true },
                  ]} />}
                />
                <Row label="Total expenses" value={`−${formatCurrency(v(totalAnnualExpenses))}`} highlight="red" showBonusCol={showBonusCol}
                  tooltip={td.expItems.length > 0 ? <TooltipBreakdown items={[
                    ...td.expItems.map(e => ({ label: e.name, value: formatCurrency(v(e.annual)) })),
                    ...(td.expItems.length > 1 ? [{ label: 'Total', value: formatCurrency(v(totalAnnualExpenses)), bold: true }] : []),
                  ]} /> : undefined}
                />
                <Separator className="my-2" />
                <Row
                  label="Leftover income"
                  value={showBonusCol ? formatCurrency(v(leftoverIncome - netBonus)) : formatCurrency(v(leftoverIncome))}
                  bold
                  highlight={(showBonusCol ? leftoverIncome - netBonus : leftoverIncome) >= 0 ? 'green' : 'red'}
                  showBonusCol={showBonusCol}
                  bonusValue={formatCurrency(netBonus)}
                  tooltip={<TooltipBreakdown items={[
                    { label: 'Net income', value: formatCurrency(v(t.netIncome)) },
                    { label: 'Expenses', value: `−${formatCurrency(v(totalAnnualExpenses))}` },
                    { label: 'Leftover', value: formatCurrency(v(leftoverIncome)), bold: true },
                  ]} />}
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