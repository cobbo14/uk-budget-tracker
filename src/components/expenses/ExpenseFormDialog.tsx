import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { useBudget } from '@/hooks/useBudget'
import { useProfiles } from '@/store/ProfilesContext'
import { generateId } from '@/utils/ids'
import type { Expense, ExpenseCategory, ExpenseFrequency, UtilityType, UtilityDetails, SplitParticipant } from '@/types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LIST } from '@/constants/expenseCategories'
import { ADD_EXPENSE, UPDATE_EXPENSE, CLOSE_EXPENSE_DIALOG } from '@/store/actions'

const UTILITY_TYPES: Record<UtilityType, string> = {
  electricity: 'Electricity',
  gas: 'Gas',
  water: 'Water',
  broadband: 'Broadband',
  mobile: 'Mobile',
  landline: 'Landline',
  other: 'Other',
}

const UTILITY_RATE_TEMPLATES: Record<UtilityType, { label: string; unit: string }[]> = {
  electricity: [{ label: 'Unit Rate', unit: 'p/kWh' }, { label: 'Standing Charge', unit: 'p/day' }],
  gas: [{ label: 'Unit Rate', unit: 'p/kWh' }, { label: 'Standing Charge', unit: 'p/day' }],
  water: [{ label: 'Standing Charge', unit: 'p/day' }, { label: 'Usage Rate', unit: '£/m³' }],
  broadband: [{ label: 'Monthly Cost', unit: '£/month' }, { label: 'Download Speed', unit: 'Mbps' }, { label: 'Upload Speed', unit: 'Mbps' }],
  mobile: [{ label: 'Monthly Cost', unit: '£/month' }],
  landline: [{ label: 'Monthly Cost', unit: '£/month' }],
  other: [],
}

interface UtilityRateForm {
  id: string
  label: string
  value: string
  unit: string
}

interface SplitParticipantForm {
  profileId: string
  percentage: string
}

interface FormState {
  name: string
  category: ExpenseCategory
  amount: string
  frequency: ExpenseFrequency
  contractStartDate: string
  renewalDate: string
  utilityType: UtilityType | ''
  utilityProvider: string
  utilityRates: UtilityRateForm[]
  splitEnabled: boolean
  splitParticipants: SplitParticipantForm[]
}

const DEFAULT_FORM: FormState = {
  name: '',
  category: 'housing',
  amount: '',
  frequency: 'monthly',
  contractStartDate: '',
  renewalDate: '',
  utilityType: '',
  utilityProvider: '',
  utilityRates: [],
  splitEnabled: false,
  splitParticipants: [],
}

const FREQUENCY_LABELS: Record<ExpenseFrequency, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  annual: 'Annual',
}

