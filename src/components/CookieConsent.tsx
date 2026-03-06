import { useState, useEffect } from 'react'
import { getConsentStatus, setConsentStatus, loadAdSense } from '@/lib/cookieConsent'

export function CookieConsent() {
  const [visible, setVisible] = useState(() => getConsentStatus() === null)

  useEffect(() => {
    if (getConsentStatus() === 'granted') {
      loadAdSense()
    }
  }, [])

  function handleAccept() {
    setConsentStatus('granted')
    loadAdSense()
    setVisible(false)
  }

  function handleDecline() {
    setConsentStatus('denied')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6" role="dialog" aria-label="Cookie consent">
      <div className="mx-auto max-w-2xl rounded-lg border bg-background shadow-lg p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          We use cookies for advertising via Google AdSense on our guide pages.
          No personal financial data is ever shared.{' '}
          <a href="#privacy" className="text-emerald-600 hover:underline">
            Privacy Policy
          </a>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDecline}
            className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
