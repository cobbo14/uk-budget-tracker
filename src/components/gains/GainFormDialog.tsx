import { useState, useEffect } from 'react'
import { useBudget } from '@/hooks/useBudget'
import { generateId } from '@/utils/ids'
import type { GainSource } from '@/types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HelpTooltip } from '@/components/ui/tooltip'
import {
  ADD_GAIN, UPDATE_GAIN, CLOSE_GAIN_DIALOG,
} from '@/store/actions'

interface FormState {
  name: string
  gainAmount: string
  allowableCosts: string
  isResidentialProperty: boolean
  isBADR: boolean
}

const DEFAULT_FORM: FormState = {
  name: '',
  gainAmount: '',
  allowableCosts: '',
  isResidentialProperty: false,
  isBADR: false,
}

export function GainFormDialog() {
  const { state, dispatch, getGainById } = useBudget()
  const { gainDialogMode, editingGainId } = state.ui
  const open = gainDialogMode !== 'none'
  const isEdit = gainDialogMode === 'edit'

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  function handleClose() {
    setForm(DEFAULT_FORM)
    setErrors({})
    dispatch({ type: CLOSE_GAIN_DIALOG })
  }

  useEffect(() => {
    if (!open) return
    if (isEdit && editingGainId) {
      const gain = getGainById(editingGainId)
      if (gain) {
        setForm({
          name: gain.name,
          gainAmount: String(gain.gainAmount),
          allowableCosts: gain.allowableCosts > 0 ? String(gain.allowableCosts) : '',
          isResidentialProperty: gain.isResidentialProperty,
          isBADR: gain.isBADR ?? false,
        })
      }
    } else {
      setForm(DEFAULT_FORM)
    }
    setErrors({})
    // getGainById is a stable selector — omitting it prevents re-populating while the user edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, editingGainId])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    const amount = parseFloat(form.gainAmount)
    if (isNaN(amount) || amount < 0) errs.gainAmount = 'Enter a valid gain amount'
    if (form.allowableCosts) {
      const costs = parseFloat(form.allowableCosts)
      if (isNaN(costs) || costs < 0) errs.allowableCosts = 'Enter a valid amount'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const gain: GainSource = {
      id: isEdit && editingGainId ? editingGainId : generateId(),
      name: form.name.trim(),
      gainAmount: parseFloat(form.gainAmount) || 0,
      allowableCosts: form.allowableCosts ? parseFloat(form.allowableCosts) : 0,
      isResidentialProperty: form.isResidentialProperty,
      isBADR: form.isBADR && !form.isResidentialProperty,
    }
    dispatch({ type: isEdit ? UPDATE_GAIN : ADD_GAIN, payload: gain })
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Capital Gain' : 'Add Capital Gain'}</DialogTitle>
          <DialogDescription>
            Enter the gain amount (proceeds minus original cost) and any allowable costs.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="gain-name">Name</Label>
            <Input
              id="gain-name"
              placeholder="e.g. Shares sale, Property disposal"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Gain Amount */}
          <div className="grid gap-1.5">
            <Label htmlFor="gain-amount">Gain Amount (£)</Label>
            <Input
              id="gain-amount"
              type="number"
              min="0"
              placeholder="0"
              value={form.gainAmount}
              onChange={e => set('gainAmount', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Gross proceeds minus the original purchase cost.</p>
            {errors.gainAmount && <p className="text-xs text-destructive">{errors.gainAmount}</p>}
          </div>

          {/* Allowable Costs */}
          <div className="grid gap-1.5">
            <Label htmlFor="gain-costs">
              Allowable Costs (£, optional)
              <HelpTooltip content="Costs that reduce your gain: buying/selling costs (legal fees, stamp duty, estate agent fees) and improvement costs." />
            </Label>
            <Input
              id="gain-costs"
              type="number"
              min="0"
              placeholder="0"
              value={form.allowableCosts}
              onChange={e => set('allowableCosts', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Buying/selling fees, stamp duty, improvement costs.</p>
            {errors.allowableCosts && <p className="text-xs text-destructive">{errors.allowableCosts}</p>}
          </div>

          {/* Residential Property */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="gain-property"
              checked={form.isResidentialProperty}
              onChange={e => {
                set('isResidentialProperty', e.target.checked)
                if (e.target.checked) set('isBADR', false)
              }}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="gain-property">
              Residential property disposal
              <HelpTooltip content="Residential property gains are taxed at higher CGT rates (18%/24%) and do not qualify for BADR." />
            </Label>
          </div>

          {/* BADR — hidden for residential property */}
          {!form.isResidentialProperty && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="gain-badr"
                checked={form.isBADR}
                onChange={e => set('isBADR', e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <div>
                <Label htmlFor="gain-badr">
                  Business Asset Disposal Relief (BADR)
                  <HelpTooltip content="Business Asset Disposal Relief gives a lower CGT rate (10–18% depending on year) on qualifying business asset sales, up to £1m lifetime." />
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tick if this disposal qualifies for BADR (formerly Entrepreneurs' Relief). A reduced CGT rate applies up to the £1m lifetime limit.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEdit ? 'Save Changes' : 'Add Gain'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
