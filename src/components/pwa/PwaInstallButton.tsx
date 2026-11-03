import { useEffect, useState } from 'react'
import {
  canPromptPwaInstall,
  isStandaloneDisplay,
  promptPwaInstall,
  subscribePwaInstall,
} from '../../lib/pwa/installPrompt'

export function PwaInstallButton() {
  const [, bump] = useState(0)
  useEffect(() => subscribePwaInstall(() => bump((n) => n + 1)), [])

  if (isStandaloneDisplay()) {
    return (
      <p className="text-xs text-[var(--muted)]">Running as installed app.</p>
    )
  }

  if (!canPromptPwaInstall()) {
    return (
      <p className="text-xs text-[var(--muted)]">
        On supported mobile browsers, use the share/menu action → Add to Home Screen.
      </p>
    )
  }

  return (
    <button
      type="button"
      className="btn-primary min-h-11 w-full sm:w-auto"
      onClick={() => void promptPwaInstall()}
    >
      Install app
    </button>
  )
}
