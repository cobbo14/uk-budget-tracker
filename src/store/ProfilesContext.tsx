import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Profile } from '@/types'
import { loadProfiles, saveProfiles, deleteProfileState, loadProfileState, saveProfileState } from '@/services/localStorage'
import { generateId } from '@/utils/ids'

interface ProfilesContextValue {
  profiles: Profile[]
  activeProfileId: string
  switchProfile: (id: string) => void
  addProfile: (name: string) => string
  renameProfile: (id: string, name: string) => void
  deleteProfile: (id: string) => void
}

const ProfilesContext = createContext<ProfilesContextValue | null>(null)

export function ProfilesProvider({ children }: { children: ReactNode }) {
  const [{ profiles, activeProfileId }, setData] = useState(() => loadProfiles())

  // Storage writes live OUTSIDE the setData updaters: React (especially
  // StrictMode) may invoke updaters more than once, so they must stay pure.

  const switchProfile = useCallback((id: string) => {
    const next = { profiles, activeProfileId: id }
    saveProfiles(next)
    setData(next)
  }, [profiles])

  const addProfile = useCallback((name: string): string => {
    const id = generateId()
    const next = { profiles: [...profiles, { id, name }], activeProfileId: id }
    saveProfiles(next)
    setData(next)
    return id
  }, [profiles])

  const renameProfile = useCallback((id: string, name: string) => {
    const next = {
      activeProfileId,
      profiles: profiles.map(p => (p.id === id ? { ...p, name } : p)),
    }
    saveProfiles(next)
    setData(next)
  }, [profiles, activeProfileId])

  const deleteProfile = useCallback((id: string) => {
    if (profiles.length <= 1) return
    const remaining = profiles.filter(p => p.id !== id)
    const newActiveId = activeProfileId === id ? remaining[0].id : activeProfileId
    const next = { profiles: remaining, activeProfileId: newActiveId }

    // Persist the profile list first so any in-flight save/flush for the
    // deleted profile sees it as gone and skips writing its state back
    saveProfiles(next)
    deleteProfileState(id)

    // Clean up split expense references to the deleted profile:
    // 1. Remove splitConfig entries pointing to the deleted profile
    // 2. Remove orphaned synced copies originating from the deleted profile
    for (const profile of remaining) {
      const state = loadProfileState(profile.id)
      let dirty = false
      const updatedExpenses = state.expenses
        .filter(e => {
          // Remove synced copies that originated from the deleted profile
          if (e.splitOriginProfileId === id && !e.splitConfig) {
            dirty = true
            return false
          }
          return true
        })
        .map(e => {
          if (e.splitConfig?.some(p => p.profileId === id)) {
            dirty = true
            return {
              ...e,
              splitConfig: e.splitConfig.filter(p => p.profileId !== id),
            }
          }
          return e
        })
      if (dirty) {
        saveProfileState(profile.id, { ...state, expenses: updatedExpenses })
      }
    }

    setData(next)
  }, [profiles, activeProfileId])

  return (
    <ProfilesContext.Provider value={{ profiles, activeProfileId, switchProfile, addProfile, renameProfile, deleteProfile }}>
      {children}
    </ProfilesContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- co-locating hook with its Provider is intentional
export function useProfiles(): ProfilesContextValue {
  const ctx = useContext(ProfilesContext)
  if (!ctx) throw new Error('useProfiles must be used inside ProfilesProvider')
  return ctx
}
