import { useState, useEffect } from 'react'
import { useBudget } from '@/hooks/useBudget'
import { generateId } from '@/utils/ids'
import type { IncomeSource, IncomeType, SalarySacrificeType, BenefitInKindType } from '@/types'
import { useEmployeeMode } from '@/hooks/useEmployeeMode'
import { formatCurrency } from '@/utils/formatting'
import { Plus, X } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { HelpTooltip } from '@/components/ui/tooltip'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ADD_INCOME, UPDATE_INCOME, CLOSE_INCOME_DIALOG,
} from '@/store/actions'

interface SalarySacrificeFormItem {
  id: string
  type: SalarySacrificeType
  name: string
  annualAmount: string
  amountType: 'flat' | 'percentage'
}

interface BenefitInKindFormItem {
  id: string
  type: BenefitInKindType
  name: string
  annualValue: string
  bikRate: string
}

interface FormState {
  name: string
  type: IncomeType
  grossAmount: string
  bonus: string
  allowableExpenses: string
  mortgageInterestAnnual: string
  rentalExpenses: string
  usesTradingAllowance: boolean
  isProjection: boolean
  ytdAmount: string
  ytdMonths: string
  fromISA: boolean
  yearsHeld: string
  salarySacrificeItems: SalarySacrificeFormItem[]
  benefitsInKindItems: BenefitInKindFormItem[]
  employerPensionAmount: string
  employerPensionAmountType: 'flat' | 'percentage'
}

const DEFAULT_FORM: FormState = {
  name: '',
  type: 'employment',
  grossAmount: '',
  bonus: '',
  allowableExpenses: '',
  usesTradingAllowance: false,
  isProjection: false,
  ytdAmount: '',
  ytdMonths: '',
  mortgageInterestAnnual: '',
  rentalExpenses: '',
  fromISA: false,
  yearsHeld: '',
  salarySacrificeItems: [],
  benefitsInKindItems: [],
  employerPensionAmount: '',
  employerPensionAmountType: 'flat',
}

const SACRIFICE_TYPE_LABELS: Record<SalarySacrificeType, string> = {
  pension: 'Pension',
  cycleToWork: 'Cycle to Work',
  electricVehicle: 'Electric Vehicle',
  other: 'Other',
}

const SACRIFICE_TYPE_DEFAULT_NAMES: Partial<Record<SalarySacrificeType, string>> = {
  pension: 'Salary Sacrifice Pension',
  cycleToWork: 'Cycle to Work',
  electricVehicle: 'Electric Vehicle',
}

const BIK_TYPE_LABELS: Record<BenefitInKindType, string> = {
  companyCar: 'Company Car / Van',
  privateHealthcare: 'Private Healthcare',
  accommodation: 'Accommodation',
  other: 'Other',
}

const BIK_TYPE_DEFAULT_NAMES: Partial<Record<BenefitInKindType, string>> = {
  companyCar: 'Company Car / Van',
  privateHealthcare: 'Private Healthcare',
  accommodation: 'Accommodation',
}

const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  employment: 'Employment (PAYE)',
  'self-employment': 'Self-Employment',
  dividend: 'Dividends',
  rental: 'Rental Income',
  bond: 'Bond Gain — Investment Bond',
  savings: 'Savings / Interest',
}

function getElapsedTaxMonths(taxYear: string): number {
  const startYear = parseInt(taxYear.split('-')[0])
  const taxYearStart = new Date(startYear, 3, 6) // April 6
  const now = new Date()
  const diffMs = now.getTime() - taxYearStart.getTime()
  const months = Math.floor(diffMs / (30.44 * 86400000))
  return Math.max(1, Math.min(12, months))
}

