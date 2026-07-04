import { useMemo } from 'react'
import { useAppContext } from '@/store/AppContext'
import { selectIncomeSources, selectGainSources, sumAnnualExpenses } from '@/store/selectors'
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
    () => sumAnnualExpenses(state.expenses),
    [state.expenses],
  )

  const leftoverIncome = taxSummary.netIncome - totalAnnualExpenses

  return { taxSummary, rules, leftoverIncome }
}
