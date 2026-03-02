import { useAppContext } from '@/store/AppContext'
import { selectIncomeSources, selectIncomeById } from '@/store/selectors'

export function useIncomeSources() {
  const { state, dispatch } = useAppContext()
  const incomeSources = selectIncomeSources(state)
  const getIncomeById = (id: string) => selectIncomeById(state, id)

  return { incomeSources, getIncomeById, dispatch }
}
