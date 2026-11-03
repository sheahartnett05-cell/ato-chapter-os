import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { bootCloud } from './components/routing/CloudBootstrap'
import { isGuestPreviewActive } from './lib/guestPreview'
import { clearDemoData, ensureGuestDemoFresh, STORAGE_KEYS } from './lib/demoSeed'
import { initPwaInstallCapture } from './lib/pwa/installPrompt'
import { registerServiceWorker } from './lib/pwa/registerServiceWorker'

try {
  if (!isGuestPreviewActive() && localStorage.getItem(STORAGE_KEYS.demoSeeded)) {
    clearDemoData()
  } else {
    ensureGuestDemoFresh()
  }
} catch {
  /* storage unavailable */
}

initPwaInstallCapture()
void registerServiceWorker()

void bootCloud().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  )
})
