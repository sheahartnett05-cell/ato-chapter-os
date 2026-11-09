import { useEffect } from 'react'

const HEIGHT = '--app-shell-height'
const TOP = '--app-shell-top'
const LOCK = 'app-shell-lock'

/**
 * Pin the app shell to the *visible* iOS Safari viewport.
 * Height-only sync (without top) left dead untappable space when the
 * visual viewport scrolled — every button looked broken on phones.
 */
export function useAppShellHeight(): void {
  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    const sync = () => {
      const vv = window.visualViewport
      const height = Math.round(vv?.height ?? window.innerHeight)
      const top = Math.round(vv?.offsetTop ?? 0)
      root.style.setProperty(HEIGHT, `${Math.max(height, 1)}px`)
      root.style.setProperty(TOP, `${top}px`)
    }

    body.classList.add(LOCK)
    sync()

    const vv = window.visualViewport
    vv?.addEventListener('resize', sync)
    vv?.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)

    return () => {
      body.classList.remove(LOCK)
      vv?.removeEventListener('resize', sync)
      vv?.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
    }
  }, [])
}
