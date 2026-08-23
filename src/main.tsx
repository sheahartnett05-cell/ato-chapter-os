import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { isGuestPreviewActive } from './lib/guestPreview'
import { clearDemoData, STORAGE_KEYS } from './lib/demoSeed'

/** Drop leftover demo chapter data when not in guest preview */
try {
  if (!isGuestPreviewActive() && localStorage.getItem(STORAGE_KEYS.demoSeeded)) {
    clearDemoData()
  }
} catch {
  /* storage unavailable */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

