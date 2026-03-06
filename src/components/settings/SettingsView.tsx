import { useRef, useState } from 'react'
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
import { UPDATE_SETTINGS, HYDRATE } from '@/store/actions'
import { getAvailableTaxYears, getTaxRules } from '@/taxRules'
import { exportStateAsJSON, parseImportedState } from '@/services/localStorage'
import { generateCSV } from '@/utils/exportUtils'
import type { StudentLoanPlan, AppSettings } from '@/types'
import { useEmployeeMode } from '@/hooks/useEmployeeMode'

const STUDENT_LOAN_LABELS: Record<StudentLoanPlan, string> = {
  none: 'None',
  plan1: 'Plan 1 (pre-2012)',
  plan2: 'Plan 2 (post-2012)',
  plan4: 'Plan 4 (Scotland)',
  postgrad: 'Postgraduate Loan',
}

export function SettingsView() {
  const { state, settings, dispatch, rules, taxSummary, incomeSources } = useBudget()
  const employeeMode = useEmployeeMode()
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
      dispatch({ type: HYDRATE, payload: parsed })
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
          <div className="grid gap-1.5 w-full max-w-xs">
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
            Employee and employer pension contributions. Employee contributions reduce your taxable income; both count toward the £{rules.pensionAnnualAllowance.toLocaleString()} Annual Allowance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Employee contributions */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Employee (your) contributions</p>
            <div className="grid gap-1.5 w-full max-w-xs">
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
                  <SelectItem value="flat">Fixed annual amount (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.pensionContributionType !== 'none' && (
              <div className="grid gap-1.5 w-full max-w-xs">
                <Label htmlFor="pension-value">
                  {settings.pensionContributionType === 'percentage' ? 'Contribution (%)' : 'Annual Amount (£)'}
                </Label>
                <Input
                  id="pension-value"
                  type="number"
                  min="0"
                  max={settings.pensionContributionType === 'percentage' ? 100 : undefined}
                  step={settings.pensionContributionType === 'percentage' ? '0.5' : '100'}
                  value={settings.pensionContributionValue || ''}
                  onChange={e => update({ pensionContributionValue: parseFloat(e.target.value) || 0 })}
                  placeholder={settings.pensionContributionType === 'percentage' ? '5' : '2000'}
                />
              </div>
            )}
          </div>

          {/* Employer contributions */}
          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm font-medium">Employer contributions</p>
            <div className="grid gap-1.5 w-full max-w-xs">
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
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 w-full max-w-xs">
              <Label htmlFor="employer-pension">
                {(settings.employerPensionContributionType ?? 'flat') === 'percentage'
                  ? 'Employer Contribution (%)'
                  : 'Annual Employer Contribution (£)'}
              </Label>
              <Input
                id="employer-pension"
                type="number"
                min="0"
                max={(settings.employerPensionContributionType ?? 'flat') === 'percentage' ? 100 : undefined}
                step={(settings.employerPensionContributionType ?? 'flat') === 'percentage' ? '0.5' : '100'}
                placeholder={(settings.employerPensionContributionType ?? 'flat') === 'percentage' ? '5' : '0'}
                value={settings.employerPensionContributionValue || ''}
                onChange={e => update({ employerPensionContributionValue: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Employer contributions count toward the Annual Allowance but do not reduce your taxable income.
              </p>
            </div>
          </div>

          {/* SIPP contributions */}
          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm font-medium">SIPP (Self-Invested Personal Pension)</p>
            <div className="grid gap-1.5 w-full max-w-xs">
              <Label htmlFor="sipp-contribution">Annual Contribution (£)</Label>
              <Input
                id="sipp-contribution"
                type="number"
                min="0"
                step="100"
                placeholder="0"
                value={settings.sippContribution || ''}
                onChange={e => update({ sippContribution: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Personal SIPP contributions receive basic-rate tax relief at source. Higher/additional-rate relief reduces your taxable income. Counts toward the Annual Allowance.
              </p>
            </div>
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
          <div className="grid gap-1.5 w-full max-w-xs">
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
          <div className="grid gap-1.5 w-full max-w-xs">
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
          <div className="grid gap-1.5 w-full max-w-xs">
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
              {taxSummary.effectivePersonalAllowance === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Your personal allowance is fully tapered — there is no unused allowance to transfer.
                </p>
              )}
            </>
          )}
          {settings.marriageAllowance === 'receiving' && (
            <p className="text-xs text-muted-foreground">
              You receive a £252 tax credit from your partner's transferred allowance.
            </p>
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
            <div className="grid gap-1.5 w-full max-w-xs">
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
          <div className="grid gap-1.5 w-full max-w-xs">
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
          <div className="grid gap-1.5 w-full max-w-xs">
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
          <div className="grid gap-1.5 w-full max-w-xs">
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
          <div className="grid gap-1.5 w-full max-w-xs">
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

      {/* Business Asset Disposal Relief */}
      <Card data-search="settings-badr">
        <CardHeader>
          <CardTitle className="text-base">Business Asset Disposal Relief (BADR)</CardTitle>
          <CardDescription>
            BADR (formerly Entrepreneurs' Relief) applies a reduced CGT rate on qualifying business disposals up to a £1m lifetime limit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5 w-full max-w-xs">
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
      </Card>

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
            <div className="grid gap-1.5 w-full max-w-xs">
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

      {/* Household */}
      <Card data-search="settings-household">
        <CardHeader>
          <CardTitle className="text-base">Household</CardTitle>
          <CardDescription>
            Enter your partner's gross income to enable the household overview in Planning. Partner tax is estimated — configure their full details in a separate profile for accuracy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5 w-full max-w-xs">
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
      </Card>

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
