import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type ToastTone = 'neutral' | 'success' | 'error'

export type ToastAction = {
  label: string
  onClick: () => void
}

export type ToastInput = {
  title: string
  description?: string
  tone?: ToastTone
  action?: ToastAction
  durationMs?: number
}

type ToastItem = ToastInput & { id: string }

type ToastContextValue = {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastSeq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, number>>(new Map())

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id)
    if (t) window.clearTimeout(t)
    timers.current.delete(id)
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `toast-${++toastSeq}`
      const duration = input.durationMs ?? (input.action ? 6000 : 3500)
      setItems((prev) => [...prev, { ...input, id }])
      const handle = window.setTimeout(() => dismiss(id), duration)
      timers.current.set(id, handle)
    },
    [dismiss]
  )

  useEffect(() => {
    const map = timers.current
    return () => {
      for (const t of map.values()) window.clearTimeout(t)
      map.clear()
    }
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[var(--z-toast)] flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 border border-[var(--rule)] bg-[var(--surface-card)] px-4 py-3 shadow-sm"
            role="status"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--ink)]">{item.title}</p>
              {item.description ? (
                <p className="mt-0.5 text-xs text-[var(--muted)]">{item.description}</p>
              ) : null}
            </div>
            {item.action ? (
              <button
                type="button"
                className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-[var(--accent-ink)] underline-offset-2 hover:underline"
                onClick={() => {
                  item.action?.onClick()
                  dismiss(item.id)
                }}
              >
                {item.action.label}
              </button>
            ) : null}
            <button
              type="button"
              className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)]"
              aria-label="Dismiss"
              onClick={() => dismiss(item.id)}
            >
              Close
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
