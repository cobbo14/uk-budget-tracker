import { useMemo, useState } from 'react'
import { useBudget } from '@/hooks/useBudget'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent } from '@/utils/formatting'
import {
  getPensionScenarios, getPensionChartPoints, getPensionRecommendations,
  solveMaxContribution, compareContributionMethods, applyExtraSacrifice,
  type MethodComparison,
} from '@/utils/planningUtils'
import { UPDATE_INCOME, UPDATE_SETTINGS } from '@/store/actions'
import { cn } from '@/lib/utils'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
} from 'recharts'

export function PensionOptimiser() {
  const { taxSummary, incomeSources, gainSources, settings, rules, dispatch, undo, canUndo } = useBudget()

  const [selectedExtra, setSelectedExtra] = useState<number | null>(null)
  const [chartView, setChartView] = useState<'marginal' | 'takehome'>('marginal')
  const [targetMonthly, setTargetMonthly] = useState('')
  const [applied, setApplied] = useState<{ label: string; amount: number } | null>(null)

  const recommendations = useMemo(
    () => getPensionRecommendations(incomeSources, settings, rules, gainSources),
    [incomeSources, settings, rules, gainSources],
  )
  const scenarios = useMemo(
    () => getPensionScenarios(incomeSources, settings, rules, gainSources),
    [incomeSources, settings, rules, gainSources],
  )
  const chartPoints = useMemo(
    () => getPensionChartPoints(incomeSources, settings, rules, gainSources),
    [incomeSources, settings, rules, gainSources],
  )

  const currentFlat = Math.max(0, taxSummary.totalDeductions - taxSummary.sippNetContribution)

  // Marginal relief on each extra £500 slice, clipped to the interesting range
  const marginalPoints = useMemo(() => {
    const maxTarget = recommendations.reduce(
      (m, r) => Math.max(m, currentFlat + r.extraContribution), 0,
    )
    const cap = Math.max(maxTarget + 10000, currentFlat + 40000)
    const pts: { contribution: number; rate: number }[] = []
    for (let i = 1; i < chartPoints.length; i++) {
      const step = chartPoints[i].contribution - chartPoints[i - 1].contribution
      if (step <= 0 || chartPoints[i].contribution > cap) continue
      const rate = 1 - (chartPoints[i - 1].takeHome - chartPoints[i].takeHome) / step
      pts.push({ contribution: chartPoints[i].contribution, rate: Math.max(0, Math.min(1.5, rate)) })
    }
    return pts
  }, [chartPoints, recommendations, currentFlat])

  const goal = useMemo(() => {
    const monthly = parseFloat(targetMonthly)
    if (!monthly || monthly <= 0) return null
    return solveMaxContribution(monthly * 12, incomeSources, settings, rules, gainSources)
  }, [targetMonthly, incomeSources, settings, rules, gainSources])

  const pensionEligible =
    Math.max(0, taxSummary.employmentGross - taxSummary.salarySacrificeTotal) +
    Math.max(0, taxSummary.selfEmploymentGross - taxSummary.selfEmploymentAllowableExpenses)

  // Default advisor amount: the first targeted recommendation; the AA-headroom
  // card is informational (often "your whole salary") so fall back to a modest
  // round figure rather than defaulting to it
  const defaultExtra = recommendations.find(r => r.id !== 'use-annual-allowance')?.extraContribution
    ?? Math.min(5000, Math.max(500, Math.round(pensionEligible / 10 / 500) * 500))
  const advisorAmount = selectedExtra ?? defaultExtra
  const methods = useMemo(
    () => compareContributionMethods(advisorAmount, incomeSources, settings, rules, gainSources),
    [advisorAmount, incomeSources, settings, rules, gainSources],
  )
  const bestNetCost = methods.length > 0 ? Math.min(...methods.map(m => m.netCost - m.employerBonus)) : 0

  if (pensionEligible <= 0) return null

  const childcareCliffX = (settings.numberOfChildren ?? 0) > 0 && taxSummary.adjustedNetIncome > rules.personalAllowanceTaperThreshold
    ? currentFlat + (taxSummary.adjustedNetIncome - rules.personalAllowanceTaperThreshold)
    : null

  function applyRoute(m: MethodComparison) {
    if (m.method === 'salary-sacrifice') {
      const employments = incomeSources.filter(s => s.type === 'employment')
      if (employments.length === 0) return
      const target = employments.reduce((a, b) => (b.grossAmount > a.grossAmount ? b : a))
      dispatch({
        type: UPDATE_INCOME,
        payload: { ...target, salarySacrificeItems: applyExtraSacrifice(target, advisorAmount, rules) },
      })
    } else if (m.method === 'net-pay') {
      dispatch({
        type: UPDATE_SETTINGS,
        payload: { pensionContributionType: 'flat', pensionContributionValue: Math.round(currentFlat + advisorAmount) },
      })
    } else {
      dispatch({
        type: UPDATE_SETTINGS,
        payload: {
          sippContributionType: 'flat',
          sippContribution: Math.round((taxSummary.sippNetContribution + advisorAmount * 0.8) * 100) / 100,
        },
      })
    }
    setApplied({ label: m.label.toLowerCase(), amount: advisorAmount })
    setSelectedExtra(null)
  }

  return (
    <div data-tour="pension-optimiser" className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">Pension Optimiser</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          What to contribute, why, and how — based on your income, allowances and thresholds.
          &ldquo;Net cost&rdquo; is what you actually give up in take-home pay.
        </p>
      </div>

      {/* Applied confirmation */}
      {applied && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20 px-3 py-2 text-xs">
          <span className="text-emerald-700 dark:text-emerald-300 font-medium">
            ✓ Applied {formatCurrency(applied.amount)}/yr via {applied.label}
          </span>
          <span className="text-muted-foreground">
            — your recommendations below have updated to reflect it.
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 text-xs"
            disabled={!canUndo}
            onClick={() => { undo(); setApplied(null) }}
          >
            Undo
          </Button>
          <a href="#settings" className="underline underline-offset-2 text-muted-foreground hover:text-foreground">
            View in Settings
          </a>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {recommendations.map(rec => {
            const selected = advisorAmount === rec.extraContribution
            return (
              <button
                key={rec.id}
                type="button"
                onClick={() => setSelectedExtra(rec.extraContribution)}
                className={cn(
                  'rounded-lg border bg-card p-3 text-left transition-colors hover:border-emerald-300',
                  selected && 'border-emerald-400 ring-1 ring-emerald-400',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{rec.title}</p>
                  <Badge variant="outline" className="shrink-0 text-emerald-600 border-emerald-300">
                    {formatPercent(rec.effectiveReliefRate)} relief
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{rec.reason}</p>
                <p className="mt-2 text-xs">
                  <span className="font-medium">+{formatCurrency(rec.extraContribution)}/yr</span>
                  <span className="text-muted-foreground"> → saves {formatCurrency(Math.round(rec.taxSaved))} tax
                    {rec.employerBonus != null && rec.employerBonus > 0 && <> + {formatCurrency(Math.round(rec.employerBonus))} employer money</>}
                    {' '}· net cost {formatCurrency(Math.round(rec.netCost))}</span>
                </p>
                {rec.expiringCarryForward != null && rec.expiringCarryForward > 0 && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    ⏳ {formatCurrency(rec.expiringCarryForward)} of carry-forward expires this tax year
                  </p>
                )}
                {rec.aaWarning && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    ⚠ Would exceed your Annual Allowance — a tax charge applies to the excess
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Chart: marginal relief / take-home toggle */}
      {chartPoints.length > 1 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">
                {chartView === 'marginal'
                  ? 'Tax + NI relief on each extra £500 contributed'
                  : 'Take-home pay vs pension contribution'}
              </p>
              <div className="flex rounded-md border text-xs">
                <button
                  type="button"
                  className={cn('px-2 py-1 rounded-l-md', chartView === 'marginal' ? 'bg-muted font-medium' : 'text-muted-foreground')}
                  onClick={() => setChartView('marginal')}
                >
                  Marginal relief
                </button>
                <button
                  type="button"
                  className={cn('px-2 py-1 rounded-r-md', chartView === 'takehome' ? 'bg-muted font-medium' : 'text-muted-foreground')}
                  onClick={() => setChartView('takehome')}
                >
                  Take-home
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              {chartView === 'marginal' ? (
                <LineChart data={marginalPoints} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <XAxis
                    dataKey="contribution"
                    tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    domain={[0, (dataMax: number) => Math.max(0.7, Math.ceil(dataMax * 10) / 10)]}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [`${Math.round((value ?? 0) * 100)}%`, 'Relief on next £500']}
                    labelFormatter={(label: unknown) => `Contribution: ${formatCurrency(typeof label === 'number' ? label : 0)}`}
                  />
                  {recommendations.map(rec => (
                    <ReferenceLine
                      key={rec.id}
                      x={currentFlat + rec.extraContribution}
                      stroke="#10b981"
                      strokeDasharray="4 2"
                      strokeWidth={1}
                    />
                  ))}
                  {childcareCliffX != null && (
                    <ReferenceLine
                      x={childcareCliffX}
                      stroke="#f59e0b"
                      strokeDasharray="4 2"
                      strokeWidth={1.5}
                      label={{ value: 'childcare cliff', position: 'top', fill: '#f59e0b', fontSize: 10 }}
                    />
                  )}
                  <Line type="stepAfter" dataKey="rate" stroke="#059669" strokeWidth={2} dot={false} />
                </LineChart>
              ) : (
                <LineChart data={chartPoints} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <XAxis
                    dataKey="contribution"
                    tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [formatCurrency(value ?? 0), 'Take-home']}
                    labelFormatter={(label: unknown) => `Contribution: ${formatCurrency(typeof label === 'number' ? label : 0)}`}
                  />
                  <Line type="monotone" dataKey="takeHome" stroke="#059669" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Goal solver */}
      <Card>
        <CardContent className="pt-4 space-y-2">
          <Label htmlFor="pension-goal" className="text-sm font-medium">
            How much could you afford to contribute?
          </Label>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground whitespace-nowrap">Keep at least</span>
            <Input
              id="pension-goal"
              type="number"
              min="0"
              step="100"
              placeholder="3500"
              className="w-28"
              value={targetMonthly}
              onChange={e => setTargetMonthly(e.target.value)}
            />
            <span className="text-muted-foreground whitespace-nowrap">/month take-home</span>
          </div>
          {targetMonthly && (
            goal ? (
              <p className="text-xs text-muted-foreground">
                You could contribute up to{' '}
                <span className="font-medium text-foreground">{formatCurrency(goal.contribution)}/yr</span>
                {' '}({formatCurrency(Math.round(goal.contribution / 12))}/mo) and keep{' '}
                {formatCurrency(Math.round(goal.summary.netIncome / 12))}/mo take-home.
                {goal.summary.annualAllowanceExcess > 0 && (
                  <span className="text-amber-600 dark:text-amber-400"> ⚠ Exceeds your Annual Allowance.</span>
                )}
              </p>
            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Your take-home is already below that target.
              </p>
            )
          )}
        </CardContent>
      </Card>

      {/* Method advisor */}
      {methods.length > 0 && (
        <Card>
          <CardContent className="pt-4 overflow-x-auto">
            <p className="text-sm font-medium mb-1">
              Best way to contribute {formatCurrency(advisorAmount)} gross
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Click a recommendation above to change the amount. The same money in your pension — different routes, different costs.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left pb-2 font-medium">Route</th>
                  <th className="text-right pb-2 font-medium">You pay</th>
                  <th className="text-right pb-2 font-medium">Tax + NI saved</th>
                  <th className="text-right pb-2 font-medium">Net cost</th>
                </tr>
              </thead>
              <tbody>
                {methods.map(m => {
                  const effectiveCost = m.netCost - m.employerBonus
                  const isBest = Math.abs(effectiveCost - bestNetCost) < 0.01
                  return (
                    <tr key={m.method} className={cn('border-b last:border-0', isBest && 'bg-emerald-50 dark:bg-emerald-950/20')}>
                      <td className="py-2 pr-2">
                        <div className={cn(isBest && 'font-medium')}>
                          {m.label}
                          {isBest && <span className="ml-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ best</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{m.note}</div>
                        {m.employerBonus > 0 && (
                          <div className="text-xs text-emerald-600 dark:text-emerald-400">
                            + {formatCurrency(Math.round(m.employerBonus))} employer match
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 mt-1.5 text-xs"
                          onClick={() => applyRoute(m)}
                        >
                          Apply
                        </Button>
                      </td>
                      <td className="py-2 pl-2 text-right tabular-nums whitespace-nowrap align-top">{formatCurrency(m.cashPaid)}</td>
                      <td className="py-2 pl-2 text-right tabular-nums whitespace-nowrap align-top text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(Math.round(m.taxSaved))}
                      </td>
                      <td className="py-2 pl-2 text-right tabular-nums whitespace-nowrap align-top">{formatCurrency(Math.round(m.netCost))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Scenario table (all contribution levels) */}
      {scenarios.length > 1 && (
        <Card>
          <CardContent className="pt-4 overflow-x-auto">
            <p className="text-sm font-medium mb-3">All scenarios</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left pb-2 font-medium">Contribution</th>
                  <th className="text-right pb-2 font-medium">Take-Home</th>
                  <th className="text-right pb-2 font-medium">Tax Saved</th>
                  <th className="text-right pb-2 font-medium">Net Cost</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario, i) => {
                  const isBaseline = i === 0
                  const baseline = scenarios[0]
                  const isGood = scenario.crossesThreshold !== undefined && !scenario.aaExcess
                  const exceedsAA = (scenario.aaExcess ?? 0) > 0

                  return (
                    <tr
                      key={scenario.contributionFlat}
                      className={cn(
                        'border-b last:border-0',
                        isBaseline && 'font-medium',
                        isGood && 'bg-emerald-50 dark:bg-emerald-950/20',
                        exceedsAA && 'bg-amber-50 dark:bg-amber-950/20',
                      )}
                    >
                      <td className="py-2 pr-2 sm:pr-4">
                        <div className={cn(isBaseline && 'text-foreground', !isBaseline && 'text-muted-foreground')}>
                          {scenario.label}
                        </div>
                        {scenario.crossesThreshold && scenario.crossesThreshold !== 'Annual Allowance' && (
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                            ↓ below {scenario.crossesThreshold}
                          </div>
                        )}
                        {scenario.crossesThreshold === 'Annual Allowance' && (
                          <div className="text-xs text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
                            Annual Allowance limit
                          </div>
                        )}
                        {exceedsAA && (
                          <div className="text-xs text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
                            AA charge: {formatCurrency(scenario.aaCharge!)}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatCurrency(scenario.contributionFlat)}/yr
                        </div>
                      </td>
                      <td className="py-2 pl-2 text-right tabular-nums whitespace-nowrap">
                        {formatCurrency(scenario.taxSummary.netIncome)}
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(scenario.taxSummary.netIncome / 12)}/mo
                        </div>
                      </td>
                      <td className="py-2 pl-2 text-right tabular-nums whitespace-nowrap">
                        {isBaseline ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(scenario.taxSaved)}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pl-2 text-right tabular-nums whitespace-nowrap">
                        {isBaseline ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <>
                            {scenario.netCost <= 0
                              ? <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(Math.abs(scenario.netCost))}</span>
                              : formatCurrency(scenario.netCost)
                            }
                            {scenario.netCost > 0 && scenario.contributionFlat !== baseline.contributionFlat && (
                              <div className="text-xs text-muted-foreground">
                                {formatPercent(scenario.taxSaved / (scenario.contributionFlat - baseline.contributionFlat))} effective relief
                              </div>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-2">
              Rows highlighted in green cross a key tax threshold, giving you disproportionately higher relief.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
