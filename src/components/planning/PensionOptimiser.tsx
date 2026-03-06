import { useMemo } from 'react'
import { useBudget } from '@/hooks/useBudget'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/utils/formatting'
import { getPensionScenarios, getPensionChartPoints } from '@/utils/planningUtils'
import { cn } from '@/lib/utils'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
} from 'recharts'

export function PensionOptimiser() {
  const { taxSummary, incomeSources, gainSources, settings, rules } = useBudget()

  const scenarios = useMemo(
    () => getPensionScenarios(incomeSources, settings, rules, gainSources),
    [incomeSources, settings, rules, gainSources],
  )
  const chartPoints = useMemo(
    () => getPensionChartPoints(incomeSources, settings, rules, gainSources),
    [incomeSources, settings, rules, gainSources],
  )

  // Only show when income is above basic rate threshold — otherwise pension optimisation is less impactful
  if (taxSummary.grossIncome < rules.niUpperEarningsLimit) return null
  if (scenarios.length <= 1) return null

  const baseline = scenarios[0]
  const thresholdMarkers = scenarios.filter(s => s.crossesThreshold && s.crossesThreshold !== 'Annual Allowance').map(s => s.contributionFlat)
  const aaMarker = scenarios.find(s => s.crossesThreshold === 'Annual Allowance')?.contributionFlat

  return (
    <div data-tour="pension-optimiser" className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">Pension Optimiser</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          How much tax you save at different contribution levels. &ldquo;Net cost&rdquo; is what you actually give up in take-home pay.
        </p>
      </div>

      {/* Take-home vs contribution chart */}
      {chartPoints.length > 1 && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-3">Take-home pay vs pension contribution</p>
            <ResponsiveContainer width="100%" height={180}>
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
                {thresholdMarkers.map(contrib => (
                  <ReferenceLine
                    key={contrib}
                    x={contrib}
                    stroke="#10b981"
                    strokeDasharray="4 2"
                    strokeWidth={1.5}
                  />
                ))}
                {aaMarker != null && (
                  <ReferenceLine
                    x={aaMarker}
                    stroke="#f59e0b"
                    strokeDasharray="4 2"
                    strokeWidth={1.5}
                    label={{ value: 'AA', position: 'top', fill: '#f59e0b', fontSize: 11 }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="takeHome"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4 overflow-x-auto">
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
                              {formatPercent(1 - scenario.taxSaved / (scenario.contributionFlat - baseline.contributionFlat))} effective relief
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
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Rows highlighted in green cross a key tax threshold, giving you disproportionately higher relief.
      </p>
    </div>
  )
}
