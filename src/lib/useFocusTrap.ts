import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

/** Trap Tab focus inside `containerRef` while `active`; restores focus on cleanup. */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean
) {
  useEffect(() => {
    if (!active) return
    const root = containerRef.current
    if (!root) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const list = () =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
      )

    const first = list()[0]
    first?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const nodes = list()
      if (nodes.length === 0) return
      const start = nodes[0]
      const end = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === start) {
        e.preventDefault()
        end.focus()
      } else if (!e.shiftKey && document.activeElement === end) {
        e.preventDefault()
        start.focus()
      }
    }

    root.addEventListener('keydown', onKeyDown)
    return () => {
      root.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [active, containerRef])
}
