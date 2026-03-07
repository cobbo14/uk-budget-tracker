import { useMemo, useState } from 'react'
import { useBudget } from '@/hooks/useBudget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { formatCurrency } from '@/utils/formatting'
import { UPDATE_SETTINGS } from '@/store/actions'
import { HelpTooltip } from '@/components/ui/tooltip'
import { projectPensionPotAdvanced } from '@/utils/pensionProjection'
import { getPensionScenarios } from '@/utils/planningUtils'
import { generateId } from '@/utils/ids'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine,
} from 'recharts'
import type { PensionProjectionSettings, PensionPot } from '@/types'

const DEFAULTS: PensionProjectionSettings = {
  currentAge: 30,
  currentPotValue: 0,
  pensionAccessAge: 57,
  assumedGrowthRate: 4,
  annualIncomeNeeded: 0,
  inflationRate: 3,
}

export function PensionProjection() {
  const { taxSummary, incomeSources, gainSources, settings, rules, dispatch } = useBudget()
  const [showStatePension, setShowStatePension] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showMultiplePots, setShowMultiplePots] = useState(false)
  const [showInTodaysMoney, setShowInTodaysMoney] = useState(false)

  const { totalPensionFunding } = taxSummary
  if (totalPensionFunding === 0) return null

  const proj = settings.pensionProjection ?? DEFAULTS

  // Auto-expand sections if values are already set
  const hasStatePension = (proj.qualifyingNIYears ?? 0) > 0 || (proj.dbPensionAnnualIncome ?? 0) > 0
  const hasAdvanced = (proj.annualFeeRate ?? 0) > 0 || (proj.lumpSumAllowanceOverride ?? 0) > 0 || (proj.salaryGrowthRate ?? 0) > 0
  const hasMultiplePots = (proj.pensionPots?.length ?? 0) > 0

  const statePensionOpen = showStatePension || hasStatePension
  const advancedOpen = showAdvanced || hasAdvanced
  const multiplePotsOpen = showMultiplePots || hasMultiplePots

  const updateProjection = (partial: Partial<PensionProjectionSettings>) => {
    dispatch({
      type: UPDATE_SETTINGS,
      payload: {
        pensionProjection: { ...proj, ...partial },
      },
    })
  }

  const totalPotValue = proj.pensionPots?.length
    ? proj.pensionPots.reduce((sum, p) => sum + p.value, 0)
    : proj.currentPotValue

  const projection = useMemo(
    () => projectPensionPotAdvanced({
      currentAge: proj.currentAge,
      currentPotValue: totalPotValue,
      pensionPots: proj.pensionPots,
      pensionAccessAge: proj.pensionAccessAge,
      annualContribution: totalPensionFunding,
      assumedGrowthRate: proj.assumedGrowthRate,
      annualIncomeNeeded: proj.annualIncomeNeeded,
      inflationRate: proj.inflationRate,
      annualFeeRate: proj.annualFeeRate,
      salaryGrowthRate: proj.salaryGrowthRate,
      qualifyingNIYears: proj.qualifyingNIYears,
      statePensionAge: proj.statePensionAge ?? rules.statePensionDefaultAge,
      statePensionFullAnnual: rules.statePensionFullAnnual,
      dbPensionAnnualIncome: proj.dbPensionAnnualIncome,
      lumpSumAllowance: proj.lumpSumAllowanceOverride ?? rules.lumpSumAllowance,
      personalAllowance: rules.personalAllowance,
      personalAllowanceTaperThreshold: rules.personalAllowanceTaperThreshold,
      incomeTaxBands: rules.incomeTaxBands,
      drawdownTaxFreeFirst: proj.drawdownTaxFreeFirst,
    }),
    [proj, totalPensionFunding, totalPotValue, rules],
  )

  // Scenario projections
  const scenarios = useMemo(
    () => getPensionScenarios(incomeSources, settings, rules, gainSources),
    [incomeSources, settings, rules, gainSources],
  )

  const scenarioProjections = useMemo(() => {
    if (scenarios.length <= 1) return []
    return scenarios.map(s => {
      const totalContrib = s.taxSummary.totalPensionFunding
      const result = projectPensionPotAdvanced({
        currentAge: proj.currentAge,
        currentPotValue: totalPotValue,
        pensionPots: proj.pensionPots,
        pensionAccessAge: proj.pensionAccessAge,
        annualContribution: totalContrib,
        assumedGrowthRate: proj.assumedGrowthRate,
        annualIncomeNeeded: proj.annualIncomeNeeded,
        inflationRate: proj.inflationRate,
        annualFeeRate: proj.annualFeeRate,
        salaryGrowthRate: proj.salaryGrowthRate,
        qualifyingNIYears: proj.qualifyingNIYears,
        statePensionAge: proj.statePensionAge ?? rules.statePensionDefaultAge,
        statePensionFullAnnual: rules.statePensionFullAnnual,
        dbPensionAnnualIncome: proj.dbPensionAnnualIncome,
        lumpSumAllowance: proj.lumpSumAllowanceOverride ?? rules.lumpSumAllowance,
        personalAllowance: rules.personalAllowance,
        personalAllowanceTaperThreshold: rules.personalAllowanceTaperThreshold,
        incomeTaxBands: rules.incomeTaxBands,
        drawdownTaxFreeFirst: proj.drawdownTaxFreeFirst,
      })
      return {
        label: s.label,
        annualContribution: totalContrib,
        projectedPot: result.projectedPotAtAccess,
        yearsOfIncome: result.yearsOfIncome,
        differenceVsBaseline: result.projectedPotAtAccess - projection.projectedPotAtAccess,
      }
    })
  }, [scenarios, proj, totalPotValue, projection.projectedPotAtAccess, rules])

  const hasInput = proj.currentAge > 0
  const hasIncomeNeeded = proj.annualIncomeNeeded > 0

  // Age at which the DC pot is fully depleted
  const depletionAge = useMemo(() => {
    if (!hasIncomeNeeded || projection.drawdownYears.length === 0) return null
    const depleted = projection.drawdownYears.find(y => y.closingBalance <= 0)
    return depleted ? depleted.age : null
  }, [hasIncomeNeeded, projection.drawdownYears])

  // Chart data
  const chartData = useMemo(() => {
    if (!hasInput || projection.yearByYear.length === 0) return []
    const inflRate = proj.inflationRate / 100
    const discount = (value: number, yearsFromNow: number) =>
      showInTodaysMoney ? value / Math.pow(1 + inflRate, yearsFromNow) : value
    const points: Array<{
      age: number; pot: number; change: number
      contribution: number; growth: number; withdrawal: number
    }> = []
    let prevPot = 0
    for (const y of projection.yearByYear) {
      const yearsFromNow = y.age - proj.currentAge
      const pot = Math.round(discount(y.closingBalance, yearsFromNow))
      points.push({
        age: y.age, pot, change: pot - prevPot,
        contribution: Math.round(discount(y.annualContribution, yearsFromNow)),
        growth: Math.round(discount(y.growthAmount, yearsFromNow)),
        withdrawal: 0,
      })
      prevPot = pot
    }
    let depleted = false
    for (const y of projection.drawdownYears) {
      const yearsFromNow = y.age - proj.currentAge
      const pot = Math.round(discount(y.closingBalance, yearsFromNow))
      points.push({
        age: y.age, pot, change: pot - prevPot,
        contribution: 0,
        growth: Math.round(discount(y.growthAmount, yearsFromNow)),
        withdrawal: Math.round(discount(y.withdrawal, yearsFromNow)),
      })
      prevPot = pot
      // Stop charting 3 years after pot is depleted (or at age 100, whichever is later)
      if (Math.round(y.closingBalance) <= 0) {
        if (depleted && y.age >= Math.max(proj.pensionAccessAge + 5, 100)) break
        depleted = true
      }
    }
    return points
  }, [hasInput, projection, proj.pensionAccessAge, proj.currentAge, proj.inflationRate, showInTodaysMoney])

  // Pot management helpers
  const addPot = () => {
    const currentPots = proj.pensionPots ?? []
    const newPot: PensionPot = { id: generateId(), name: `Pension ${currentPots.length + 1}`, value: 0 }
    // If switching from single to multi, migrate currentPotValue as first pot
    if (currentPots.length === 0 && proj.currentPotValue > 0) {
      updateProjection({
        pensionPots: [
          { id: generateId(), name: 'Main pension', value: proj.currentPotValue },
          newPot,
        ],
      })
    } else {
      updateProjection({ pensionPots: [...currentPots, newPot] })
    }
  }

  const updatePot = (id: string, partial: Partial<PensionPot>) => {
    const pots = (proj.pensionPots ?? []).map(p => p.id === id ? { ...p, ...partial } : p)
    updateProjection({ pensionPots: pots })
  }

  const removePot = (id: string) => {
    const pots = (proj.pensionPots ?? []).filter(p => p.id !== id)
    if (pots.length === 0) {
      updateProjection({ pensionPots: undefined, currentPotValue: 0 })
    } else {
      updateProjection({ pensionPots: pots })
    }
  }

  // Estimated State Pension (current, not projected)
  const estimatedStatePension = (proj.qualifyingNIYears != null && proj.qualifyingNIYears > 0)
    ? (Math.min(proj.qualifyingNIYears, 35) / 35) * rules.statePensionFullAnnual
    : 0

  // Discount factor to convert future nominal values to today's money
  const discountToToday = (futureValue: number, yearsAhead: number) =>
    futureValue / Math.pow(1 + (proj.inflationRate / 100), yearsAhead)
  const fmt = (value: number, yearsAhead?: number) =>
    showInTodaysMoney && yearsAhead != null && yearsAhead > 0
      ? formatCurrency(discountToToday(value, yearsAhead))
      : formatCurrency(value)

  // Whether the pot never depletes during the projection
  const potNeverDepletes = hasIncomeNeeded && depletionAge == null && projection.drawdownYears.length > 0

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">Pension Pot Projection</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Project your pension pot growth to retirement and see how long it could fund your income.
        </p>
      </div>

      {/* Core inputs */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="pp-age" className="text-xs">Current age</Label>
              <Input
                id="pp-age"
                type="number"
                min={16}
                max={75}
                value={proj.currentAge || ''}
                onChange={e => updateProjection({ currentAge: parseInt(e.target.value) || 0 })}
              />
            </div>

            {/* Single pot value — only when not using multiple pots */}
            {!multiplePotsOpen && (
              <div className="grid gap-1.5">
                <Label htmlFor="pp-pot" className="text-xs">Current pot value (£)</Label>
                <Input
                  id="pp-pot"
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="0"
                  value={proj.currentPotValue || ''}
                  onChange={e => updateProjection({ currentPotValue: parseFloat(e.target.value) || 0 })}
                />
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="pp-access-age" className="text-xs">
                Access age
                <HelpTooltip content="The age you plan to access your pension. UK minimum pension age rises to 57 from April 2028." />
              </Label>
              <Input
                id="pp-access-age"
                type="number"
                min={55}
                max={75}
                value={proj.pensionAccessAge || ''}
                onChange={e => updateProjection({ pensionAccessAge: parseInt(e.target.value) || 57 })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pp-growth" className="text-xs">
                Growth rate (%)
                <HelpTooltip content="Assumed annual growth rate before fees. A typical diversified equity portfolio returns around 4-6%. Recommended: inflation + 2%." />
              </Label>
              <Input
                id="pp-growth"
                type="number"
                min={0}
                max={15}
                step={0.5}
                placeholder={String((proj.inflationRate || 3) + 2)}
                value={proj.assumedGrowthRate ?? ''}
                onChange={e => updateProjection({ assumedGrowthRate: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Recommended: inflation + 2% ({(proj.inflationRate || 3) + 2}%)</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pp-income" className="text-xs">
                Annual income needed (£)
                <HelpTooltip content="How much pre-tax income you'd want per year in retirement, in today's money. State Pension and DB pension will offset how much your DC pot needs to provide." />
              </Label>
              <Input
                id="pp-income"
                type="number"
                min={0}
                step={1000}
                placeholder="e.g. 30000"
                value={proj.annualIncomeNeeded || ''}
                onChange={e => updateProjection({ annualIncomeNeeded: parseFloat(e.target.value) || 0 })}
              />
              {hasInput && hasIncomeNeeded && projection.yearsToAccess > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(projection.inflatedAnnualIncome)}/yr at age {proj.pensionAccessAge}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pp-inflation" className="text-xs">
                Inflation rate (%)
                <HelpTooltip content="Assumed annual inflation rate to project your income needs to access age. Recommended: 3%." />
              </Label>
              <Input
                id="pp-inflation"
                type="number"
                min={0}
                max={10}
                step={0.5}
                placeholder="3"
                value={proj.inflationRate ?? ''}
                onChange={e => updateProjection({ inflationRate: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Recommended: 3%</p>
            </div>
          </div>

          {/* Toggle buttons for extra sections */}
          <div className="flex flex-wrap gap-2 pt-1">
            {!multiplePotsOpen && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => { setShowMultiplePots(true); if (!hasMultiplePots) addPot() }}
              >
                + Multiple pots
              </Button>
            )}
            {!statePensionOpen && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => setShowStatePension(true)}
              >
                + State Pension & DB income
              </Button>
            )}
            {!advancedOpen && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => setShowAdvanced(true)}
              >
                + Fees & advanced
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Multiple pension pots */}
      {multiplePotsOpen && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Pension Pots</p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2 text-muted-foreground"
                onClick={() => { setShowMultiplePots(false); updateProjection({ pensionPots: undefined, currentPotValue: 0 }) }}
              >
                Remove
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {formatCurrency(totalPotValue)}
            </p>
            {(proj.pensionPots ?? []).map(pot => (
              <div key={pot.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
                <div className="grid gap-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    type="text"
                    value={pot.name}
                    onChange={e => updatePot(pot.id, { name: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Value (£)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={pot.value || ''}
                    onChange={e => updatePot(pot.id, { value: parseFloat(e.target.value) || 0 })}
                    className="h-8 text-sm w-28"
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">
                    Growth %
                    <HelpTooltip content="Override the global growth rate for this pot (e.g. a cash fund may grow slower)." />
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={15}
                    step={0.5}
                    placeholder={String(proj.assumedGrowthRate)}
                    value={pot.growthRateOverride ?? ''}
                    onChange={e => updatePot(pot.id, { growthRateOverride: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="h-8 text-sm w-20"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={() => removePot(pot.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={addPot}>
              + Add pot
            </Button>
          </CardContent>
        </Card>
      )}

      {/* State Pension & DB income */}
      {statePensionOpen && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">State Pension & Other Retirement Income</p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2 text-muted-foreground"
                onClick={() => { setShowStatePension(false); updateProjection({ qualifyingNIYears: undefined, statePensionAge: undefined, dbPensionAnnualIncome: 0 }) }}
              >
                Remove
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="pp-ni-years" className="text-xs">
                  Qualifying NI years
                  <HelpTooltip content="You need 35 qualifying years of National Insurance to get the full State Pension. Check your NI record at gov.uk." />
                </Label>
                <Input
                  id="pp-ni-years"
                  type="number"
                  min={0}
                  max={35}
                  step={1}
                  placeholder="0"
                  value={proj.qualifyingNIYears ?? ''}
                  onChange={e => updateProjection({ qualifyingNIYears: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pp-sp-age" className="text-xs">
                  State Pension age
                  <HelpTooltip content="Currently 67, rising to 68 between 2044-2046. Check yours at gov.uk." />
                </Label>
                <Input
                  id="pp-sp-age"
                  type="number"
                  min={65}
                  max={70}
                  value={proj.statePensionAge ?? rules.statePensionDefaultAge}
                  onChange={e => updateProjection({ statePensionAge: parseInt(e.target.value) || rules.statePensionDefaultAge })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pp-db" className="text-xs">
                  DB pension income (£/yr)
                  <HelpTooltip content="Annual income from any defined benefit pension (e.g. final salary or career average scheme), in today's money. This reduces how much your DC pot needs to provide." />
                </Label>
                <Input
                  id="pp-db"
                  type="number"
                  min={0}
                  step={500}
                  placeholder="0"
                  value={proj.dbPensionAnnualIncome || ''}
                  onChange={e => updateProjection({ dbPensionAnnualIncome: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            {estimatedStatePension > 0 && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>
                  Current estimate: {formatCurrency(estimatedStatePension)}/yr
                  ({proj.qualifyingNIYears}/{35} qualifying years of full {formatCurrency(rules.statePensionFullAnnual)})
                </p>
                {hasInput && projection.yearsToAccess > 0 && projection.projectedNIYears != null && projection.projectedNIYears > (proj.qualifyingNIYears ?? 0) && (
                  <p>
                    Projected at retirement: {formatCurrency(projection.statePensionAnnual)}/yr
                    ({projection.projectedNIYears}/35 years, assuming continued NI contributions)
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Advanced settings */}
      {advancedOpen && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Advanced Settings</p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2 text-muted-foreground"
                onClick={() => { setShowAdvanced(false); updateProjection({ annualFeeRate: undefined, salaryGrowthRate: undefined, lumpSumAllowanceOverride: undefined }) }}
              >
                Remove
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="pp-fee" className="text-xs">
                  Annual platform/fund fee (%)
                  <HelpTooltip content="Annual charges from your pension provider and fund manager. Even 0.5% compounds significantly over decades. Net growth = growth rate minus fees." />
                </Label>
                <Input
                  id="pp-fee"
                  type="number"
                  min={0}
                  max={3}
                  step={0.1}
                  placeholder="0"
                  value={proj.annualFeeRate ?? ''}
                  onChange={e => updateProjection({ annualFeeRate: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pp-salary-growth" className="text-xs">
                  Real salary growth (%)
                  <HelpTooltip content="Expected annual salary growth above inflation (e.g. career progression). Contributions will grow at inflation + this rate. Set to 0 if you expect salary to only track inflation." />
                </Label>
                <Input
                  id="pp-salary-growth"
                  type="number"
                  min={0}
                  max={5}
                  step={0.5}
                  placeholder="0"
                  value={proj.salaryGrowthRate ?? ''}
                  onChange={e => updateProjection({ salaryGrowthRate: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pp-lsa" className="text-xs">
                  Lump sum allowance override (£)
                  <HelpTooltip content={`The standard tax-free lump sum is capped at £${rules.lumpSumAllowance.toLocaleString()}. If you have a protected allowance (e.g. from before April 2024), enter your higher limit here.`} />
                </Label>
                <Input
                  id="pp-lsa"
                  type="number"
                  min={0}
                  step={1000}
                  placeholder={rules.lumpSumAllowance.toLocaleString()}
                  value={proj.lumpSumAllowanceOverride ?? ''}
                  onChange={e => updateProjection({ lumpSumAllowanceOverride: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
            </div>
            {((proj.annualFeeRate ?? 0) > 0 || (proj.salaryGrowthRate ?? 0) > 0) && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                {(proj.annualFeeRate ?? 0) > 0 && (
                  <p>Net growth rate: {(proj.assumedGrowthRate - (proj.annualFeeRate ?? 0)).toFixed(1)}% ({proj.assumedGrowthRate}% growth minus {proj.annualFeeRate}% fees)</p>
                )}
                {(proj.salaryGrowthRate ?? 0) > 0 && (
                  <p>Contributions grow at {(proj.inflationRate + (proj.salaryGrowthRate ?? 0)).toFixed(1)}%/yr ({proj.inflationRate}% inflation + {proj.salaryGrowthRate}% real growth)</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Projection results */}
      {hasInput && projection.yearsToAccess > 0 && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Projected pot at age {proj.pensionAccessAge}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Switch
                    id="pp-todays-money"
                    checked={showInTodaysMoney}
                    onCheckedChange={setShowInTodaysMoney}
                  />
                  <Label htmlFor="pp-todays-money" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                    Today's £
                    <HelpTooltip content="Show projected values in today's purchasing power by discounting for inflation. Helps you understand what future amounts are really worth." />
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-x-3 sm:gap-x-6 gap-y-1 text-xs">
                <span className="text-muted-foreground">Years to access</span>
                <span className="text-right font-medium">{projection.yearsToAccess}</span>

                <span className="text-muted-foreground">Annual contributions</span>
                <span className="text-right font-medium">{formatCurrency(totalPensionFunding)}/yr</span>

                <span className="text-muted-foreground">Total contributions over period</span>
                <span className="text-right font-medium">{formatCurrency(projection.totalContributions)}</span>

                <span className="text-muted-foreground font-medium border-t pt-1">Projected pot</span>
                <span className="text-right font-medium border-t pt-1">{fmt(projection.projectedPotAtAccess, projection.yearsToAccess)}</span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 sm:gap-x-6 gap-y-1 text-xs border-t pt-2">
                {!proj.drawdownTaxFreeFirst && (
                  <>
                    <span className="text-muted-foreground">
                      Tax-free lump sum (25%)
                      {projection.lsaCapped && (
                        <span className="text-amber-600 dark:text-amber-400"> — capped at LSA</span>
                      )}
                    </span>
                    <span className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {fmt(projection.taxFreeLumpSum, projection.yearsToAccess)}
                    </span>
                  </>
                )}

                <span className="text-muted-foreground">Drawdown pot</span>
                <span className="text-right font-medium">{fmt(projection.drawdownPot, projection.yearsToAccess)}</span>

                <div className="col-span-2 flex items-center gap-2 pt-1">
                  <Switch
                    id="pp-tax-free-first"
                    checked={proj.drawdownTaxFreeFirst ?? false}
                    onCheckedChange={(checked: boolean) => updateProjection({ drawdownTaxFreeFirst: checked })}
                  />
                  <Label htmlFor="pp-tax-free-first" className="text-xs text-muted-foreground cursor-pointer">
                    Use tax-free allowance gradually
                    <HelpTooltip content="Instead of taking 25% as a lump sum upfront, withdrawals are tax-free until the allowance is depleted. This keeps more in the pot to grow but means early withdrawals are untaxed and later ones fully taxed." />
                  </Label>
                </div>
              </div>

              {/* Retirement income breakdown */}
              {hasIncomeNeeded && (
                <div className="grid grid-cols-2 gap-x-3 sm:gap-x-6 gap-y-1 text-xs border-t pt-2">
                  <span className="text-muted-foreground">
                    Income needed today
                  </span>
                  <span className="text-right font-medium">{formatCurrency(proj.annualIncomeNeeded)}/yr</span>

                  {!showInTodaysMoney && (
                    <>
                      <span className="text-muted-foreground">
                        Income needed at age {proj.pensionAccessAge}
                        <HelpTooltip content={`Today's £${proj.annualIncomeNeeded.toLocaleString()} inflated at ${proj.inflationRate}% per year for ${projection.yearsToAccess} years.`} />
                      </span>
                      <span className="text-right font-medium">{formatCurrency(projection.inflatedAnnualIncome)}/yr</span>
                    </>
                  )}

                  {/* State Pension line */}
                  {projection.statePensionAnnual > 0 && (
                    <>
                      <span className="text-muted-foreground">
                        State Pension
                        {projection.projectedNIYears != null && projection.projectedNIYears > (proj.qualifyingNIYears ?? 0) && (
                          <span className="text-muted-foreground/70"> ({projection.projectedNIYears}/35 yrs projected)</span>
                        )}
                        {(proj.statePensionAge ?? rules.statePensionDefaultAge) > proj.pensionAccessAge && (
                          <span className="text-amber-600 dark:text-amber-400"> (from age {proj.statePensionAge ?? rules.statePensionDefaultAge})</span>
                        )}
                      </span>
                      <span className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {showInTodaysMoney ? formatCurrency(projection.statePensionAnnual) : fmt(projection.statePensionAnnual)}/yr
                      </span>
                    </>
                  )}

                  {/* DB Pension line */}
                  {projection.dbPensionAnnualAtAccess > 0 && (
                    <>
                      <span className="text-muted-foreground">
                        DB pension income
                        {!showInTodaysMoney && projection.yearsToAccess > 0 && (
                          <span className="text-muted-foreground/70"> (at age {proj.pensionAccessAge})</span>
                        )}
                      </span>
                      <span className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {showInTodaysMoney ? formatCurrency(proj.dbPensionAnnualIncome ?? 0) : formatCurrency(projection.dbPensionAnnualAtAccess)}/yr
                      </span>
                    </>
                  )}

                  {/* DC income needed */}
                  {(projection.statePensionAnnual > 0 || projection.dbPensionAnnualAtAccess > 0) && (
                    <>
                      <span className="text-muted-foreground font-medium border-t pt-1">
                        DC pot must provide
                        <HelpTooltip content="Income your private pension drawdown needs to provide, after State Pension and DB pension are subtracted." />
                      </span>
                      <span className="text-right font-medium border-t pt-1">
                        {fmt(projection.dcIncomeNeeded, showInTodaysMoney ? projection.yearsToAccess : 0)}/yr
                      </span>
                    </>
                  )}

                  {/* Drawdown tax estimate */}
                  {projection.firstYearTax > 0 && (
                    <>
                      <span className="text-muted-foreground border-t pt-1">
                        Est. income tax (first year)
                        <HelpTooltip content="Estimated income tax on your total retirement income (DC drawdown + State Pension + DB pension), based on current tax bands including Personal Allowance taper above £100k. Pension withdrawals are taxed as income." />
                      </span>
                      <span className="text-right font-medium text-red-600 dark:text-red-400 border-t pt-1">
                        -{fmt(projection.firstYearTax, projection.yearsToAccess)}
                      </span>
                      <span className="text-muted-foreground">Est. net income (first year)</span>
                      <span className="text-right font-medium">
                        {fmt(projection.firstYearNetIncome, projection.yearsToAccess)}/yr
                      </span>
                    </>
                  )}

                  {/* Years the pot lasts */}
                  <span className="text-muted-foreground font-medium border-t pt-1">
                    Drawdown pot lasts
                  </span>
                  {potNeverDepletes ? (
                    <span className="text-right font-medium border-t pt-1 text-emerald-600 dark:text-emerald-400">
                      Indefinitely
                    </span>
                  ) : (
                    <span className={`text-right font-medium border-t pt-1 ${
                      projection.yearsOfIncome >= 25
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : projection.yearsOfIncome >= 15
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}>
                      ~{Math.floor(projection.yearsOfIncome)} years
                    </span>
                  )}

                  {/* Depletion age callout */}
                  {depletionAge != null && (
                    <>
                      <span className="text-muted-foreground">Pot runs out at age</span>
                      <span className={`text-right font-medium ${
                        depletionAge >= 90
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : depletionAge >= 80
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}>
                        {depletionAge}
                      </span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Growth chart */}
          {chartData.length > 1 && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Pension pot — accumulation{hasIncomeNeeded ? ' & drawdown' : ''}{showInTodaysMoney ? ' (today\'s £)' : ''}
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                    <defs>
                      <linearGradient id="potGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#059669" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="age"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(v: number) => v >= 1_000_000 ? `£${(v / 1_000_000).toFixed(1)}m` : `£${(v / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload as {
                          pot: number; change: number
                          contribution: number; growth: number; withdrawal: number
                        }
                        return (
                          <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
                            <p className="font-medium mb-1">Age {label}</p>
                            <p>Pot: {formatCurrency(d.pot)}</p>
                            <div className="border-t mt-1.5 pt-1.5 space-y-0.5 text-muted-foreground">
                              {d.contribution > 0 && (
                                <p>Contributions: <span className="text-foreground">+{formatCurrency(d.contribution)}</span></p>
                              )}
                              <p>Growth: <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(d.growth)}</span></p>
                              {d.withdrawal > 0 && (
                                <p>Withdrawal: <span className="text-red-600 dark:text-red-400">-{formatCurrency(d.withdrawal)}</span></p>
                              )}
                            </div>
                            <p className={`border-t mt-1.5 pt-1.5 font-medium ${d.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              Net change: {d.change >= 0 ? '+' : ''}{formatCurrency(d.change)}
                            </p>
                          </div>
                        )
                      }}
                    />
                    <ReferenceLine
                      x={proj.pensionAccessAge}
                      stroke="#6b7280"
                      strokeDasharray="4 2"
                      strokeWidth={1}
                      label={{ value: 'Retirement', position: 'top', fill: '#6b7280', fontSize: 10 }}
                    />
                    {projection.statePensionAnnual > 0 && (proj.statePensionAge ?? rules.statePensionDefaultAge) > proj.pensionAccessAge && (
                      <ReferenceLine
                        x={proj.statePensionAge ?? rules.statePensionDefaultAge}
                        stroke="#3b82f6"
                        strokeDasharray="4 2"
                        strokeWidth={1}
                        label={{ value: 'State Pension', position: 'top', fill: '#3b82f6', fontSize: 10 }}
                      />
                    )}
                    {depletionAge != null && (
                      <ReferenceLine
                        x={depletionAge}
                        stroke="#ef4444"
                        strokeDasharray="4 2"
                        strokeWidth={1}
                        label={{ value: 'Pot depleted', position: 'top', fill: '#ef4444', fontSize: 10 }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="pot"
                      stroke="#059669"
                      strokeWidth={2}
                      fill="url(#potGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Scenario comparison table */}
          {scenarioProjections.length > 1 && (
            <Card>
              <CardContent className="pt-4 overflow-x-auto">
                <p className="text-xs text-muted-foreground mb-3">
                  Projected pot at different contribution levels
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b">
                      <th className="text-left pb-2 font-medium">Contribution</th>
                      <th className="text-right pb-2 font-medium">Projected Pot</th>
                      {hasIncomeNeeded && (
                        <th className="text-right pb-2 font-medium">Lasts</th>
                      )}
                      <th className="text-right pb-2 font-medium">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarioProjections.map((s, i) => (
                      <tr key={s.label} className="border-b last:border-0">
                        <td className="py-2 pr-2 sm:pr-4">
                          <div className={i === 0 ? 'font-medium' : 'text-muted-foreground'}>
                            {s.label}
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatCurrency(s.annualContribution)}/yr
                          </div>
                        </td>
                        <td className="py-2 pl-2 text-right tabular-nums whitespace-nowrap">
                          {formatCurrency(s.projectedPot)}
                        </td>
                        {hasIncomeNeeded && (
                          <td className="py-2 pl-2 text-right tabular-nums whitespace-nowrap">
                            ~{Math.floor(s.yearsOfIncome)} yrs
                          </td>
                        )}
                        <td className="py-2 pl-2 text-right tabular-nums whitespace-nowrap">
                          {i === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className={s.differenceVsBaseline >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                            }>
                              {s.differenceVsBaseline >= 0 ? '+' : ''}{formatCurrency(s.differenceVsBaseline)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-muted-foreground">
            Projection assumes {proj.assumedGrowthRate}% annual growth
            {(proj.annualFeeRate ?? 0) > 0 ? ` minus ${proj.annualFeeRate}% fees (net ${(proj.assumedGrowthRate - (proj.annualFeeRate ?? 0)).toFixed(1)}%)` : ''}
            . Contributions rise with {(proj.salaryGrowthRate ?? 0) > 0 ? `inflation + real salary growth (${(proj.inflationRate + (proj.salaryGrowthRate ?? 0)).toFixed(1)}%)` : `inflation (${proj.inflationRate}%)`} to reflect expected salary increases.
            {hasIncomeNeeded && ` Income needs also inflated at ${proj.inflationRate}% per year. Drawdown assumes the pot continues to grow at the same rate while income is withdrawn annually. `}
            Tax-free lump sum is capped at the Lump Sum Allowance (£{(proj.lumpSumAllowanceOverride ?? rules.lumpSumAllowance).toLocaleString()}).
            {projection.firstYearTax > 0 && ' Income tax estimates use current tax bands (including Personal Allowance taper) and may differ in retirement.'}
            {projection.projectedNIYears != null && projection.projectedNIYears > (proj.qualifyingNIYears ?? 0) && ` State Pension assumes continued NI contributions until retirement (${projection.projectedNIYears}/35 years).`}
          </p>
        </>
      )}
    </div>
  )
}
