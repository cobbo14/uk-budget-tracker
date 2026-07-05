import { useMemo, useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { useBudget } from '@/hooks/useBudget'
import { HelpTooltip } from '@/components/ui/tooltip'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { UPDATE_SETTINGS, UPDATE_INCOME, HYDRATE } from '@/store/actions'
import { getAvailableTaxYears, getTaxRules } from '@/taxRules'
import { exportStateAsJSON, parseImportedState, mergeWithDefaults } from '@/services/localStorage'
import { generateCSV } from '@/utils/exportUtils'
import { generateId } from '@/utils/ids'
import { calculateTax, resolveSalarySacrificeItem } from '@/utils/taxCalculations'
import { formatCurrency } from '@/utils/formatting'
import type { StudentLoanPlan, AppSettings, IncomeSource } from '@/types'
import { useEmployeeMode } from '@/hooks/useEmployeeMode'

const STUDENT_LOAN_LABELS: Record<StudentLoanPlan, string> = {
  none: 'None',
  plan1: 'Plan 1 (pre-2012)',
  plan2: 'Plan 2 (post-2012)',
  plan4: 'Plan 4 (Scotland)',
  plan5: 'Plan 5 (England/Wales, started uni Sept 2023+)',
  postgrad: 'Postgraduate Loan',
}

export function SettingsView() {
  const { state, settings, dispatch, rules, taxSummary, incomeSources } = useBudget()
  const employeeMode = useEmployeeMode()
  const budgetingMode = localStorage.getItem('budgetingMode') === 'true'
  const years = getAvailableTaxYears()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [lastExported, setLastExported] = useState<string | null>(() => {
    const stored = localStorage.getItem('lastExported')
    return stored ? new Date(parseInt(stored)).toLocaleDateString('en-GB') : null
  })

  function update(partial: Partial<AppSettings>) {
    dispatch({ type: UPDATE_SETTINGS, payload: partial })
  }

  // Salary-sacrifice pension items live on the employment source (they reduce
  // that job's NI-able pay) but are edited from this card
  const employmentSources = incomeSources.filter(s => s.type === 'employment')
  const pensionSacrificeItems = (s: IncomeSource) =>
    (s.salarySacrificeItems ?? []).filter(i => i.type === 'pension')

  // Bases for percentage-type contributions (mirror the engine)
  const qualifyingEarningsTotal = employmentSources.reduce((sum, s) => {
    const sacrifice = (s.salarySacrificeItems ?? []).reduce((a, i) => a + resolveSalarySacrificeItem(i, s, rules), 0)
    const pay = Math.max(0, s.grossAmount + (s.bonus ?? 0) - sacrifice)
    return sum + Math.max(0, Math.min(pay, rules.qualifyingEarningsUpper) - rules.qualifyingEarningsLower)
  }, 0)
  const pensionEligibleIncome =
    Math.max(0, taxSummary.employmentGross - taxSummary.salarySacrificeTotal) +
    Math.max(0, taxSummary.selfEmploymentGross - taxSummary.selfEmploymentAllowableExpenses)

  // "Which pension type do I have?" helper panel
  const [showTypeGuide, setShowTypeGuide] = useState(false)
  // Per-row monthly-entry toggles, keyed by row id (storage stays annual)
  const [monthlyEntry, setMonthlyEntry] = useState<Record<string, boolean>>({})
  const toggleMonthly = (key: string) =>
    setMonthlyEntry(m => ({ ...m, [key]: !m[key] }))

  // Live impact of the user's own contributions: diff against a baseline with
  // all personal contributions removed (employer kept — it never affects tax)
  const pensionImpact = useMemo(() => {
    if (taxSummary.totalPensionFunding <= 0) return null
    const strippedSources = incomeSources.map(s => {
      const items = (s.salarySacrificeItems ?? []).filter(i => i.type !== 'pension')
      return { ...s, salarySacrificeItems: items.length > 0 ? items : undefined }
    })
    const baseline = calculateTax(
      strippedSources,
      { ...settings, pensionContributionType: 'none', pensionContributionValue: 0, sippContribution: 0 },
      rules,
      state.gainSources,
    )
    return {
      taxSaved: Math.max(0, baseline.totalTax - taxSummary.totalTax),
      netCost: Math.max(0, baseline.netIncome - taxSummary.netIncome),
    }
  }, [incomeSources, settings, rules, taxSummary, state.gainSources])

  function updateSacrifice(source: IncomeSource, amount: number, amountType: 'flat' | 'percentage' | 'qualifying') {
    const items = source.salarySacrificeItems ?? []
    const pension = items.filter(i => i.type === 'pension')
    const others = items.filter(i => i.type !== 'pension')
    const next = amount > 0
      ? [...others, pension.length === 1
          ? { ...pension[0], annualAmount: amount, amountType }
          : { id: generateId(), type: 'pension' as const, name: 'Salary Sacrifice Pension', annualAmount: amount, amountType }]
      : others
    dispatch({
      type: UPDATE_INCOME,
      payload: { ...source, salarySacrificeItems: next.length > 0 ? next : undefined },
    })
  }

  const taxRuleInfo = getTaxRules(settings.taxYear)

  function handleExport() {
    const json = exportStateAsJSON(state)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'budget-tracker-export.json'
    a.click()
    URL.revokeObjectURL(url)
    const now = new Date().toLocaleDateString('en-GB')
    setLastExported(now)
    localStorage.setItem('lastExported', Date.now().toString())
  }

  function handleExportCSV() {
    const csv = generateCSV(state, taxSummary)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'budget-tracker-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text !== 'string') { setImportStatus('error'); return }
      const parsed = parseImportedState(text)
      if (!parsed) { setImportStatus('error'); return }
      // Merge over defaults so exports from older versions can't leave
      // newer settings fields undefined
      dispatch({ type: HYDRATE, payload: mergeWithDefaults(parsed) })
      setImportStatus('success')
      setTimeout(() => setImportStatus('idle'), 3000)
    }
    reader.onerror = () => setImportStatus('error')
    reader.readAsText(file)
    // Reset the input so the same file can be re-imported if needed
    e.target.value = ''
  }

  return (
    <div data-tour="settings-view" className="space-y-6">
      <h2 className="text-xl font-semibold">Settings</h2>

      {/* Tax year */}
      <Card data-search="settings-tax-year">
        <CardHeader>
          <CardTitle className="text-base">Tax Year</CardTitle>
          <CardDescription>
            Select the tax year for calculations. Currently using rules for {taxRuleInfo.label}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
            <Label>Tax Year</Label>
            <Select value={settings.taxYear} onValueChange={v => update({ taxYear: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y}>{getTaxRules(y).label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Personal Allowance: £{rules.personalAllowance.toLocaleString()} ·{' '}
            Basic Rate threshold: £{(rules.personalAllowance + rules.incomeTaxBands[0].to).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Scottish taxpayer */}
      <Card data-search="settings-scottish">
        <CardHeader>
          <CardTitle className="text-base">Scottish Taxpayer</CardTitle>
          <CardDescription>
            If you live in Scotland, Scottish income tax rates apply (different bands from England/Wales/NI).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              id="scottish"
              checked={settings.scottishTaxpayer}
              onCheckedChange={v => update({ scottishTaxpayer: v })}
            />
            <Label htmlFor="scottish">
              {settings.scottishTaxpayer ? 'Scottish rates active' : 'England/Wales/NI rates active'}
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Pension */}
      <Card data-search="settings-pension">
        <CardHeader>
          <CardTitle className="text-base">Pension Contributions</CardTitle>
          <CardDescription>
            All pension contributions in one place — salary sacrifice, workplace (net pay), SIPP, and
            employer. Each type is taxed differently; enter each contribution under the row that matches
            how it is paid. Everything counts toward the
            £{rules.pensionAnnualAllowance.toLocaleString()} Annual Allowance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Live impact of current contributions */}
          {taxSummary.totalPensionFunding > 0 && pensionImpact && (
            <div className="rounded-md bg-muted/50 px-3 py-2 space-y-1">
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs sm:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">Into your pension</p>
                  <p className="font-medium">{formatCurrency(taxSummary.totalPensionFunding)}/yr</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tax & NI saved</p>
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(pensionImpact.taxSaved)}/yr</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Net cost to you</p>
                  <p className="font-medium">{formatCurrency(pensionImpact.netCost)}/yr</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Annual Allowance used</p>
                  <p className="font-medium">
                    {Math.round((taxSummary.totalPensionFunding / Math.max(1, taxSummary.totalAnnualAllowanceAvailable)) * 100)}%
                    <span className="font-normal text-muted-foreground"> of {formatCurrency(taxSummary.totalAnnualAllowanceAvailable)}</span>
                  </p>
                </div>
              </div>
              {taxSummary.annualAllowanceExcess > 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  ⚠ {formatCurrency(taxSummary.annualAllowanceExcess)} over your Annual Allowance —
                  estimated charge {formatCurrency(taxSummary.annualAllowanceCharge)}.{' '}
                  <a href="#planning" className="underline underline-offset-2">Planning → Annual Allowance</a>
                </p>
              )}
            </div>
          )}

          {/* Quick actions & guidance */}
          <div className="flex flex-wrap items-center gap-2">
            {employmentSources.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => update({
                  pensionContributionType: 'qualifying',
                  pensionContributionValue: 5,
                  employerPensionContributionType: 'qualifying',
                  employerPensionContributionValue: 3,
                })}
              >
                Use auto-enrolment minimums (5% + 3% employer)
                <HelpTooltip content="The legal minimum for auto-enrolment: 8% of qualifying earnings in total, of which at least 3% comes from your employer." />
              </Button>
            )}
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              onClick={() => setShowTypeGuide(v => !v)}
            >
              Not sure which type you have?
            </button>
          </div>
          {showTypeGuide && (
            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Check your payslip:</p>
              <p><strong>Salary sacrifice</strong> — your gross salary itself is shown lower than your contractual
                salary (often called "salary exchange" or "SMART pension"). Saves Income Tax and NI.</p>
              <p><strong>Net pay arrangement</strong> — your pension is deducted from gross pay before the tax
                calculation, but your gross salary is unchanged. Saves Income Tax only.</p>
              <p><strong>Relief at source</strong> — your pension comes out of take-home pay and the provider adds
                20% on top (NEST, most group personal pensions, all SIPPs). Higher-rate relief is claimed separately.</p>
            </div>
          )}

          {/* Salary sacrifice — per employment source */}
          {employmentSources.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                Salary sacrifice
                <HelpTooltip content="Deducted from gross pay before tax and NI — saves both Income Tax and National Insurance. '% of pay' applies to that job's base salary (bonuses excluded); '% of QE' applies to the job's qualifying earnings — the £6,240–£50,270 auto-enrolment band of pay including bonus." />
              </p>
              <p className="text-xs text-muted-foreground -mt-2">Your contractual gross salary is reduced in exchange for pension contributions.</p>
              {employmentSources.map(source => {
                const pension = pensionSacrificeItems(source)
                if (pension.length > 1) {
                  const total = pension.reduce((a, i) =>
                    a + (i.amountType === 'percentage' ? source.grossAmount * (i.annualAmount / 100) : i.annualAmount), 0)
                  return (
                    <p key={source.id} className="text-xs text-muted-foreground">
                      {source.name}: £{Math.round(total).toLocaleString()}/year across {pension.length} pension
                      sacrifice items — edit them on the Income tab.
                    </p>
                  )
                }
                const item = pension[0]
                const amountType = item?.amountType ?? 'percentage'
                const monthly = amountType === 'flat' && (monthlyEntry[`sacrifice-${source.id}`] ?? false)
                const totalSacrifice = (source.salarySacrificeItems ?? []).reduce((a, i) =>
                  a + resolveSalarySacrificeItem(i, source, rules), 0)
                return (
                  <div key={source.id} className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`sacrifice-${source.id}`}>
                        {employmentSources.length > 1 ? source.name : 'Your salary sacrifice'}
                        {amountType === 'flat' ? (monthly ? ' (£/month)' : ' (£/year)') : amountType === 'qualifying' ? ' (% of qualifying earnings)' : ' (%)'}
                      </Label>
                      {amountType === 'flat' && (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                          onClick={() => toggleMonthly(`sacrifice-${source.id}`)}
                        >
                          Enter {monthly ? 'yearly' : 'monthly'}
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id={`sacrifice-${source.id}`}
                        type="number"
                        min="0"
                        max={amountType !== 'flat' ? 100 : undefined}
                        step={amountType !== 'flat' ? '0.5' : monthly ? '10' : '100'}
                        placeholder="0"
                        className="flex-1"
                        value={item ? (monthly ? +(item.annualAmount / 12).toFixed(2) : item.annualAmount) : ''}
                        onChange={e => updateSacrifice(source, (parseFloat(e.target.value) || 0) * (monthly ? 12 : 1), amountType)}
                      />
                      <Select
                        value={amountType}
                        onValueChange={v => item && updateSacrifice(source, item.annualAmount, v as 'flat' | 'percentage' | 'qualifying')}
                      >
                        <SelectTrigger className="w-32 shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">% of pay</SelectItem>
                          <SelectItem value="qualifying">% of QE</SelectItem>
                          <SelectItem value="flat">£/year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {item && amountType !== 'flat' && item.annualAmount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        = £{Math.round(resolveSalarySacrificeItem(item, source, rules)).toLocaleString()}/yr
                        {amountType === 'qualifying' && ' on this job\'s qualifying earnings'}
                      </p>
                    )}
                    {totalSacrifice > source.grossAmount + (source.bonus ?? 0) && (
                      <p className="text-xs text-destructive">
                        ⚠ Total salary sacrifice exceeds this job's pay of {formatCurrency(source.grossAmount + (source.bonus ?? 0))}.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Employee contributions (workplace net pay) */}
          <div className={employmentSources.length > 0 ? 'space-y-3 pt-2 border-t' : 'space-y-3'}>
            <p className="text-sm font-medium">Taken from gross pay (net pay arrangement)</p>
            <p className="text-xs text-muted-foreground -mt-2">Deducted from your pay before the tax calculation — your gross salary itself is unchanged.</p>
            <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
              <Label>Contribution Type</Label>
              <Select
                value={settings.pensionContributionType}
                onValueChange={v => update({ pensionContributionType: v as AppSettings['pensionContributionType'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="percentage">Percentage of income</SelectItem>
                  <SelectItem value="qualifying">Percentage of qualifying earnings</SelectItem>
                  <SelectItem value="flat">Fixed annual amount (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.pensionContributionType !== 'none' && (() => {
              const monthly = settings.pensionContributionType === 'flat' && (monthlyEntry['pension-value'] ?? false)
              const resolved = settings.pensionContributionType === 'percentage'
                ? Math.min(pensionEligibleIncome * ((settings.pensionContributionValue || 0) / 100), pensionEligibleIncome)
                : settings.pensionContributionType === 'qualifying'
                  ? qualifyingEarningsTotal * ((settings.pensionContributionValue || 0) / 100)
                  : (settings.pensionContributionValue || 0)
              return (
              <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pension-value">
                    {settings.pensionContributionType === 'flat' ? (monthly ? 'Amount (£/month)' : 'Annual Amount (£)')
                      : settings.pensionContributionType === 'qualifying' ? 'Contribution (% of qualifying earnings)'
                      : 'Contribution (%)'}
                  </Label>
                  {settings.pensionContributionType === 'flat' && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                      onClick={() => toggleMonthly('pension-value')}
                    >
                      Enter {monthly ? 'yearly' : 'monthly'}
                    </button>
                  )}
                </div>
                <Input
                  id="pension-value"
                  type="number"
                  min="0"
                  max={settings.pensionContributionType !== 'flat' ? 100 : undefined}
                  step={settings.pensionContributionType !== 'flat' ? '0.5' : monthly ? '10' : '100'}
                  value={settings.pensionContributionValue
                    ? (monthly ? +(settings.pensionContributionValue / 12).toFixed(2) : settings.pensionContributionValue)
                    : ''}
                  onChange={e => update({ pensionContributionValue: (parseFloat(e.target.value) || 0) * (monthly ? 12 : 1) })}
                  placeholder={settings.pensionContributionType === 'flat' ? (monthly ? '200' : '2000') : '5'}
                />
                {settings.pensionContributionType === 'percentage' && (settings.pensionContributionValue || 0) > 0 && (
                  <p className="text-xs text-muted-foreground">= £{Math.round(resolved).toLocaleString()}/yr</p>
                )}
                {settings.pensionContributionType === 'qualifying' && (settings.pensionContributionValue || 0) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    = £{Math.round(resolved).toLocaleString()}/yr
                    on qualifying earnings of £{Math.round(qualifyingEarningsTotal).toLocaleString()}
                    (the £{rules.qualifyingEarningsLower.toLocaleString()}–£{rules.qualifyingEarningsUpper.toLocaleString()} band per job — the auto-enrolment minimum employee rate is 5%).
                  </p>
                )}
                {settings.pensionContributionType === 'flat' && resolved > pensionEligibleIncome && pensionEligibleIncome > 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    ⚠ Capped at your relevant earnings of {formatCurrency(pensionEligibleIncome)} — the excess gets no tax relief.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Net pay (workplace scheme) contributions are deducted from your salary before tax, so you
                  get full marginal-rate relief automatically through payroll — but they do <strong>not</strong> reduce
                  National Insurance (use salary sacrifice above for that). If your pension is relief at
                  source, use the row below instead.
                </p>
              </div>
              )
            })()}
          </div>

          {/* SIPP contributions */}
          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm font-medium">Taken from take-home pay (relief at source)</p>
            <p className="text-xs text-muted-foreground -mt-2">NEST, most group personal pensions and all SIPPs — your provider adds 20% on top of what you pay.</p>
            <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
              <Label>Contribution Type</Label>
              <Select
                value={settings.sippContributionType ?? 'flat'}
                onValueChange={v => update({ sippContributionType: v as AppSettings['sippContributionType'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Fixed annual amount (£)</SelectItem>
                  <SelectItem value="percentage">Percentage of income</SelectItem>
                  <SelectItem value="qualifying">Percentage of qualifying earnings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
              {(() => {
                const sippMonthly = (settings.sippContributionType ?? 'flat') === 'flat' && (monthlyEntry['sipp-contribution'] ?? false)
                return (
                  <>
              <div className="flex items-center justify-between">
                <Label htmlFor="sipp-contribution">
                  {(settings.sippContributionType ?? 'flat') === 'flat' ? (sippMonthly ? 'Contribution (£/month)' : 'Annual Contribution (£)')
                    : settings.sippContributionType === 'qualifying' ? 'Contribution (% of qualifying earnings)'
                    : 'Contribution (% of income)'}
                </Label>
                {(settings.sippContributionType ?? 'flat') === 'flat' && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                    onClick={() => toggleMonthly('sipp-contribution')}
                  >
                    Enter {sippMonthly ? 'yearly' : 'monthly'}
                  </button>
                )}
              </div>
              <Input
                id="sipp-contribution"
                type="number"
                min="0"
                max={(settings.sippContributionType ?? 'flat') !== 'flat' ? 100 : undefined}
                step={(settings.sippContributionType ?? 'flat') !== 'flat' ? '0.5' : sippMonthly ? '10' : '100'}
                placeholder={(settings.sippContributionType ?? 'flat') === 'flat' ? '0' : '5'}
                value={settings.sippContribution
                  ? (sippMonthly ? +(settings.sippContribution / 12).toFixed(2) : settings.sippContribution)
                  : ''}
                onChange={e => update({ sippContribution: (parseFloat(e.target.value) || 0) * (sippMonthly ? 12 : 1) })}
              />
                  </>
                )
              })()}
              {(settings.sippContributionType === 'percentage' || settings.sippContributionType === 'qualifying') && (settings.sippContribution || 0) > 0 && (() => {
                const base = settings.sippContributionType === 'qualifying' ? qualifyingEarningsTotal : pensionEligibleIncome
                const net = base * (settings.sippContribution / 100)
                return (
                  <p className="text-xs text-muted-foreground">
                    = £{Math.round(net).toLocaleString()}/yr paid
                    (£{Math.round(net / 0.8).toLocaleString()} into your pension after the 20% provider top-up).
                  </p>
                )
              })()}
              {taxSummary.sippNetContribution / 0.8 > Math.max(3600, pensionEligibleIncome) + 0.005 && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  ⚠ Above your relevant earnings — relief is capped at
                  {' '}{formatCurrency(Math.max(3600, pensionEligibleIncome))} gross; the portion over
                  {' '}{formatCurrency(Math.max(3600, pensionEligibleIncome) * 0.8)} paid gets no tax relief.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                The amount is what you actually pay (percentages resolve to the amount paid).
                SIPP contributions are relief at source — your provider claims 20% basic rate tax relief automatically (e.g. you pay £800 and £1,000 goes into your pension).
                Higher and additional rate relief is modelled by extending your basic-rate band (claim it via self-assessment or a tax code adjustment).
                The gross amount counts toward the Annual Allowance.
              </p>
            </div>
          </div>

          {/* Employer contributions */}
          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm font-medium">Employer contributions</p>
            <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
              <Label>Contribution Type</Label>
              <Select
                value={settings.employerPensionContributionType ?? 'flat'}
                onValueChange={v => update({ employerPensionContributionType: v as AppSettings['employerPensionContributionType'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Fixed annual amount (£)</SelectItem>
                  <SelectItem value="percentage">Percentage of salary</SelectItem>
                  <SelectItem value="qualifying">Percentage of qualifying earnings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
              {(() => {
                const empMonthly = (settings.employerPensionContributionType ?? 'flat') === 'flat' && (monthlyEntry['employer-pension'] ?? false)
                return (
                  <>
              <div className="flex items-center justify-between">
                <Label htmlFor="employer-pension">
                  {(settings.employerPensionContributionType ?? 'flat') === 'flat'
                    ? (empMonthly ? 'Employer Contribution (£/month)' : 'Annual Employer Contribution (£)')
                    : (settings.employerPensionContributionType === 'qualifying'
                        ? 'Employer Contribution (% of qualifying earnings)'
                        : 'Employer Contribution (%)')}
                </Label>
                {(settings.employerPensionContributionType ?? 'flat') === 'flat' && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                    onClick={() => toggleMonthly('employer-pension')}
                  >
                    Enter {empMonthly ? 'yearly' : 'monthly'}
                  </button>
                )}
              </div>
              <Input
                id="employer-pension"
                type="number"
                min="0"
                max={(settings.employerPensionContributionType ?? 'flat') !== 'flat' ? 100 : undefined}
                step={(settings.employerPensionContributionType ?? 'flat') !== 'flat' ? '0.5' : empMonthly ? '10' : '100'}
                placeholder={settings.employerPensionContributionType === 'qualifying' ? '3'
                  : settings.employerPensionContributionType === 'percentage' ? '5' : '0'}
                value={settings.employerPensionContributionValue
                  ? (empMonthly ? +(settings.employerPensionContributionValue / 12).toFixed(2) : settings.employerPensionContributionValue)
                  : ''}
                onChange={e => update({ employerPensionContributionValue: (parseFloat(e.target.value) || 0) * (empMonthly ? 12 : 1) })}
              />
                  </>
                )
              })()}
              {settings.employerPensionContributionType === 'qualifying' && (() => {
                const qualifyingEarnings = employmentSources.reduce((sum, s) => {
                  const sacrifice = (s.salarySacrificeItems ?? []).reduce((a, i) =>
                    a + (i.amountType === 'percentage' ? s.grossAmount * (i.annualAmount / 100) : i.annualAmount), 0)
                  const pay = Math.max(0, s.grossAmount + (s.bonus ?? 0) - sacrifice)
                  return sum + Math.max(0, Math.min(pay, rules.qualifyingEarningsUpper) - rules.qualifyingEarningsLower)
                }, 0)
                const resolved = qualifyingEarnings * ((settings.employerPensionContributionValue || 0) / 100)
                return (
                  <p className="text-xs text-muted-foreground">
                    Qualifying earnings are the band of pay between
                    £{rules.qualifyingEarningsLower.toLocaleString()} and
                    £{rules.qualifyingEarningsUpper.toLocaleString()} for each job (the auto-enrolment
                    basis — the minimum employer rate is 3%).
                    {qualifyingEarnings > 0 && (settings.employerPensionContributionValue || 0) > 0 && (
                      <> Yours: £{Math.round(qualifyingEarnings).toLocaleString()} →
                      £{Math.round(resolved).toLocaleString()}/yr employer contribution.</>
                    )}
                  </p>
                )
              })()}
              <p className="text-xs text-muted-foreground">
                Employer contributions from all jobs are combined here. They count toward the Annual
                Allowance but do not reduce your taxable income.
              </p>
            </div>
          </div>

          {/* MPAA toggle */}
          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm font-medium">Money Purchase Annual Allowance (MPAA)</p>
            <div className="flex items-center gap-3">
              <Switch
                id="mpaa"
                checked={settings.hasMPAA ?? false}
                onCheckedChange={v => update({ hasMPAA: v })}
              />
              <Label htmlFor="mpaa">
                {(settings.hasMPAA ?? false)
                  ? `MPAA active — DC limit reduced to £${rules.mpaa.toLocaleString()}`
                  : 'Standard Annual Allowance applies'}
                <HelpTooltip content="If you have flexibly accessed any defined contribution pension (e.g. taken income via drawdown or an uncrystallised funds pension lump sum), your annual allowance for DC contributions drops to £10,000." />
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Unused Annual Allowance from the previous 3 years?{' '}
              Enter it in <a href="#planning" className="underline underline-offset-2 hover:text-foreground">Planning → Annual Allowance</a>.
            </p>
          </div>

        </CardContent>
      </Card>

      {/* Student loan */}
      <Card data-search="settings-student-loan">
        <CardHeader>
          <CardTitle className="text-base">Student Loan</CardTitle>
          <CardDescription>
            Student loan repayments are deducted from your take-home pay when income exceeds the threshold.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
            <Label>Repayment Plan</Label>
            <Select
              value={settings.studentLoanPlan}
              onValueChange={v => update({ studentLoanPlan: v as StudentLoanPlan })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STUDENT_LOAN_LABELS) as StudentLoanPlan[]).map(plan => (
                  <SelectItem key={plan} value={plan}>{STUDENT_LOAN_LABELS[plan]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {settings.studentLoanPlan !== 'none' && (
            <p className="mt-2 text-xs text-muted-foreground">
              {settings.studentLoanPlan === 'plan1' && `Repay 9% above £${rules.studentLoan.plan1Threshold.toLocaleString()}/year`}
              {settings.studentLoanPlan === 'plan2' && `Repay 9% above £${rules.studentLoan.plan2Threshold.toLocaleString()}/year`}
              {settings.studentLoanPlan === 'plan4' && `Repay 9% above £${rules.studentLoan.plan4Threshold.toLocaleString()}/year`}
              {settings.studentLoanPlan === 'plan5' && (Number.isFinite(rules.studentLoan.plan5Threshold)
                ? `Repay 9% above £${rules.studentLoan.plan5Threshold.toLocaleString()}/year`
                : 'No repayments due this year — Plan 5 repayments began 6 April 2026')}
              {settings.studentLoanPlan === 'postgrad' && `Repay 6% above £${rules.studentLoan.postgradThreshold.toLocaleString()}/year`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Gift Aid */}
      <Card data-search="settings-gift-aid">
        <CardHeader>
          <CardTitle className="text-base">Gift Aid Donations</CardTitle>
          <CardDescription>
            Gift Aid donations extend your basic rate band, meaning higher-rate taxpayers get additional relief.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
            <Label htmlFor="gift-aid">
              Annual Gift Aid Donations (£)
              <HelpTooltip content="Donations extend your basic rate band, saving higher/additional rate taxpayers extra tax beyond the 20% already reclaimed by the charity." />
            </Label>
            <Input
              id="gift-aid"
              type="number"
              min="0"
              placeholder="0"
              value={settings.giftAidDonations || ''}
              onChange={e => update({ giftAidDonations: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Your donations are grossed up by 25% and the basic rate band is extended by that amount.
          </p>
        </CardContent>
      </Card>

      {/* Marriage Allowance */}
      <Card data-search="settings-marriage">
        <CardHeader>
          <CardTitle className="text-base">Marriage Allowance</CardTitle>
          <CardDescription>
            Married couples and civil partners can transfer part of the personal allowance to reduce tax.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
            <Label>
              Marriage Allowance
              <HelpTooltip content="Transfer £1,260 of unused Personal Allowance to a basic-rate taxpayer spouse/civil partner for a £252 tax saving." />
            </Label>
            <Select
              value={settings.marriageAllowance}
              onValueChange={v => update({ marriageAllowance: v as AppSettings['marriageAllowance'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not applicable</SelectItem>
                <SelectItem value="transferring">Transferring allowance to partner</SelectItem>
                <SelectItem value="receiving">Receiving allowance from partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {settings.marriageAllowance === 'transferring' && (
            <>
              <p className="text-xs text-muted-foreground">
                You give £1,260 of your personal allowance to your partner, reducing your own allowance.
              </p>
              {!taxSummary.marriageAllowanceTransferApplied && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Your income is above the basic rate band, so HMRC would not accept a Marriage
                  Allowance transfer — it has not been applied to your calculation.
                </p>
              )}
              {taxSummary.marriageAllowanceTransferApplied && taxSummary.effectivePersonalAllowance === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Your personal allowance is fully tapered — there is no unused allowance to transfer.
                </p>
              )}
            </>
          )}
          {settings.marriageAllowance === 'receiving' && (
            <>
              <p className="text-xs text-muted-foreground">
                You receive a £252 tax credit from your partner's transferred allowance.
              </p>
              {taxSummary.marriageAllowanceCredit === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  No credit is being applied — only basic-rate taxpayers are eligible to receive
                  Marriage Allowance, and the credit cannot exceed your income tax bill.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Postgraduate Loan */}
      {settings.studentLoanPlan !== 'none' && settings.studentLoanPlan !== 'postgrad' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Postgraduate Loan</CardTitle>
            <CardDescription>
              If you also have a postgraduate loan alongside your undergraduate plan, repayments are calculated separately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Switch
                id="postgrad-loan"
                checked={settings.hasPostgradLoan}
                onCheckedChange={v => update({ hasPostgradLoan: v })}
              />
              <Label htmlFor="postgrad-loan">
                {settings.hasPostgradLoan ? 'Postgraduate loan active' : 'No postgraduate loan'}
              </Label>
            </div>
            {settings.hasPostgradLoan && (
              <p className="mt-2 text-xs text-muted-foreground">
                Repay 6% above £{rules.studentLoan.postgradThreshold.toLocaleString()}/year, in addition to your undergraduate plan repayments.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Child Benefit / HICBC */}
      <Card data-search="settings-child-benefit">
        <CardHeader>
          <CardTitle className="text-base">Child Benefit / HICBC</CardTitle>
          <CardDescription>
            The High Income Child Benefit Charge (HICBC) claws back Child Benefit at 1% per £200 of adjusted net income between £60,000 and £80,000.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch
              id="child-benefit"
              checked={settings.childBenefitClaiming ?? false}
              onCheckedChange={v => update({ childBenefitClaiming: v })}
            />
            <Label htmlFor="child-benefit">
              {settings.childBenefitClaiming ? 'Claiming Child Benefit' : 'Not claiming Child Benefit'}
              <HelpTooltip content="If you or your partner earns over £60,000, the High Income Child Benefit Charge claws back the benefit at 1% per £200 earned over that threshold." />
            </Label>
          </div>
          {(settings.childBenefitClaiming ?? false) && (
            <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
              <Label htmlFor="num-children">Number of children</Label>
              <Input
                id="num-children"
                type="number"
                min="1"
                max="20"
                step="1"
                value={settings.numberOfChildren || ''}
                onChange={e => update({ numberOfChildren: Math.max(1, parseInt(e.target.value) || 1) })}
                placeholder="1"
              />
            </div>
          )}
          {(settings.childBenefitClaiming ?? false) && (settings.numberOfChildren ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground">
              Annual benefit: £{(
                rules.childBenefitEldestWeekly * 52
                + Math.max(0, (settings.numberOfChildren - 1)) * rules.childBenefitAdditionalWeekly * 52
              ).toFixed(2).replace(/\.00$/, '')} ·
              HICBC taper: £{rules.hicbcThreshold.toLocaleString()}–£{rules.hicbcTaperEnd.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* EIS / SEIS / VCT */}
      <Card data-search="settings-eis">
        <CardHeader>
          <CardTitle className="text-base">EIS / SEIS / VCT Investment Relief</CardTitle>
          <CardDescription>
            Income tax relief on qualifying investments: SEIS 50% (max £200k), EIS 30% (max £1m), VCT 30% (max £200k). Relief is capped at your income tax liability.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
            <Label htmlFor="seis">
              SEIS investment this year (£)
              <HelpTooltip content="Enterprise Investment Scheme (30%), SEIS (50%), and Venture Capital Trusts (30%) offer income tax relief on qualifying investments." />
            </Label>
            <Input
              id="seis"
              type="number"
              min="0"
              max="200000"
              step="1000"
              placeholder="0"
              value={settings.seisInvestment || ''}
              onChange={e => update({ seisInvestment: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
            <Label htmlFor="eis">EIS investment this year (£)</Label>
            <Input
              id="eis"
              type="number"
              min="0"
              max="1000000"
              step="1000"
              placeholder="0"
              value={settings.eisInvestment || ''}
              onChange={e => update({ eisInvestment: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
            <Label htmlFor="vct">VCT investment this year (£)</Label>
            <Input
              id="vct"
              type="number"
              min="0"
              max="200000"
              step="1000"
              placeholder="0"
              value={settings.vctInvestment || ''}
              onChange={e => update({ vctInvestment: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Relief reduces your income tax bill directly. EIS/SEIS also carry CGT and loss relief benefits.
          </p>
        </CardContent>
      </Card>

      {/* Blind Person's Allowance */}
      <Card data-search="settings-blind">
        <CardHeader>
          <CardTitle className="text-base">Blind Person's Allowance</CardTitle>
          <CardDescription>
            Registered blind individuals receive an additional personal allowance of £{rules.blindPersonsAllowance.toLocaleString()}, on top of the standard personal allowance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              id="blind-pa"
              checked={settings.hasBlindPersonsAllowance ?? false}
              onCheckedChange={v => update({ hasBlindPersonsAllowance: v })}
            />
            <Label htmlFor="blind-pa">
              {settings.hasBlindPersonsAllowance ? `Blind Person's Allowance active (+£${rules.blindPersonsAllowance.toLocaleString()})` : 'Not claiming Blind Person\'s Allowance'}
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Tax Code */}
      <Card data-search="settings-tax-code">
        <CardHeader>
          <CardTitle className="text-base">Tax Code</CardTitle>
          <CardDescription>
            Your tax code determines how much tax-free income you receive via PAYE. Find it on your payslip or P60.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
            <Label htmlFor="tax-code">Tax Code (optional)</Label>
            <Input
              id="tax-code"
              type="text"
              placeholder="e.g. 1257L"
              value={settings.taxCode ?? ''}
              onChange={e => update({ taxCode: e.target.value || undefined })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Used in the Payslip Reconciliation tool to highlight if a non-standard code may explain differences.
          </p>
        </CardContent>
      </Card>

      {/* Business Asset Disposal Relief — hidden in budgeting mode */}
      {!budgetingMode && <Card data-search="settings-badr">
        <CardHeader>
          <CardTitle className="text-base">Business Asset Disposal Relief (BADR)</CardTitle>
          <CardDescription>
            BADR (formerly Entrepreneurs' Relief) applies a reduced CGT rate on qualifying business disposals up to a £1m lifetime limit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
            <Label htmlFor="badr-used">
              Prior BADR lifetime allowance used (£)
              <HelpTooltip content="Business Asset Disposal Relief (formerly Entrepreneurs' Relief) gives a reduced CGT rate on qualifying business disposals up to a £1m lifetime limit." />
            </Label>
            <Input
              id="badr-used"
              type="number"
              min="0"
              max="1000000"
              step="1000"
              placeholder="0"
              value={settings.badrLifetimeUsed || ''}
              onChange={e => update({ badrLifetimeUsed: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Enter total BADR claimed in previous years. The remaining allowance is £{(1_000_000 - (settings.badrLifetimeUsed ?? 0)).toLocaleString()}.
          </p>
        </CardContent>
      </Card>}

      {/* Basis Period Reform — only shown when self-employment income present and not in employee mode */}
      {!employeeMode && incomeSources.some(s => s.type === 'self-employment') && (
        <Card data-search="settings-basis-period">
          <CardHeader>
            <CardTitle className="text-base">Basis Period Reform</CardTitle>
            <CardDescription>
              HMRC's basis period reform (effective 2023/24) may require some sole traders to recognise additional &lsquo;transitional&rsquo; profit spread over multiple tax years.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
              <Label htmlFor="transitional-spread">Transitional profit spread added this year (£)</Label>
              <Input
                id="transitional-spread"
                type="number"
                min="0"
                step="100"
                placeholder="0"
                value={settings.transitionalProfitSpread ?? ''}
                onChange={e => update({ transitionalProfitSpread: parseFloat(e.target.value) || undefined })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the additional taxable profit arising from the transition — HMRC will show this on your SA302 or via your accountant.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Household — hidden in budgeting mode */}
      {!budgetingMode && <Card data-search="settings-household">
        <CardHeader>
          <CardTitle className="text-base">Household</CardTitle>
          <CardDescription>
            Enter your partner's gross income to enable the household overview in Planning. Partner tax is estimated — configure their full details in a separate profile for accuracy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5 w-full max-w-xs sm:max-w-sm">
            <Label htmlFor="partner-income">Partner annual gross income (£)</Label>
            <Input
              id="partner-income"
              type="number"
              min="0"
              step="1000"
              placeholder="0"
              value={settings.partnerIncome || ''}
              onChange={e => update({ partnerIncome: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </CardContent>
      </Card>}

      {/* Data management */}
      <Card data-search="settings-data">
        <CardHeader>
          <CardTitle className="text-base">Data Management</CardTitle>
          <CardDescription>
            Back up your data or restore it on another device. Exports all income, expenses, gains, and settings as a JSON file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {lastExported ? `Last exported: ${lastExported}` : 'Never backed up — export your data to keep a copy.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export data
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export as CSV
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import data
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
          {importStatus === 'success' && (
            <p className="text-sm text-green-600">Data imported successfully.</p>
          )}
          {importStatus === 'error' && (
            <p className="text-sm text-destructive">Import failed — make sure the file is a valid export from this app.</p>
          )}
          <p className="text-xs text-muted-foreground">
            Importing will replace your current data for this profile.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
