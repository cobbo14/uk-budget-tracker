import { useState, useEffect, useRef, useCallback } from 'react'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { SEARCH_INDEX, type SearchItem } from './searchIndex'
import type { TabId } from '@/components/layout/TabNav'

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (tab: TabId, targetSelector?: string, hash?: string) => void
  budgetingMode: boolean
}

export function SearchDialog({ open, onOpenChange, onNavigate, budgetingMode }: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const items = budgetingMode
    ? SEARCH_INDEX.filter(item => !item.budgetingModeHidden)
    : SEARCH_INDEX

  const filtered = query.trim().length === 0
    ? items
    : items.filter(item => {
        const q = query.toLowerCase()
        return (
          item.label.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.keywords.some(kw => kw.includes(q))
        )
      })

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  const handleSelect = useCallback((item: SearchItem) => {
    onOpenChange(false)
    onNavigate(item.tab, item.targetSelector, item.hash)
  }, [onNavigate, onOpenChange])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault()
      handleSelect(filtered[selectedIndex])
    }
  }

  useEffect(() => {
    const listEl = listRef.current
    if (!listEl) return
    const selected = listEl.children[selectedIndex] as HTMLElement | undefined
    selected?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 top-[20%] translate-y-0 data-[state=closed]:slide-out-to-top-[20%] data-[state=open]:slide-in-from-top-[18%]">
        <DialogTitle className="sr-only">Search features</DialogTitle>
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search features..."
            className="flex-1 bg-transparent py-3 pl-2 text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
          )}
          {filtered.map((item, i) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={cn(
                'w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors',
                i === selectedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-accent/50',
              )}
            >
              <div className="min-w-0">
                <span className="font-medium block truncate">{item.label}</span>
                {item.description && (
                  <span className="text-xs text-muted-foreground block truncate">{item.description}</span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground/60 capitalize shrink-0">{item.tab}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
