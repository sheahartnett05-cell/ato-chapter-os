import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { useFocusTrap } from '../../lib/useFocusTrap'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        tabIndex={-1}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full border border-[var(--rule)] bg-white ${widths[size]}`}
      >
        <div className="flex items-center justify-between border-b border-[var(--rule)] px-6 py-4">
          <h2 id={titleId} className="font-serif text-xl tracking-tight text-[var(--ink)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-m-1 rounded-sm p-2.5 text-[var(--muted)] transition hover:bg-black/[0.04] hover:text-[var(--ink)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[85vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
