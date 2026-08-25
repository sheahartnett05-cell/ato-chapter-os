import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { bootCloud } from './components/routing/CloudBootstrap'
import { isGuestPreviewActive } from './lib/guestPreview'
import { clearDemoData, STORAGE_KEYS } from './lib/demoSeed'

try {
  if (!isGuestPreviewActive() && localStorage.getItem(STORAGE_KEYS.demoSeeded)) {
    clearDemoData()
  }
} catch {
  /* storage unavailable */
}

void bootCloud().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  )
})
