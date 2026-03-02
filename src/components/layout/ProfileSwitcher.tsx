import { useState, useRef } from 'react'
import { ChevronDown, Check, Pencil, Trash2, Plus, Users } from 'lucide-react'
import { useProfiles } from '@/store/ProfilesContext'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ProfileSwitcher() {
  const { profiles, activeProfileId, switchProfile, addProfile, renameProfile, deleteProfile } = useProfiles()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [newName, setNewName] = useState('')
  const newNameInputRef = useRef<HTMLInputElement>(null)

  const activeProfile = profiles.find(p => p.id === activeProfileId)

  function handleSwitch(id: string) {
    switchProfile(id)
    setOpen(false)
  }

  function startRename(id: string, currentName: string) {
    setEditingId(id)
    setEditingName(currentName)
  }

  function commitRename(id: string) {
    const trimmed = editingName.trim()
    if (trimmed) renameProfile(id, trimmed)
    setEditingId(null)
  }

  function handleRenameKeyDown(e: React.KeyboardEvent, id: string) {
    if (e.key === 'Enter') commitRename(id)
    if (e.key === 'Escape') setEditingId(null)
  }

  function handleAdd() {
    const trimmed = newName.trim()
    if (!trimmed) return
    addProfile(trimmed)
    setNewName('')
  }

  function handleAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          data-tour="profile-switcher"
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Switch profile"
        >
          <Users className="h-4 w-4" />
          <span className="max-w-[120px] truncate">{activeProfile?.name ?? 'Default'}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Profiles</DialogTitle>
        </DialogHeader>

        <div className="space-y-1">
          {profiles.map(profile => (
            <div
              key={profile.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent group"
            >
              {/* Active check / switch button */}
              <button
                onClick={() => handleSwitch(profile.id)}
                className="flex flex-1 items-center gap-2 text-left min-w-0"
              >
                <span className="w-4 flex-shrink-0">
                  {profile.id === activeProfileId && (
                    <Check className="h-4 w-4 text-emerald-600" />
                  )}
                </span>

                {editingId === profile.id ? (
                  <Input
                    autoFocus
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={() => commitRename(profile.id)}
                    onKeyDown={e => handleRenameKeyDown(e, profile.id)}
                    onClick={e => e.stopPropagation()}
                    className="h-7 text-sm py-0 px-1"
                  />
                ) : (
                  <span className="truncate text-sm">{profile.name}</span>
                )}
              </button>

              {/* Rename / Delete actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); startRename(profile.id, profile.name) }}
                  className="rounded p-1 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Rename ${profile.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); deleteProfile(profile.id) }}
                  disabled={profiles.length <= 1}
                  className="rounded p-1 hover:bg-background text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label={`Delete ${profile.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 flex gap-2">
          <Input
            ref={newNameInputRef}
            placeholder="New profile name…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={handleAddKeyDown}
            className="h-8 text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="flex-shrink-0 gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
