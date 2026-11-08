import { useEffect } from 'react'

const VAR = '--app-shell-height'

/**
 * Keep mobile shells inside the *visible* viewport.
 * iOS Safari’s bottom toolbar overlays `100dvh` / layout viewport, which buried
 * our in-flow bottom tabs under the browser chrome.
 */
export function useAppShellHeight(): void {
  useEffect(() => {
    const root = document.documentElement

    const sync = () => {
      const vv = window.visualViewport
      const height = vv?.height ?? window.innerHeight
      root.style.setProperty(VAR, `${Math.round(height)}px`)
    }

    sync()
    const vv = window.visualViewport
    vv?.addEventListener('resize', sync)
    vv?.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)

    return () => {
      vv?.removeEventListener('resize', sync)
      vv?.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
    }
  }, [])
}
