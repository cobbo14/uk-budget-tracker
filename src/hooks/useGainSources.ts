import { useAppContext } from '@/store/AppContext'
import { selectGainSources, selectGainById } from '@/store/selectors'

export function useGainSources() {
  const { state, dispatch } = useAppContext()
  const gainSources = selectGainSources(state)
  const getGainById = (id: string) => selectGainById(state, id)

  return { gainSources, getGainById, dispatch }
}
