import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WelcomeStep {
  title: string
  description: string
  targetSelectors: string[]
}

const WELCOME_STEPS: WelcomeStep[] = [
  {
    title: 'Define your use case',
    description:
      'Use these toggles to tailor the app to your needs. Switch between Employee and Sole Trader mode, or toggle between Budgeting-only and Full Features to show or hide tax planning tools.',
    targetSelectors: ['[data-welcome="toggles"]'],
  },
  {
    title: 'Read the Help section',
    description:
      'Head to the Help tab for a full overview of every feature — income types, expense tracking, tax planning tools, and more. A great place to start if you want to understand what the app can do.',
    targetSelectors: ['[data-tour="tab-help"]'],
  },
  {
    title: 'Update your Settings',
    description:
      'Configure your personal tax details in Settings — tax year, Scottish taxpayer status, pension contributions, student loan plan, and more. These feed directly into all tax calculations.',
    targetSelectors: ['[data-tour="tab-settings"]'],
  },
  {
    title: 'Populate your Information',
    description:
      'Add your income sources in the Income tab and your regular outgoings in Expenses. Once populated, the Summary dashboard and Planning tools will come to life with personalised insights.',
    targetSelectors: ['[data-tour="tab-income"]', '[data-tour="tab-expenses"]'],
  },
]

const STORAGE_KEY = 'welcomeCompleted'

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

function getBoundingRect(selectors: string[]): SpotlightRect | null {
  const rects: DOMRect[] = []
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (el) rects.push(el.getBoundingClientRect())
  }
  if (rects.length === 0) return null
  const top = Math.min(...rects.map(r => r.top))
  const left = Math.min(...rects.map(r => r.left))
  const right = Math.max(...rects.map(r => r.right))
  const bottom = Math.max(...rects.map(r => r.bottom))
  return { top, left, width: right - left, height: bottom - top }
}

export function WelcomeGuide() {
  const [active, setActive] = useState(() => localStorage.getItem(STORAGE_KEY) !== 'true')
  const [stepIndex, setStepIndex] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null)

  const step = WELCOME_STEPS[stepIndex]
  const totalSteps = WELCOME_STEPS.length
  const isFirst = stepIndex === 0
  const isLast = stepIndex === totalSteps - 1

  const dismiss = useCallback(() => {
    setActive(false)
    localStorage.setItem(STORAGE_KEY, 'true')
  }, [])

  const next = useCallback(() => {
    if (stepIndex >= totalSteps - 1) {
      dismiss()
    } else {
      setStepIndex(i => i + 1)
    }
  }, [stepIndex, totalSteps, dismiss])

  const prev = useCallback(() => {
    setStepIndex(i => Math.max(0, i - 1))
  }, [])

  // Compute spotlight rect when step changes
  useEffect(() => {
    if (!active) return
    // Ensure we're on the summary tab for step 1
    if (stepIndex === 0) {
      window.location.hash = 'summary'
    }
    const timer = setTimeout(() => {
      setSpotlightRect(getBoundingRect(step.targetSelectors))
    }, 100)
    return () => clearTimeout(timer)
  }, [active, stepIndex, step.targetSelectors])

  // Update spotlight on resize / scroll
  useEffect(() => {
    if (!active) return
    function update() {
      setSpotlightRect(getBoundingRect(WELCOME_STEPS[stepIndex].targetSelectors))
    }
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [active, stepIndex])

  // Escape key to dismiss
  useEffect(() => {
    if (!active) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [active, dismiss])

  if (!active) return null

  const pad = 6

  return (
    <>
      {/* Spotlight overlay */}
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
            transition: 'top 0.3s, left 0.3s, width 0.3s, height 0.3s',
          }}
        />
      ) : (
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

      {/* Click blocker — prevents interaction with the page while welcome is active */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
      />

      {/* Bottom panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Welcome step ${stepIndex + 1} of ${totalSteps}: ${step.title}`}
        style={{ zIndex: 9999 }}
        className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 px-4"
      >
        <div className="w-full max-w-lg rounded-xl border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-600">
                Getting Started
              </span>
              <span className="text-xs text-muted-foreground">
                {stepIndex + 1} / {totalSteps}
              </span>
              <div className="flex gap-1">
                {WELCOME_STEPS.map((_, i) => (
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
              onClick={dismiss}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Close welcome guide"
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
            <Button variant="ghost" size="sm" onClick={dismiss} className="text-muted-foreground">
              Skip
            </Button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <Button variant="outline" size="sm" onClick={prev}>
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <Button size="sm" onClick={next} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isLast ? 'Get Started' : 'Next'}
                {!isLast && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