export function IncomeFormDialog() {
  const { state, dispatch, getIncomeById } = useBudget()
  const employeeMode = useEmployeeMode()
  const { incomeDialogMode, editingIncomeId } = state.ui
  const open = incomeDialogMode !== 'none'
  const isEdit = incomeDialogMode === 'edit'

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  function handleClose() {
    setForm(DEFAULT_FORM)
    setErrors({})
    dispatch({ type: CLOSE_INCOME_DIALOG })
  }

  useEffect(() => {
    if (!open) return
    if (isEdit && editingIncomeId) {
      const source = getIncomeById(editingIncomeId)
      if (source) {
        setForm({
          name: source.name,
          type: source.type,
          grossAmount: String(source.grossAmount),
          bonus: source.bonus != null && source.bonus > 0 ? String(source.bonus) : '',
          allowableExpenses: source.allowableExpenses != null ? String(source.allowableExpenses) : '',
          usesTradingAllowance: source.usesTradingAllowance ?? false,
          isProjection: source.isProjection ?? false,
          ytdAmount: source.ytdAmount != null ? String(source.ytdAmount) : '',
          ytdMonths: source.ytdMonths != null ? String(source.ytdMonths) : '',
          mortgageInterestAnnual: source.mortgageInterestAnnual != null ? String(source.mortgageInterestAnnual) : '',
          rentalExpenses: source.rentalExpenses != null ? String(source.rentalExpenses) : '',
          fromISA: source.fromISA ?? false,
          yearsHeld: source.yearsHeld != null ? String(source.yearsHeld) : '',
          salarySacrificeItems: (source.salarySacrificeItems ?? []).map(i => ({
            id: i.id,
            type: i.type,
            name: i.name,
            annualAmount: String(i.annualAmount),
            amountType: i.amountType ?? 'flat',
          })),
          benefitsInKindItems: (source.benefitsInKind ?? []).map(i => ({
            id: i.id,
            type: i.type,
            name: i.name,
            annualValue: String(i.annualValue),
            bikRate: i.bikRate != null ? String(i.bikRate) : '',
          })),
          employerPensionAmount: source.employerPensionAmount != null && source.employerPensionAmount > 0 ? String(source.employerPensionAmount) : '',
          employerPensionAmountType: source.employerPensionAmountType ?? 'flat',
        })
      }
    } else {
      setForm(DEFAULT_FORM)
    }
    setErrors({})
    // getIncomeById is a stable selector — omitting it prevents re-populating while the user edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, editingIncomeId])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    const isSEProjection = form.type === 'self-employment' && form.isProjection
    if (isSEProjection) {
      const ytd = parseFloat(form.ytdAmount)
      if (isNaN(ytd) || ytd < 0) errs.ytdAmount = 'Enter a valid amount'
      const months = parseInt(form.ytdMonths)
      if (isNaN(months) || months < 1 || months > 12) errs.ytdMonths = 'Enter 1–12'
    } else {
      const amount = parseFloat(form.grossAmount)
      if (isNaN(amount) || amount < 0) errs.grossAmount = 'Enter a valid annual amount'
    }
    if (form.type === 'self-employment' && !form.usesTradingAllowance && form.allowableExpenses) {
      const exp = parseFloat(form.allowableExpenses)
      if (isNaN(exp) || exp < 0) errs.allowableExpenses = 'Enter a valid amount'
    }
    if (form.type === 'rental') {
      if (form.mortgageInterestAnnual) {
        const mi = parseFloat(form.mortgageInterestAnnual)
        if (isNaN(mi) || mi < 0) errs.mortgageInterestAnnual = 'Enter a valid amount'
      }
      if (form.rentalExpenses) {
        const re = parseFloat(form.rentalExpenses)
        if (isNaN(re) || re < 0) errs.rentalExpenses = 'Enter a valid amount'
      }
    }
    if (form.type === 'employment' && form.salarySacrificeItems.length > 0) {
      const gross = parseFloat(form.grossAmount) || 0
      const totalSacrifice = form.salarySacrificeItems.reduce((sum, i) => {
        const val = parseFloat(i.annualAmount) || 0
        return sum + (i.amountType === 'percentage' ? gross * (val / 100) : val)
      }, 0)
      if (totalSacrifice > gross) errs.grossAmount = 'Total salary sacrifice cannot exceed gross amount'
    }
    if (form.type === 'employment' && form.benefitsInKindItems.length > 0) {
      for (const item of form.benefitsInKindItems) {
        if (item.type === 'companyCar' && (parseFloat(item.annualValue) || 0) > 0 && !item.bikRate) {
          errs.grossAmount = 'Company car BIK requires a BIK rate (%). Check your P11D form or HMRC.'
          break
        }
        if (item.type === 'companyCar' && item.bikRate) {
          const rate = parseFloat(item.bikRate)
          if (isNaN(rate) || rate < 0 || rate > 37) {
            errs.grossAmount = 'Company car BIK rate must be between 0% and 37%'
            break
          }
        }
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const isSEProjection = form.type === 'self-employment' && form.isProjection
    const ytdAmountNum = parseFloat(form.ytdAmount) || 0
    const ytdMonthsNum = parseInt(form.ytdMonths) || 1
    const projectedGross = isSEProjection ? Math.round((ytdAmountNum / ytdMonthsNum) * 12) : undefined
    const source: IncomeSource = {
      id: isEdit && editingIncomeId ? editingIncomeId : generateId(),
      name: form.name.trim(),
      type: form.type,
      grossAmount: projectedGross ?? (parseFloat(form.grossAmount) || 0),
      bonus: form.type === 'employment' && form.bonus
        ? parseFloat(form.bonus) : undefined,
      usesTradingAllowance: form.type === 'self-employment' ? form.usesTradingAllowance : undefined,
      allowableExpenses: form.type === 'self-employment' && !form.usesTradingAllowance && form.allowableExpenses
        ? parseFloat(form.allowableExpenses) : undefined,
      isProjection: isSEProjection || undefined,
      ytdAmount: isSEProjection ? ytdAmountNum : undefined,
      ytdMonths: isSEProjection ? ytdMonthsNum : undefined,
      mortgageInterestAnnual: form.type === 'rental' && form.mortgageInterestAnnual
        ? parseFloat(form.mortgageInterestAnnual) : undefined,
      rentalExpenses: form.type === 'rental' && form.rentalExpenses
        ? parseFloat(form.rentalExpenses) : undefined,
      fromISA: form.type === 'dividend' ? form.fromISA : undefined,
      yearsHeld: form.type === 'bond' && form.yearsHeld ? parseInt(form.yearsHeld) || undefined : undefined,
      salarySacrificeItems: form.type === 'employment' && form.salarySacrificeItems.length > 0
        ? form.salarySacrificeItems.map(i => ({
            id: i.id,
            type: i.type,
            name: i.name.trim() || (SACRIFICE_TYPE_DEFAULT_NAMES[i.type] ?? i.type),
            annualAmount: parseFloat(i.annualAmount) || 0,
            amountType: i.amountType,
          }))
        : undefined,
      benefitsInKind: form.type === 'employment' && form.benefitsInKindItems.length > 0
        ? form.benefitsInKindItems.map(i => ({
            id: i.id,
            type: i.type,
            name: i.name.trim() || (BIK_TYPE_DEFAULT_NAMES[i.type] ?? i.type),
            annualValue: parseFloat(i.annualValue) || 0,
            bikRate: i.type === 'companyCar' && i.bikRate ? parseFloat(i.bikRate) || undefined : undefined,
          }))
        : undefined,
      employerPensionAmount: form.type === 'employment' && form.employerPensionAmount
        ? parseFloat(form.employerPensionAmount) || undefined : undefined,
      employerPensionAmountType: form.type === 'employment' && form.employerPensionAmount
        ? form.employerPensionAmountType : undefined,
    }
    dispatch({ type: isEdit ? UPDATE_INCOME : ADD_INCOME, payload: source })
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Income Source' : 'Add Income Source'}</DialogTitle>
          <DialogDescription>Enter the annual gross amount before tax.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="income-name">Name</Label>
            <Input
              id="income-name"
              placeholder="e.g. Salary, Freelance work"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "income-name-error" : undefined}
            />
            {errors.name && <p id="income-name-error" role="alert" className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Type */}
          <div className="grid gap-1.5">
            <Label>Income Type</Label>
            <Select value={form.type} onValueChange={v => set('type', v as IncomeType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(INCOME_TYPE_LABELS) as IncomeType[])
                  .filter(t => !employeeMode || t !== 'self-employment')
                  .map(t => (
                    <SelectItem key={t} value={t}>{INCOME_TYPE_LABELS[t]}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gross Amount — or YTD projection inputs for self-employment */}
          {form.type === 'self-employment' && form.isProjection ? (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="income-ytd-amount">Income earned so far (£)</Label>
                <Input
                  id="income-ytd-amount"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.ytdAmount}
                  onChange={e => set('ytdAmount', e.target.value)}
                  aria-invalid={!!errors.ytdAmount}
                  aria-describedby={errors.ytdAmount ? "income-ytd-amount-error" : undefined}
                />
                {errors.ytdAmount && <p id="income-ytd-amount-error" role="alert" className="text-xs text-destructive">{errors.ytdAmount}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="income-ytd-months">Months into tax year</Label>
                <Input
                  id="income-ytd-months"
                  type="number"
                  min="1"
                  max="12"
                  step="1"
                  value={form.ytdMonths}
                  onChange={e => set('ytdMonths', e.target.value)}
                  aria-invalid={!!errors.ytdMonths}
                  aria-describedby={errors.ytdMonths ? "income-ytd-months-error" : undefined}
                />
                {errors.ytdMonths && <p id="income-ytd-months-error" role="alert" className="text-xs text-destructive">{errors.ytdMonths}</p>}
              </div>
              {(parseFloat(form.ytdAmount) || 0) > 0 && (parseInt(form.ytdMonths) || 0) >= 1 && (
                <p className="text-sm font-medium">
                  Projected annual: {formatCurrency(Math.round((parseFloat(form.ytdAmount) / parseInt(form.ytdMonths)) * 12))}
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-1.5">
              <Label htmlFor="income-amount">
                {form.type === 'dividend' ? 'Annual Dividend Income (£)' : 'Annual Gross Income (£)'}
                {form.type === 'bond' && (
                  <HelpTooltip content="Investment bond gains (e.g. from insurance bonds). Top-slicing relief divides the gain by years held to reduce the effective tax rate." />
                )}
              </Label>
              <Input
                id="income-amount"
                type="number"
                min="0"
                placeholder="0"
                value={form.grossAmount}
                onChange={e => set('grossAmount', e.target.value)}
                aria-invalid={!!errors.grossAmount}
                aria-describedby={errors.grossAmount ? "income-amount-error" : undefined}
              />
              {errors.grossAmount && <p id="income-amount-error" role="alert" className="text-xs text-destructive">{errors.grossAmount}</p>}
            </div>
          )}

          {/* Self-employment: projection toggle */}
          {form.type === 'self-employment' && (
            <div className="flex items-center gap-3">
              <Switch
                id="income-projection"
                checked={form.isProjection}
                onCheckedChange={v => {
                  set('isProjection', v)
                  if (v && !form.ytdMonths) {
                    set('ytdMonths', String(getElapsedTaxMonths(state.settings.taxYear)))
                  }
                }}
              />
              <Label htmlFor="income-projection" className="flex items-center gap-1">
                Project from year-to-date income
                <HelpTooltip content="Enter your income earned so far this tax year and the number of months. The annual income will be projected automatically for tax planning." />
              </Label>
            </div>
          )}

          {/* Employment: one-off bonus */}
          {form.type === 'employment' && (
            <div className="grid gap-1.5">
              <Label htmlFor="income-bonus">
                One-Off Bonus (£/year, optional)
                <HelpTooltip content="A one-off bonus on top of your base salary. Taxed as regular employment income (Income Tax + Class 1 NI). Salary sacrifice percentages apply to base salary only." />
              </Label>
              <Input
                id="income-bonus"
                type="number"
                min="0"
                placeholder="0"
                value={form.bonus}
                onChange={e => set('bonus', e.target.value)}
              />
            </div>
          )}

          {/* Employment: salary sacrifice benefits */}
          {form.type === 'employment' && (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>
                  Salary Sacrifice Benefits
                  <HelpTooltip content="Salary sacrifice reduces your gross salary before tax and NI, saving both Income Tax and National Insurance. This is different from a personal pension contribution (entered in Settings), which only saves Income Tax. Don't enter the same pension in both places." />
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => set('salarySacrificeItems', [
                    ...form.salarySacrificeItems,
                    { id: generateId(), type: 'other', name: '', annualAmount: '', amountType: 'flat' },
                  ])}
                >
                  <Plus className="h-3 w-3" />
                  Add benefit
                </Button>
              </div>
              {form.salarySacrificeItems.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Reduces taxable salary and saves both Income Tax and NI.
                </p>
              )}
              {form.salarySacrificeItems.map((item, idx) => (
                <div key={item.id} className="grid gap-2 rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 grid gap-1.5">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={item.type}
                        onValueChange={v => {
                          const newType = v as SalarySacrificeType
                          const updatedItems = form.salarySacrificeItems.map((it, i) =>
                            i === idx ? {
                              ...it,
                              type: newType,
                              name: SACRIFICE_TYPE_DEFAULT_NAMES[newType] ?? it.name,
                            } : it
                          )
                          set('salarySacrificeItems', updatedItems)
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(SACRIFICE_TYPE_LABELS) as SalarySacrificeType[]).map(t => (
                            <SelectItem key={t} value={t}>{SACRIFICE_TYPE_LABELS[t]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 mt-4 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove salary sacrifice item ${item.name || `#${idx + 1}`}`}
                      onClick={() => set('salarySacrificeItems', form.salarySacrificeItems.filter((_, i) => i !== idx))}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {item.type === 'other' && (
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Benefit name</Label>
                      <Input
                        className="h-8"
                        placeholder="e.g. Childcare vouchers"
                        value={item.name}
                        onChange={e => set('salarySacrificeItems', form.salarySacrificeItems.map((it, i) =>
                          i === idx ? { ...it, name: e.target.value } : it
                        ))}
                      />
                    </div>
                  )}
                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">
                        {item.amountType === 'percentage' ? 'Percentage of gross (%)' : 'Annual amount (£)'}
                      </Label>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                        onClick={() => set('salarySacrificeItems', form.salarySacrificeItems.map((it, i) =>
                          i === idx ? { ...it, amountType: it.amountType === 'percentage' ? 'flat' as const : 'percentage' as const, annualAmount: '' } : it
                        ))}
                      >
                        Switch to {item.amountType === 'percentage' ? '£' : '%'}
                      </button>
                    </div>
                    <Input
                      className="h-8"
                      type="number"
                      min="0"
                      max={item.amountType === 'percentage' ? '100' : undefined}
                      step={item.amountType === 'percentage' ? '0.5' : undefined}
                      placeholder="0"
                      value={item.annualAmount}
                      onChange={e => set('salarySacrificeItems', form.salarySacrificeItems.map((it, i) =>
                        i === idx ? { ...it, annualAmount: e.target.value } : it
                      ))}
                    />
                    {item.amountType === 'percentage' && (parseFloat(item.annualAmount) || 0) > 0 && (parseFloat(form.grossAmount) || 0) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        = £{((parseFloat(form.grossAmount) || 0) * (parseFloat(item.annualAmount) || 0) / 100).toLocaleString('en-GB', { maximumFractionDigits: 0 })}/yr
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Employment: employer pension contribution */}
          {form.type === 'employment' && (
            <div className="grid gap-2">
              <Label>
                Employer Pension Contribution
                <HelpTooltip content="Your employer's own pension contribution (not salary sacrifice). This counts toward the Annual Allowance but does not reduce your taxable income or NI. If entered here, don't also enter it in Settings." />
              </Label>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">
                    {form.employerPensionAmountType === 'percentage' ? 'Percentage of gross (%)' : 'Annual amount (£)'}
                  </Label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                    onClick={() => setForm(f => ({ ...f, employerPensionAmountType: f.employerPensionAmountType === 'percentage' ? 'flat' : 'percentage', employerPensionAmount: '' }))}
                  >
                    Switch to {form.employerPensionAmountType === 'percentage' ? '£' : '%'}
                  </button>
                </div>
                <Input
                  type="number"
                  min="0"
                  max={form.employerPensionAmountType === 'percentage' ? '100' : undefined}
                  step={form.employerPensionAmountType === 'percentage' ? '0.5' : '100'}
                  placeholder="0"
                  value={form.employerPensionAmount}
                  onChange={e => set('employerPensionAmount', e.target.value)}
                />
                {form.employerPensionAmountType === 'percentage' && (parseFloat(form.employerPensionAmount) || 0) > 0 && (parseFloat(form.grossAmount) || 0) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    = £{((parseFloat(form.grossAmount) || 0) * (parseFloat(form.employerPensionAmount) || 0) / 100).toLocaleString('en-GB', { maximumFractionDigits: 0 })}/yr
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Employment: benefits in kind (P11D) */}
          {form.type === 'employment' && (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>
                  Benefits in Kind (P11D)
                  <HelpTooltip content="Taxable perks from your employer reported on a P11D form (e.g. company car, private healthcare). Added to your taxable employment income." />
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => set('benefitsInKindItems', [
                    ...form.benefitsInKindItems,
                    { id: generateId(), type: 'other', name: '', annualValue: '', bikRate: '' },
                  ])}
                >
                  <Plus className="h-3 w-3" />
                  Add benefit
                </Button>
              </div>
              {form.benefitsInKindItems.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Increases taxable income for Income Tax. Does not affect National Insurance.
                </p>
              )}
              {form.benefitsInKindItems.map((item, idx) => (
                <div key={item.id} className="grid gap-2 rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 grid gap-1.5">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={item.type}
                        onValueChange={v => {
                          const newType = v as BenefitInKindType
                          const updatedItems = form.benefitsInKindItems.map((it, i) =>
                            i === idx ? {
                              ...it,
                              type: newType,
                              name: BIK_TYPE_DEFAULT_NAMES[newType] ?? it.name,
                            } : it
                          )
                          set('benefitsInKindItems', updatedItems)
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(BIK_TYPE_LABELS) as BenefitInKindType[]).map(t => (
                            <SelectItem key={t} value={t}>{BIK_TYPE_LABELS[t]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 mt-4 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove benefit ${item.name || `#${idx + 1}`}`}
                      onClick={() => set('benefitsInKindItems', form.benefitsInKindItems.filter((_, i) => i !== idx))}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {item.type === 'other' && (
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Benefit name</Label>
                      <Input
                        className="h-8"
                        placeholder="e.g. Gym membership"
                        value={item.name}
                        onChange={e => set('benefitsInKindItems', form.benefitsInKindItems.map((it, i) =>
                          i === idx ? { ...it, name: e.target.value } : it
                        ))}
                      />
                    </div>
                  )}
                  <div className="grid gap-1.5">
                    <Label className="text-xs">
                      {item.type === 'companyCar'
                        ? 'P11D value — car list price (£)'
                        : 'Annual taxable value (£)'}
                      {item.type !== 'companyCar' && (
                        <HelpTooltip content="The cash equivalent value from your P11D form — this is the amount your employer reports as the taxable benefit (e.g. the insurance premium for private healthcare)." />
                      )}
                    </Label>
                    <Input
                      className="h-8"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={item.annualValue}
                      onChange={e => set('benefitsInKindItems', form.benefitsInKindItems.map((it, i) =>
                        i === idx ? { ...it, annualValue: e.target.value } : it
                      ))}
                    />
                  </div>
                  {item.type === 'companyCar' && (
                    <div className="grid gap-1.5">
                      <Label className="text-xs">
                        BIK rate (%)
                        <HelpTooltip content="The company car BIK rate depends on the car's CO2 emissions and fuel type. Check your P11D form or use the HMRC company car tax calculator to find your rate (typically 2% for electric up to 37% for high-emission vehicles)." />
                      </Label>
                      <Input
                        className="h-8"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="e.g. 25"
                        value={item.bikRate}
                        onChange={e => set('benefitsInKindItems', form.benefitsInKindItems.map((it, i) =>
                          i === idx ? { ...it, bikRate: e.target.value } : it
                        ))}
                      />
                      {item.annualValue && item.bikRate && (
                        <p className="text-xs text-muted-foreground">
                          Taxable benefit: £{((parseFloat(item.annualValue) || 0) * (parseFloat(item.bikRate) || 0) / 100).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / year
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Self-employment: trading allowance + allowable expenses */}
          {form.type === 'self-employment' && (
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Switch
                  id="income-trading-allowance"
                  checked={form.usesTradingAllowance}
                  onCheckedChange={v => set('usesTradingAllowance', v)}
                />
                <Label htmlFor="income-trading-allowance" className="flex items-center gap-1">
                  Use £1,000 Trading Allowance
                  <HelpTooltip content="If your gross self-employment income is under £1,000, it's tax-free. If over £1,000, you can deduct £1,000 instead of claiming actual expenses. Use this if your expenses are under £1,000." />
                </Label>
              </div>
              {form.usesTradingAllowance ? (
                <p className="text-xs text-muted-foreground">
                  £1,000 trading allowance will be deducted from gross income (or the full gross amount if lower).
                </p>
              ) : (
                <div className="grid gap-1.5">
                  <Label htmlFor="income-expenses">Allowable Business Expenses (£/year, optional)</Label>
                  <Input
                    id="income-expenses"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.allowableExpenses}
                    onChange={e => set('allowableExpenses', e.target.value)}
                    aria-invalid={!!errors.allowableExpenses}
                    aria-describedby={errors.allowableExpenses ? "income-expenses-error" : undefined}
                  />
                  <p className="text-xs text-muted-foreground">Deducted from gross income before tax.</p>
                  {errors.allowableExpenses && <p id="income-expenses-error" role="alert" className="text-xs text-destructive">{errors.allowableExpenses}</p>}
                </div>
              )}
            </div>
          )}

          {/* Rental: mortgage interest + expenses */}
          {form.type === 'rental' && (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="income-mortgage">Annual Mortgage Interest (£, optional)</Label>
                <Input
                  id="income-mortgage"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.mortgageInterestAnnual}
                  onChange={e => set('mortgageInterestAnnual', e.target.value)}
                  aria-invalid={!!errors.mortgageInterestAnnual}
                  aria-describedby={errors.mortgageInterestAnnual ? "income-mortgage-error" : undefined}
                />
                <p className="text-xs text-muted-foreground">Gives a 20% basic rate tax credit.</p>
                {errors.mortgageInterestAnnual && <p id="income-mortgage-error" role="alert" className="text-xs text-destructive">{errors.mortgageInterestAnnual}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="income-rental-expenses">Other Allowable Expenses (£/year, optional)</Label>
                <Input
                  id="income-rental-expenses"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.rentalExpenses}
                  onChange={e => set('rentalExpenses', e.target.value)}
                  aria-invalid={!!errors.rentalExpenses}
                  aria-describedby={errors.rentalExpenses ? "income-rental-expenses-error" : undefined}
                />
                {errors.rentalExpenses && <p id="income-rental-expenses-error" role="alert" className="text-xs text-destructive">{errors.rentalExpenses}</p>}
              </div>
            </>
          )}

          {/* Dividend: ISA toggle */}
          {form.type === 'dividend' && (
            <div className="flex items-center gap-3">
              <Switch
                id="income-isa"
                checked={form.fromISA}
                onCheckedChange={v => set('fromISA', v)}
              />
              <Label htmlFor="income-isa">From ISA (tax-free, excluded from calculations)</Label>
            </div>
          )}

          {/* Bond: years held for top-slicing */}
          {form.type === 'bond' && (
            <div className="grid gap-1.5">
              <Label htmlFor="income-years-held">
                Complete years held (optional)
                <HelpTooltip content="Used for top-slicing relief: the gain is divided by years held to calculate the slice taxed at marginal rates." />
              </Label>
              <Input
                id="income-years-held"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 5"
                value={form.yearsHeld}
                onChange={e => set('yearsHeld', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used to calculate top-slicing relief. Enter the number of complete policy years to reduce the effective tax rate on the gain.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEdit ? 'Save Changes' : 'Add Income'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
