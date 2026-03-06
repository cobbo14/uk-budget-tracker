const CONSENT_KEY = 'cookie_consent'

export type ConsentStatus = 'granted' | 'denied' | null

export function getConsentStatus(): ConsentStatus {
  try {
    const value = localStorage.getItem(CONSENT_KEY)
    if (value === 'granted' || value === 'denied') return value
  } catch {
    // localStorage unavailable
  }
  return null
}

export function setConsentStatus(status: 'granted' | 'denied') {
  try {
    localStorage.setItem(CONSENT_KEY, status)
  } catch {
    // localStorage unavailable
  }
}

/** Load the AdSense script dynamically when consent is granted. */
export function loadAdSense() {
  if (document.querySelector('script[src*="adsbygoogle"]')) return
  const script = document.createElement('script')
  script.async = true
  script.src =
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2628187029192066'
  script.crossOrigin = 'anonymous'
  document.head.appendChild(script)
}
