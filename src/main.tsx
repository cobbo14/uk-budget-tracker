import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Prerendered pages live at real paths (/guide/…, /about, …) but the app is
// hash-routed. The PWA service worker's navigation fallback serves the root
// shell for those paths — without the prerendered pages' inline hash-sync
// script — so returning visitors would land on the Summary tab. Map the
// pathname onto the hash here, before first render.
const PATH_ROUTES = /^\/(guide(?:\/[\w-]+)?|about|contact|disclaimer|privacy|terms)\/?$/
if (!window.location.hash) {
  const match = window.location.pathname.match(PATH_ROUTES)
  if (match) window.location.hash = match[1]
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