export function ExpenseFormDialog() {
  const { state, dispatch, getExpenseById, customExpenseCategories } = useBudget()
  const { profiles, activeProfileId } = useProfiles()
  const otherProfiles = profiles.filter(p => p.id !== activeProfileId)
  const { expenseDialogMode, editingExpenseId } = state.ui
  const open = expenseDialogMode !== 'none'
  const isEdit = expenseDialogMode === 'edit'

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  function handleClose() {
    setForm(DEFAULT_FORM)
    setErrors({})
    dispatch({ type: CLOSE_EXPENSE_DIALOG })
  }

  useEffect(() => {
    if (!open) return
    if (isEdit && editingExpenseId) {
      const expense = getExpenseById(editingExpenseId)
      if (expense) {
        setForm({
          name: expense.name,
          category: expense.category,
          amount: String(expense.amount),
          frequency: expense.frequency,
          contractStartDate: expense.contractStartDate ?? '',
          renewalDate: expense.renewalDate ?? '',
          utilityType: expense.utilityDetails?.type ?? '',
          utilityProvider: expense.utilityDetails?.provider ?? '',
          utilityRates: expense.utilityDetails?.rates.map(r => ({
            id: generateId(),
            label: r.label,
            value: String(r.value),
            unit: r.unit,
          })) ?? [],
          splitEnabled: !!expense.splitGroupId,
          splitParticipants: expense.splitConfig
            ? expense.splitConfig.map(p => ({
                profileId: p.profileId,
                percentage: String(p.percentage),
              }))
            : expense.splitGroupId
              ? [{ profileId: activeProfileId, percentage: String(expense.splitPercentage ?? 100) }]
              : [],
        })
      }
    } else {
      setForm(DEFAULT_FORM)
    }
    setErrors({})
    // getExpenseById is a stable selector — omitting it prevents re-populating while the user edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, editingExpenseId])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  function handleUtilityTypeChange(type: UtilityType) {
    if (form.utilityRates.length === 0) {
      const templates = UTILITY_RATE_TEMPLATES[type]
      setForm(f => ({
        ...f,
        utilityType: type,
        utilityRates: templates.map(t => ({ id: generateId(), label: t.label, value: '', unit: t.unit })),
      }))
    } else {
      set('utilityType', type)
    }
  }

  function addRate() {
    setForm(f => ({
      ...f,
      utilityRates: [...f.utilityRates, { id: generateId(), label: '', value: '', unit: '' }],
    }))
  }

  function updateRate(index: number, field: 'label' | 'value' | 'unit', value: string) {
    setForm(f => ({
      ...f,
      utilityRates: f.utilityRates.map((r, i) => i === index ? { ...r, [field]: value } : r),
    }))
  }

  function removeRate(index: number) {
    setForm(f => ({
      ...f,
      utilityRates: f.utilityRates.filter((_, i) => i !== index),
    }))
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount < 0) errs.amount = 'Enter a valid amount'
    if (form.splitEnabled) {
      const total = form.splitParticipants.reduce(
        (sum, p) => sum + (parseFloat(p.percentage) || 0), 0
      )
      if (Math.abs(total - 100) > 0.01) errs.splitParticipants = 'Percentages must add up to 100%'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit() {
    if (!validate()) return

    const hasUtilityData = form.category === 'utilities' &&
      (form.utilityType !== '' || form.utilityProvider.trim() !== '' || form.utilityRates.some(r => r.label.trim() || r.value.trim()))

    const utilityDetails: UtilityDetails | undefined = hasUtilityData
      ? {
          type: form.utilityType !== '' ? form.utilityType as UtilityType : undefined,
          provider: form.utilityProvider.trim(),
          rates: form.utilityRates
            .filter(r => r.label.trim() || r.value.trim())
            .map(r => ({
              label: r.label.trim(),
              value: parseFloat(r.value) || 0,
              unit: r.unit.trim(),
            })),
        }
      : undefined

    const splitGroupId = form.splitEnabled
      ? (isEdit && editingExpenseId
          ? getExpenseById(editingExpenseId)?.splitGroupId ?? generateId()
          : generateId())
      : undefined

    const currentPercentage = form.splitEnabled
      ? (parseFloat(form.splitParticipants.find(p => p.profileId === activeProfileId)?.percentage ?? '100') || 100)
      : undefined

    const splitConfig: SplitParticipant[] | undefined = form.splitEnabled
      ? form.splitParticipants.map(p => ({
          profileId: p.profileId,
          percentage: parseFloat(p.percentage) || 0,
        }))
      : undefined

    const expense: Expense = {
      id: isEdit && editingExpenseId ? editingExpenseId : generateId(),
      name: form.name.trim(),
      category: form.category,
      amount: parseFloat(form.amount),
      frequency: form.frequency,
      contractStartDate: form.contractStartDate || undefined,
      renewalDate: form.renewalDate || undefined,
      utilityDetails,
      splitGroupId,
      splitPercentage: currentPercentage,
      splitOriginProfileId: form.splitEnabled ? activeProfileId : undefined,
      splitConfig,
    }
    dispatch({ type: isEdit ? UPDATE_EXPENSE : ADD_EXPENSE, payload: expense })
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          <DialogDescription>Enter the expense amount and how often it occurs.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="expense-name">Name</Label>
            <Input
              id="expense-name"
              placeholder="e.g. Rent, Netflix, Council Tax"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "expense-name-error" : undefined}
            />
            {errors.name && <p id="expense-name-error" role="alert" className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Category */}
          <div className="grid gap-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={v => set('category', v as ExpenseCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORY_LIST.map(cat => (
                  <SelectItem key={cat} value={cat}>{EXPENSE_CATEGORIES[cat].label}</SelectItem>
                ))}
                {customExpenseCategories.length > 0 && (
                  <>
                    <SelectSeparator />
                    {customExpenseCategories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Utility Details (shown only for utilities category) */}
          {form.category === 'utilities' && (
            <div className="grid gap-3 rounded-md border p-3">
              <p className="text-sm font-medium">Utility Details</p>

              {/* Utility Type + Provider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Type</Label>
                  <Select
                    value={form.utilityType}
                    onValueChange={v => handleUtilityTypeChange(v as UtilityType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(UTILITY_TYPES) as UtilityType[]).map(t => (
                        <SelectItem key={t} value={t}>{UTILITY_TYPES[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="utility-provider">Provider</Label>
                  <Input
                    id="utility-provider"
                    placeholder="e.g. Octopus Energy"
                    value={form.utilityProvider}
                    onChange={e => set('utilityProvider', e.target.value)}
                  />
                </div>
              </div>

              {/* Rates */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Rates</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRate}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Rate
                  </Button>
                </div>
                {form.utilityRates.length > 0 && (
                  <div className="grid gap-1.5">
                    <div className="grid grid-cols-[1fr_minmax(60px,80px)_minmax(60px,80px)_28px] sm:grid-cols-[1fr_90px_90px_28px] gap-1.5 px-0.5">
                      <span className="text-xs text-muted-foreground">Label</span>
                      <span className="text-xs text-muted-foreground">Value</span>
                      <span className="text-xs text-muted-foreground">Unit</span>
                      <span />
                    </div>
                    {form.utilityRates.map((rate, i) => (
                      <div key={rate.id} className="grid grid-cols-[1fr_minmax(60px,80px)_minmax(60px,80px)_28px] sm:grid-cols-[1fr_90px_90px_28px] gap-1.5 items-center">
                        <Input
                          placeholder="Unit Rate"
                          value={rate.label}
                          onChange={e => updateRate(i, 'label', e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="24.5"
                          value={rate.value}
                          onChange={e => updateRate(i, 'value', e.target.value)}
                          className="h-8 text-sm"
                          min="0"
                          step="0.01"
                        />
                        <Input
                          placeholder="p/kWh"
                          value={rate.unit}
                          onChange={e => updateRate(i, 'unit', e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                          aria-label={`Remove rate ${rate.label || `#${i + 1}`}`}
                          onClick={() => removeRate(i)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Amount + Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="expense-amount">Amount (£)</Label>
              <Input
                id="expense-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? "expense-amount-error" : undefined}
              />
              {errors.amount && <p id="expense-amount-error" role="alert" className="text-xs text-destructive">{errors.amount}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label>Frequency</Label>
              <Select value={form.frequency} onValueChange={v => set('frequency', v as ExpenseFrequency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FREQUENCY_LABELS) as ExpenseFrequency[]).map(f => (
                    <SelectItem key={f} value={f}>{FREQUENCY_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contract dates (optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="contract-start">Contract start (optional)</Label>
              <Input
                id="contract-start"
                type="date"
                value={form.contractStartDate}
                onChange={e => set('contractStartDate', e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="renewal-date">Renewal date (optional)</Label>
              <Input
                id="renewal-date"
                type="date"
                value={form.renewalDate}
                onChange={e => set('renewalDate', e.target.value)}
              />
            </div>
          </div>

          {/* Split across profiles */}
          {otherProfiles.length > 0 && (() => {
            const isNonOriginSplit = isEdit && editingExpenseId &&
              getExpenseById(editingExpenseId)?.splitGroupId &&
              getExpenseById(editingExpenseId)?.splitOriginProfileId !== activeProfileId

            if (isNonOriginSplit) {
              const originProfile = profiles.find(
                p => p.id === getExpenseById(editingExpenseId!)?.splitOriginProfileId
              )
              return (
                <div className="rounded-md border p-3 text-sm text-muted-foreground">
                  Split expense — managed from <span className="font-medium text-foreground">{originProfile?.name ?? 'another profile'}</span>.
                  Switch to that profile to change the split.
                </div>
              )
            }

            return (
              <div className="grid gap-3 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="split-toggle">Split across profiles</Label>
                  <Switch
                    id="split-toggle"
                    checked={form.splitEnabled}
                    onCheckedChange={(checked) => {
                      if (checked && form.splitParticipants.length === 0) {
                        set('splitParticipants', [
                          { profileId: activeProfileId, percentage: '50' },
                          { profileId: otherProfiles[0].id, percentage: '50' },
                        ])
                      }
                      set('splitEnabled', checked)
                    }}
                  />
                </div>

                {form.splitEnabled && (
                  <div className="grid gap-2">
                    {form.splitParticipants.map((p, i) => {
                      const profile = profiles.find(pr => pr.id === p.profileId)
                      return (
                        <div key={p.profileId} className="flex items-center gap-2">
                          <span className="text-sm flex-1 truncate">
                            {profile?.name ?? 'Unknown'}
                            {p.profileId === activeProfileId && ' (you)'}
                          </span>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            className="w-20 h-10 sm:h-8 text-sm"
                            value={p.percentage}
                            onChange={(e) => {
                              const updated = [...form.splitParticipants]
                              updated[i] = { ...updated[i], percentage: e.target.value }
                              set('splitParticipants', updated)
                            }}
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                          {form.splitParticipants.length > 2 && p.profileId !== activeProfileId && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                              aria-label={`Remove ${profile?.name ?? 'participant'} from split`}
                              onClick={() => {
                                set('splitParticipants', form.splitParticipants.filter((_, j) => j !== i))
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )
                    })}

                    {form.splitParticipants.length < profiles.length && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const included = new Set(form.splitParticipants.map(p => p.profileId))
                          const next = profiles.find(p => !included.has(p.id))
                          if (next) {
                            set('splitParticipants', [
                              ...form.splitParticipants,
                              { profileId: next.id, percentage: '0' },
                            ])
                          }
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Profile
                      </Button>
                    )}

                    {(() => {
                      const total = form.splitParticipants.reduce(
                        (sum, p) => sum + (parseFloat(p.percentage) || 0), 0
                      )
                      if (Math.abs(total - 100) > 0.01) {
                        return (
                          <p className="text-xs text-destructive">
                            Percentages must add up to 100% (currently {total.toFixed(1)}%)
                          </p>
                        )
                      }
                      return null
                    })()}
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEdit ? 'Save Changes' : 'Add Expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
