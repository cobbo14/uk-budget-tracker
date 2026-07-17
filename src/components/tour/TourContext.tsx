import { createContext, useContext, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { TOUR_STEPS, type TourStep } from './tourSteps'

// Steps that make no sense when budgeting mode hides the Planning/Gains tabs
const HIDDEN_IN_BUDGETING_MODE = new Set([
  'tab-planning', 'tab-gains', 'threshold-warnings', 'pension-optimiser',
])

interface TourContextValue {
  isActive: boolean
  stepIndex: number
  totalSteps: number
  steps: TourStep[]
  startTour: () => void
  nextStep: () => void
  prevStep: () => void
  endTour: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [steps, setSteps] = useState<TourStep[]>(TOUR_STEPS)
  // Where the user was when the tour started — restored when it ends
  const returnHashRef = useRef<string | null>(null)

  const startTour = useCallback(() => {
    const budgetingMode = localStorage.getItem('budgetingMode') === 'true'
    setSteps(budgetingMode
      ? TOUR_STEPS.filter(s => !HIDDEN_IN_BUDGETING_MODE.has(s.id))
      : TOUR_STEPS)
    returnHashRef.current = window.location.hash
    setStepIndex(0)
    setIsActive(true)
  }, [])

  const endTour = useCallback(() => {
    setIsActive(false)
    setStepIndex(0)
    if (returnHashRef.current != null) {
      window.location.hash = returnHashRef.current || 'summary'
      returnHashRef.current = null
    }
  }, [])

  const nextStep = useCallback(() => {
    if (stepIndex + 1 >= steps.length) {
      endTour()
    } else {
      setStepIndex(stepIndex + 1)
    }
  }, [stepIndex, steps.length, endTour])

  const prevStep = useCallback(() => {
    setStepIndex(i => Math.max(0, i - 1))
  }, [])

  return (
    <TourContext.Provider value={{ isActive, stepIndex, totalSteps: steps.length, steps, startTour, nextStep, prevStep, endTour }}>
      {children}
    </TourContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- co-locating hook with its Provider is intentional
export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within TourProvider')
  return ctx
}
