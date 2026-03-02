import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { TOUR_STEPS } from './tourSteps'

interface TourContextValue {
  isActive: boolean
  stepIndex: number
  totalSteps: number
  startTour: () => void
  nextStep: () => void
  prevStep: () => void
  endTour: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const startTour = useCallback(() => {
    setStepIndex(0)
    setIsActive(true)
  }, [])

  const nextStep = useCallback(() => {
    setStepIndex(i => {
      const next = i + 1
      if (next >= TOUR_STEPS.length) {
        setIsActive(false)
        return 0
      }
      return next
    })
  }, [])

  const prevStep = useCallback(() => {
    setStepIndex(i => Math.max(0, i - 1))
  }, [])

  const endTour = useCallback(() => {
    setIsActive(false)
    setStepIndex(0)
  }, [])

  return (
    <TourContext.Provider value={{ isActive, stepIndex, totalSteps: TOUR_STEPS.length, startTour, nextStep, prevStep, endTour }}>
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within TourProvider')
  return ctx
}
