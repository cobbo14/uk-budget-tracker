import { Plus, TrendingUp, Undo2 } from 'lucide-react'
import { useBudget } from '@/hooks/useBudget'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { GainCard } from './GainCard'
import { GainFormDialog } from './GainFormDialog'
import { OPEN_ADD_GAIN_DIALOG, UPDATE_SETTINGS } from '@/store/actions'
import { formatCurrency } from '@/utils/formatting'
import { cn } from '@/lib/utils'
import type { ISAContributions } from '@/types'

const ISA_ANNUAL_LIMIT = 20_000
const LISA_ANNUAL_MAX = 4_000

export function GainsView() {
  const { gainSources, taxSummary, settings, rules, dispatch, canUndo, undo } = useBudget()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Capital Gains</h2>
          <p className="text-sm text-muted-foreground">
            Total gains: {formatCurrency(taxSummary.totalGains)}
            {taxSummary.carryForwardLossesApplied > 0 && (
              <> · losses applied: −{formatCurrency(taxSummary.carryForwardLossesApplied)}</>
            )}
            {taxSummary.capitalGainsTax > 0 && (
              <> · CGT due: {formatCurrency(taxSummary.capitalGainsTax)}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled={!canUndo} onClick={undo} title="Undo (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
          <Button data-tour="add-gain-btn" onClick={() => dispatch({ type: OPEN_ADD_GAIN_DIALOG })}>
            <Plus className="h-4 w-4" />
            Add Gain
          </Button>
        </div>
      </div>

      {gainSources.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 sm:p-12 text-center">
          <TrendingUp className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No capital gains recorded</p>
          <p className="mt-1 text-sm text-muted-foreground">Add disposals of shares, property, or other assets.</p>
          <Button className="mt-4" onClick={() => dispatch({ type: OPEN_ADD_GAIN_DIALOG })}>
            <Plus className="h-4 w-4" />
            Add Capital Gain
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {gainSources.map(gain => (
            <GainCard key={gain.id} gain={gain} />
          ))}
        </div>
      )}

      {/* BADR summary line */}
      {taxSummary.badrGains > 0 && (
        <div data-search="badr-summary" className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 text-sm space-y-1">
          <p className="font-medium text-emerald-700 dark:text-emerald-300">Business Asset Disposal Relief applied</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            BADR gains: {formatCurrency(taxSummary.badrGains)} · CGT at BADR rate: {formatCurrency(taxSummary.badrTax)}
          </p>
        </div>
      )}

      {/* Capital loss carry-forward */}
      <div data-search="carried-forward-losses" className="rounded-lg border bg-muted/30 px-4 py-3 text-sm space-y-3">
        <p className="font-medium">Prior-year losses carried forward</p>
        <p className="text-xs text-muted-foreground">
          Enter capital losses carried forward from previous tax years. These are applied against this year's gains before the £{rules.cgtAnnualExemptAmount.toLocaleString()} annual exempt amount.
        </p>
        <div className="grid gap-1.5 w-full max-w-xs">
          <Label htmlFor="capital-loss-cf">Carried-forward capital losses (£)</Label>
          <Input
            id="capital-loss-cf"
            type="number"
            min="0"
            step="100"
            placeholder="0"
            value={settings.capitalLossCarryForward || ''}
            onChange={e => dispatch({ type: UPDATE_SETTINGS, payload: { capitalLossCarryForward: parseFloat(e.target.value) || 0 } })}
          />
        </div>
        {(settings.capitalLossCarryForward ?? 0) > 0 && (
          <p className="text-muted-foreground text-xs">
            Pool available: {formatCurrency(settings.capitalLossCarryForward)}
            {taxSummary.carryForwardLossesApplied > 0 && (
              <> · applied this year: −{formatCurrency(taxSummary.carryForwardLossesApplied)}
              · pool remaining: {formatCurrency(Math.max(0, settings.capitalLossCarryForward - taxSummary.carryForwardLossesApplied))}</>
            )}
          </p>
        )}
      </div>

      {/* ISA Allowance Tracker */}
      {(() => {
        const isa = settings.isaContributions ?? { cashISA: 0, stocksAndSharesISA: 0, lisaISA: 0, innovativeFinanceISA: 0 }
        const total = (isa.cashISA ?? 0) + (isa.stocksAndSharesISA ?? 0) + (isa.lisaISA ?? 0) + (isa.innovativeFinanceISA ?? 0)
        const remaining = ISA_ANNUAL_LIMIT - total
        const overLimit = total > ISA_ANNUAL_LIMIT
        const lisaOverLimit = (isa.lisaISA ?? 0) > LISA_ANNUAL_MAX
        const usedPct = Math.min(100, (total / ISA_ANNUAL_LIMIT) * 100)

        return (
          <Card data-search="isa-tracker">
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

      <GainFormDialog />
    </div>
  )
}
