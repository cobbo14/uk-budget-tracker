import { useMemo } from 'react'
import { useAppContext } from '@/store/AppContext'
import { selectIncomeSources, selectGainSources, selectTotalAnnualExpenses } from '@/store/selectors'
import { calculateTax } from '@/utils/taxCalculations'
import { getTaxRules } from '@/taxRules'

export function useTaxSummary() {
  const { state } = useAppContext()
  const incomeSources = selectIncomeSources(state)
  const gainSources = selectGainSources(state)

  const rules = useMemo(
    () => getTaxRules(state.settings.taxYear),
    [state.settings.taxYear],
  )

  const taxSummary = useMemo(
    () => calculateTax(incomeSources, state.settings, rules, gainSources),
    [incomeSources, gainSources, state.settings, rules],
  )

  const totalAnnualExpenses = useMemo(
    () => selectTotalAnnualExpenses(state),
    [state.expenses], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const leftoverIncome = taxSummary.netIncome - totalAnnualExpenses

  return { taxSummary, rules, leftoverIncome }
}
