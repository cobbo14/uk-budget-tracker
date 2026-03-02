import { useAppContext } from '@/store/AppContext'
import { UPDATE_SETTINGS } from '@/store/actions'
import type { AppSettings } from '@/types'

export function useAppSettings() {
  const { state, dispatch } = useAppContext()
  const { settings } = state

  function update(partial: Partial<AppSettings>) {
    dispatch({ type: UPDATE_SETTINGS, payload: partial })
  }

  return { settings, dispatch, update }
}
