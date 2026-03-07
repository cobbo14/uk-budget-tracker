import { createContext, useContext, useReducer, useEffect, useRef, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { AppState, Expense } from '@/types'
import type { AppAction } from './actions'
import { reducer, DEFAULT_STATE } from './reducer'
import { loadProfileState, saveProfileState, syncSplitToOtherProfiles } from '@/services/localStorage'
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

  // Wrapped dispatch: push snapshot for data-modifying actions
  const dispatch = useCallback((action: AppAction) => {
    if (DATA_MODIFYING_ACTIONS.has(action.type)) {
      undoStackRef.current = [
        ...undoStackRef.current.slice(-(MAX_UNDO_DEPTH - 1)),
        stateRef.current,
      ]
      setCanUndo(true)
      baseDispatch(action)

      // Defer cross-profile split sync until after debounced save
      if (
        (action.type === ADD_EXPENSE || action.type === UPDATE_EXPENSE) &&
        action.payload.splitGroupId &&
        action.payload.splitConfig
      ) {
        pendingSplitSyncRef.current = action.payload
      }
    } else {
      baseDispatch(action)
    }
  }, [])

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
        setSavedAt(Date.now())
        setSaveError(false)
        // Run deferred split sync after the save completes
        const pending = pendingSplitSyncRef.current
        if (pending) {
          pendingSplitSyncRef.current = null
          syncSplitToOtherProfiles(pending, profileId)
        }
      } else {
        setSaveError(true)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [state, profileId])

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
