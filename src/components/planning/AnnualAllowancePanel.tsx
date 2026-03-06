import { useBudget } from '@/hooks/useBudget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/utils/formatting'
import { cn } from '@/lib/utils'
import { UPDATE_SETTINGS } from '@/store/actions'
import { HelpTooltip } from '@/components/ui/tooltip'
import type { PensionCarryForward } from '@/types'

export function AnnualAllowancePanel() {
  const { taxSummary, settings, rules, dispatch } = useBudget()

  const {
    totalPensionFunding,
    employerPensionFunding,
    effectiveAnnualAllowance,
    totalAnnualAllowanceAvailable,
    annualAllowanceExcess,
    annualAllowanceCharge,
    annualAllowanceRemaining,
  } = taxSummary

  // Only show if the user has any pension activity or employer contributions
  if (totalPensionFunding === 0 && employerPensionFunding === 0) return null

  const carryForward = settings.pensionCarryForward ?? { threeYearsAgo: 0, twoYearsAgo: 0, oneYearAgo: 0 }
  const totalCarryForward = (carryForward.threeYearsAgo ?? 0) + (carryForward.twoYearsAgo ?? 0) + (carryForward.oneYearAgo ?? 0)

  const isOver = annualAllowanceExcess > 0
  const isTapered = effectiveAnnualAllowance < rules.pensionAnnualAllowance
  const pct = Math.min(100, (totalPensionFunding / totalAnnualAllowanceAvailable) * 100)
  const barColor = isOver ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">Pension Annual Allowance</h3>
      <Card className={cn('border', isOver && 'border-red-300 dark:border-red-800')}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Annual Allowance Check</CardTitle>
            <span className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              isOver
                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
            )}>
              {isOver ? `${formatCurrency(annualAllowanceExcess)} excess` : 'Within allowance'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Funding breakdown */}
          <div className="grid grid-cols-2 gap-x-3 sm:gap-x-6 gap-y-1 text-xs">
            <span className="text-muted-foreground">Employee contributions</span>
            <span className="text-right font-medium">{formatCurrency(taxSummary.totalDeductions)}</span>
            {employerPensionFunding > 0 && (
              <>
                <span className="text-muted-foreground">Employer contributions</span>
                <span className="text-right font-medium">{formatCurrency(employerPensionFunding)}</span>
              </>
            )}
            <span className="text-muted-foreground font-medium border-t pt-1">Total pension funding</span>
            <span className="text-right font-medium border-t pt-1">{formatCurrency(totalPensionFunding)}</span>
          </div>

          {/* Allowance breakdown */}
          <div className="grid grid-cols-2 gap-x-3 sm:gap-x-6 gap-y-1 text-xs mt-1">
            <span className="text-muted-foreground">
              Annual Allowance{isTapered ? ' (tapered)' : ''}
            </span>
            <span className="text-right font-medium">{formatCurrency(effectiveAnnualAllowance)}</span>
            {totalCarryForward > 0 && (
              <>
                <span className="text-muted-foreground">Carry-forward available</span>
                <span className="text-right font-medium">{formatCurrency(totalCarryForward)}</span>
              </>
            )}
            <span className="text-muted-foreground font-medium border-t pt-1">Total available</span>
            <span className="text-right font-medium border-t pt-1">{formatCurrency(totalAnnualAllowanceAvailable)}</span>
          </div>

          {/* Progress bar */}
          <div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', barColor)}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatCurrency(totalPensionFunding)} funded</span>
              <span>{formatCurrency(totalAnnualAllowanceAvailable)} available</span>
            </div>
          </div>

          {/* Taper note */}
          {isTapered && (
            <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-900/20 rounded-md px-3 py-2">
              ⚠ Your Annual Allowance is tapered to {formatCurrency(effectiveAnnualAllowance)} because your adjusted income exceeds £{rules.pensionTaperAdjustedIncome.toLocaleString()}.
              The minimum allowance is {formatCurrency(rules.pensionAnnualAllowanceMinimum)}.
            </p>
          )}

          {/* Remaining headroom note */}
          {!isOver && annualAllowanceRemaining > 0 && (
            <p className="text-xs text-muted-foreground">
              You have {formatCurrency(annualAllowanceRemaining)} of unused Annual Allowance this year
              {totalCarryForward === 0 ? ' — this can be carried forward for up to 3 years.' : '.'}
            </p>
          )}

          {/* Excess warning + toggle */}
          {isOver && (
            <>
              <p className="text-xs text-muted-foreground bg-red-50 dark:bg-red-900/20 rounded-md px-3 py-2">
                ⚠ You have exceeded your total pension Annual Allowance by {formatCurrency(annualAllowanceExcess)}.
                An Annual Allowance charge of {formatCurrency(annualAllowanceCharge)} applies at your marginal income tax rate.
              </p>
              <div className="flex items-center gap-3">
                <Switch
                  id="include-aa-charge"
                  checked={settings.includeAnnualAllowanceCharge ?? true}
                  onCheckedChange={v => dispatch({ type: UPDATE_SETTINGS, payload: { includeAnnualAllowanceCharge: v } })}
                />
                <Label htmlFor="include-aa-charge" className="text-xs">
                  {(settings.includeAnnualAllowanceCharge ?? true)
                    ? 'AA charge included in tax total'
                    : 'AA charge excluded from tax total (e.g. Scheme Pays)'}
                </Label>
              </div>
            </>
          )}

          {/* Carry-forward breakdown */}
          {totalCarryForward > 0 && (
            <div className="text-xs text-muted-foreground space-y-0.5 border-t pt-2">
              <p className="font-medium">Carry-forward breakdown</p>
              {(carryForward.threeYearsAgo ?? 0) > 0 && (
                <p>3 years ago: {formatCurrency(carryForward.threeYearsAgo)}</p>
              )}
              {(carryForward.twoYearsAgo ?? 0) > 0 && (
                <p>2 years ago: {formatCurrency(carryForward.twoYearsAgo)}</p>
              )}
              {(carryForward.oneYearAgo ?? 0) > 0 && (
                <p>1 year ago: {formatCurrency(carryForward.oneYearAgo)}</p>
              )}
            </div>
          )}

          {/* Carry-forward inputs */}
          <div className="space-y-3 border-t pt-3">
            <p className="text-xs font-medium">
              Enter unused Annual Allowance from previous years
              <HelpTooltip content="Unused Annual Allowance from the previous 3 tax years can be carried forward to increase this year's pension contribution limit." />
            </p>
            <p className="text-xs text-muted-foreground">
              Carry-forward can only be used once the current year's AA (£{rules.pensionAnnualAllowance.toLocaleString()}) is fully used.
            </p>
            {(
              [
                ['threeYearsAgo', '3 years ago'] as const,
                ['twoYearsAgo', '2 years ago'] as const,
                ['oneYearAgo', '1 year ago'] as const,
              ] as Array<[keyof PensionCarryForward, string]>
            ).map(([key, label]) => (
              <div key={key} className="grid gap-1.5 max-w-xs">
                <Label htmlFor={`aa-carry-${key}`}>Unused AA — {label} (£)</Label>
                <Input
                  id={`aa-carry-${key}`}
                  type="number"
                  min="0"
                  max={rules.pensionAnnualAllowance}
                  step="100"
                  placeholder="0"
                  value={(settings.pensionCarryForward?.[key] ?? 0) || ''}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0
                    dispatch({
                      type: UPDATE_SETTINGS,
                      payload: {
                        pensionCarryForward: {
                          ...(settings.pensionCarryForward ?? { threeYearsAgo: 0, twoYearsAgo: 0, oneYearAgo: 0 }),
                          [key]: val,
                        },
                      },
                    })
                  }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
