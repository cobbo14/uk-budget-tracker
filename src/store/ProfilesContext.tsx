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

  const switchProfile = useCallback((id: string) => {
    setData(prev => {
      const next = { ...prev, activeProfileId: id }
      saveProfiles(next)
      return next
    })
  }, [])

  const addProfile = useCallback((name: string): string => {
    const id = generateId()
    setData(prev => {
      const next = { profiles: [...prev.profiles, { id, name }], activeProfileId: id }
      saveProfiles(next)
      return next
    })
    return id
  }, [])

  const renameProfile = useCallback((id: string, name: string) => {
    setData(prev => {
      const next = {
        ...prev,
        profiles: prev.profiles.map(p => (p.id === id ? { ...p, name } : p)),
      }
      saveProfiles(next)
      return next
    })
  }, [])

  const deleteProfile = useCallback((id: string) => {
    setData(prev => {
      if (prev.profiles.length <= 1) return prev
      deleteProfileState(id)
      const remaining = prev.profiles.filter(p => p.id !== id)

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

      const newActiveId = prev.activeProfileId === id ? remaining[0].id : prev.activeProfileId
      const next = { profiles: remaining, activeProfileId: newActiveId }
      saveProfiles(next)
      return next
    })
  }, [])

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
