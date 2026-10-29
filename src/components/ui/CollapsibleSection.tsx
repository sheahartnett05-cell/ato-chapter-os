import { ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'

type CollapsibleSectionProps = {
  title: ReactNode
  eyebrow?: string
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

export function CollapsibleSection({
  title,
  eyebrow,
  defaultOpen = true,
  children,
  className = '',
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-black/[0.06] bg-[var(--surface-card)] shadow-[0_1px_0_rgba(0,0,0,0.04)] ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 border-b border-[var(--rule)]/55 bg-black/[0.015] px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">
              {eyebrow}
            </p>
          )}
          <h2 className="font-serif text-lg tracking-tight text-[var(--ink)]">{title}</h2>
        </div>
        <ChevronDown
          size={18}
          className={`mt-0.5 shrink-0 text-[var(--muted)] transition ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open ? <div className="p-4 pt-3">{children}</div> : null}
    </section>
  )
}
