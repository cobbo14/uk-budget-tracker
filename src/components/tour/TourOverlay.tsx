import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTour } from './TourContext'
import { TOUR_STEPS } from './tourSteps'
import { Button } from '@/components/ui/button'

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

export function TourOverlay() {
  const { isActive, stepIndex, totalSteps, nextStep, prevStep, endTour } = useTour()
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null)

  const step = TOUR_STEPS[stepIndex]

  useEffect(() => {
    if (!isActive) return

    // Navigate to the required tab first
    if (step.tab) {
      window.location.hash = step.tab
    }

    // Wait for React to re-render the new tab content
    const timer = setTimeout(() => {
      if (!step.targetSelector) {
        setSpotlightRect(null)
        return
      }
      const el = document.querySelector(step.targetSelector)
      if (!el) {
        setSpotlightRect(null)
        return
      }
      if (step.scrollToTarget) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      // Re-read rect after potential scroll
      const afterScrollTimer = setTimeout(() => {
        const rect = el.getBoundingClientRect()
        setSpotlightRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
      }, step.scrollToTarget ? 350 : 0)
      return () => clearTimeout(afterScrollTimer)
    }, 150)

    return () => clearTimeout(timer)
  }, [isActive, stepIndex, step])

  // Update spotlight rect on window resize
  useEffect(() => {
    if (!isActive || !step.targetSelector) return
    function update() {
      if (!step.targetSelector) return
      const el = document.querySelector(step.targetSelector)
      if (el) {
        const rect = el.getBoundingClientRect()
        setSpotlightRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
      }
    }
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [isActive, stepIndex, step.targetSelector])

  // Escape key to close tour
  useEffect(() => {
    if (!isActive) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') endTour()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isActive, endTour])

  if (!isActive) return null

  const isFirst = stepIndex === 0
  const isLast = stepIndex === totalSteps - 1
  const pad = 6

  return (
    <>
      {/* Spotlight element — box-shadow creates the dark backdrop with a clear hole */}
      {spotlightRect ? (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: spotlightRect.top - pad,
            left: spotlightRect.left - pad,
            width: spotlightRect.width + pad * 2,
            height: spotlightRect.height + pad * 2,
            borderRadius: 10,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
            zIndex: 9998,
            pointerEvents: 'none',
            border: '2px solid rgba(16,185,129,0.9)',
            transition: 'top 0.2s, left 0.2s, width 0.2s, height 0.2s',
          }}
        />
      ) : (
        /* No target — just a full dark overlay */
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 9998,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Bottom panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Tour step ${stepIndex + 1} of ${totalSteps}: ${step.title}`}
        style={{ zIndex: 9999 }}
        className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 px-4 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-lg rounded-xl border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {stepIndex + 1} / {totalSteps}
              </span>
              <div className="flex gap-1">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === stepIndex
                        ? 'w-4 bg-emerald-600'
                        : i < stepIndex
                          ? 'w-1.5 bg-emerald-600/40'
                          : 'w-1.5 bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={endTour}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Close tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 pb-4">
            <h3 className="font-semibold text-base mb-1">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 sm:px-5 pb-4 flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={endTour} className="text-muted-foreground">
              Skip tour
            </Button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <Button variant="outline" size="sm" onClick={prevStep}>
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <Button size="sm" onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isLast ? 'Finish' : 'Next'}
                {!isLast && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
