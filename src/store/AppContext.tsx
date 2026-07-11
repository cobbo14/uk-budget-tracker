import { createContext, useContext, useReducer, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import type { AppState, Expense } from '@/types'
import type { AppAction } from './actions'
import { reducer, DEFAULT_STATE } from './reducer'
import { loadProfiles, loadProfileState, saveProfileState, syncSplitToOtherProfiles, deleteSplitFromOtherProfiles } from '@/services/localStorage'
import {
  ADD_INCOME, UPDATE_INCOME, DELETE_INCOME,
  ADD_GAIN, UPDATE_GAIN, DELETE_GAIN,
  ADD_EXPENSE, UPDATE_EXPENSE, DELETE_EXPENSE,
  UPDATE_SETTINGS,
  ADD_CUSTOM_CATEGORY, DELETE_CUSTOM_CATEGORY,
  HYDRATE,
} from './actions'

// Actions that modify data and should be pushed onto the undo stack
const DATA_MODIFYING_ACTIONS = new Set([
  ADD_INCOME, UPDATE_INCOME, DELETE_INCOME,
  ADD_GAIN, UPDATE_GAIN, DELETE_GAIN,
  ADD_EXPENSE, UPDATE_EXPENSE, DELETE_EXPENSE,
  UPDATE_SETTINGS,
  ADD_CUSTOM_CATEGORY, DELETE_CUSTOM_CATEGORY,
  HYDRATE,
])

const MAX_UNDO_DEPTH = 10

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  savedAt: number
  saveError: boolean
  canUndo: boolean
  undo: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children, profileId }: { children: ReactNode; profileId: string }) {
  const [state, baseDispatch] = useReducer(reducer, DEFAULT_STATE)
  const hydratedRef = useRef(false)
  const [savedAt, setSavedAt] = useState(0)
  const [saveError, setSaveError] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const undoStackRef = useRef<AppState[]>([])
  // Keep a live ref to state so the dispatch callback can read it without going stale
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Queue of split syncs to run after the next localStorage save
  const pendingSplitSyncRef = useRef<Expense | null>(null)
  // Split group ids whose copies need removing from other profiles (split
  // toggled off on an expense), drained after the next save
  const pendingSplitCleanupRef = useRef<string[]>([])
  // Last state object actually written to localStorage (reference equality)
  const savedStateRef = useRef<AppState | null>(null)
  // Timestamp of the last undo snapshot taken for UPDATE_SETTINGS
  const lastSettingsSnapshotRef = useRef(0)

  // Wrapped dispatch: push snapshot for data-modifying actions
  const dispatch = useCallback((action: AppAction) => {
    if (DATA_MODIFYING_ACTIONS.has(action.type)) {
      // Coalesce rapid consecutive settings updates (typing in a number field
      // fires one action per keystroke) into a single undo step so they don't
      // flush the 10-deep history.
      const now = Date.now()
      const coalesce = action.type === UPDATE_SETTINGS
        && now - lastSettingsSnapshotRef.current < 1000
      lastSettingsSnapshotRef.current = action.type === UPDATE_SETTINGS ? now : 0
      if (!coalesce) {
        undoStackRef.current = [
          ...undoStackRef.current.slice(-(MAX_UNDO_DEPTH - 1)),
          stateRef.current,
        ]
        setCanUndo(true)
      }
      baseDispatch(action)

      // Defer cross-profile split sync until after debounced save
      if (
        (action.type === ADD_EXPENSE || action.type === UPDATE_EXPENSE) &&
        action.payload.splitGroupId &&
        action.payload.splitConfig
      ) {
        pendingSplitSyncRef.current = action.payload
      }
      // Split toggled off: the previous version had a splitGroupId the new one
      // lacks — queue removal of the synced copies from other profiles
      if (action.type === UPDATE_EXPENSE) {
        const previous = stateRef.current.expenses.find(e => e.id === action.payload.id)
        if (previous?.splitGroupId && previous.splitGroupId !== action.payload.splitGroupId) {
          pendingSplitCleanupRef.current = [...pendingSplitCleanupRef.current, previous.splitGroupId]
        }
      }
    } else {
      baseDispatch(action)
    }
  }, [])

  // Run deferred cross-profile split work after a successful save: removals
  // first (split toggled off), then the upsert/prune sync
  const drainSplitQueues = useCallback(() => {
    const cleanups = pendingSplitCleanupRef.current
    if (cleanups.length > 0) {
      pendingSplitCleanupRef.current = []
      for (const groupId of cleanups) {
        deleteSplitFromOtherProfiles(groupId, profileId)
      }
    }
    const pending = pendingSplitSyncRef.current
    if (pending) {
      pendingSplitSyncRef.current = null
      syncSplitToOtherProfiles(pending, profileId)
    }
  }, [profileId])

  const undo = useCallback(() => {
    const stack = undoStackRef.current
    if (stack.length === 0) return
    const previous = stack[stack.length - 1]
    undoStackRef.current = stack.slice(0, -1)
    setCanUndo(undoStackRef.current.length > 0)
    baseDispatch({ type: HYDRATE, payload: previous })
  }, [])

  // Hydrate from localStorage on mount (keyed by profileId)
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    const saved = loadProfileState(profileId)
    baseDispatch({ type: HYDRATE, payload: saved })
  }, [profileId])

  // Debounced save on state change
  useEffect(() => {
    if (!hydratedRef.current) return
    const timer = setTimeout(() => {
      const success = saveProfileState(profileId, state)
      if (success) {
        savedStateRef.current = state
        setSavedAt(Date.now())
        setSaveError(false)
        drainSplitQueues()
      } else {
        setSaveError(true)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [state, profileId, drainSplitQueues])

  // Flush any pending debounced save when the provider unmounts (profile
  // switch remounts it via key) and when the page is hidden or closed —
  // otherwise edits made in the final 300ms would be lost.
  useEffect(() => {
    const flush = () => {
      if (!hydratedRef.current) return
      if (savedStateRef.current === stateRef.current) return
      // Never write back a profile that has just been deleted (the unmount
      // flush would otherwise resurrect its localStorage key)
      if (!loadProfiles().profiles.some(p => p.id === profileId)) return
      if (saveProfileState(profileId, stateRef.current)) {
        savedStateRef.current = stateRef.current
        drainSplitQueues()
      }
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      flush()
    }
  }, [profileId, drainSplitQueues])

  return (
    <AppContext.Provider value={{ state, dispatch, savedAt, saveError, canUndo, undo }}>
      {children}
    </AppContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- co-locating hook with its Provider is intentional
export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider')
  return ctx
}
