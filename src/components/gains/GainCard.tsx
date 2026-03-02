import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { GainSource } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatCurrency } from '@/utils/formatting'
import { useBudget } from '@/hooks/useBudget'
import { DELETE_GAIN, OPEN_EDIT_GAIN_DIALOG } from '@/store/actions'

interface GainCardProps {
  gain: GainSource
}

export function GainCard({ gain }: GainCardProps) {
  const { dispatch } = useBudget()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const netGain = gain.gainAmount - gain.allowableCosts

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{gain.name}</span>
          {gain.isResidentialProperty && (
            <Badge variant="secondary" className="shrink-0">Property</Badge>
          )}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          Gain: {formatCurrency(gain.gainAmount)}
          {gain.allowableCosts > 0 && (
            <> · Costs: {formatCurrency(gain.allowableCosts)} · Net: {formatCurrency(netGain)}</>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => dispatch({ type: OPEN_EDIT_GAIN_DIALOG, payload: gain.id })}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-destructive hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete capital gain"
        description={`Are you sure you want to delete "${gain.name}"? This cannot be undone.`}
        onConfirm={() => dispatch({ type: DELETE_GAIN, payload: gain.id })}
      />
    </div>
  )
}
