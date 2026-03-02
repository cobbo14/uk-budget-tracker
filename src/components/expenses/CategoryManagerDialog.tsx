import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useBudget } from '@/hooks/useBudget'
import { generateId } from '@/utils/ids'
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LIST } from '@/constants/expenseCategories'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ADD_CUSTOM_CATEGORY, DELETE_CUSTOM_CATEGORY } from '@/store/actions'

interface CategoryManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoryManagerDialog({ open, onOpenChange }: CategoryManagerDialogProps) {
  const { dispatch, customExpenseCategories, expensesByCategory } = useBudget()
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')

  function handleAdd() {
    const trimmed = newName.trim()
    if (!trimmed) { setError('Name is required'); return }

    const allLabels = [
      ...EXPENSE_CATEGORY_LIST.map(k => EXPENSE_CATEGORIES[k].label.toLowerCase()),
      ...customExpenseCategories.map(c => c.label.toLowerCase()),
    ]
    if (allLabels.includes(trimmed.toLowerCase())) {
      setError('A category with this name already exists')
      return
    }

    dispatch({ type: ADD_CUSTOM_CATEGORY, payload: { id: generateId(), label: trimmed } })
    setNewName('')
    setError('')
  }

  function expenseCountForCategory(catId: string): number {
    return (expensesByCategory.get(catId) ?? []).length
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Add or remove custom expense categories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Custom categories list */}
          {customExpenseCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">
              No custom categories yet. Add one below.
            </p>
          ) : (
            <div className="space-y-2">
              {customExpenseCategories.map(cat => {
                const count = expenseCountForCategory(cat.id)
                const inUse = count > 0
                return (
                  <div key={cat.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <span className="text-sm font-medium">{cat.label}</span>
                      {inUse && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {count} expense{count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      disabled={inUse}
                      title={inUse ? 'Reassign or delete all expenses in this category first' : 'Delete category'}
                      onClick={() => dispatch({ type: DELETE_CUSTOM_CATEGORY, payload: cat.id })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add new category */}
          <div className="grid gap-1.5 border-t pt-4">
            <Label htmlFor="new-category-name">New category name</Label>
            <div className="flex gap-2">
              <Input
                id="new-category-name"
                placeholder="e.g. Hobbies, Pet care"
                value={newName}
                onChange={e => { setNewName(e.target.value); setError('') }}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              />
              <Button onClick={handleAdd} className="shrink-0">Add</Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
