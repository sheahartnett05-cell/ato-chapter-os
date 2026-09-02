import { Bell, Search } from 'lucide-react'
import { useState } from 'react'
import { Logo } from './Logo'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  /** When false, hide compact Logo (sidebar already shows brand). Default true. */
  showBrand?: boolean
}

export function TopBar({ title, subtitle, actions, showBrand = true }: TopBarProps) {
  const [search, setSearch] = useState('')

  return (
    <header className="sticky top-[2px] z-20 border-b border-[var(--rule)] bg-[var(--surface-card)]">
      <div className="flex items-center justify-between gap-4 px-6 py-5 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          {showBrand && (
            <div className="hidden sm:block">
              <Logo compact onDark={false} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-serif text-2xl tracking-tight text-[var(--ink)]">{title}</h1>
            {subtitle && (
              <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative hidden lg:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-editorial w-44 py-2 pl-9 pr-3"
            />
          </div>
          <button
            type="button"
            className="relative min-h-11 min-w-11 border border-[var(--rule)] p-2.5 text-[var(--ink)] transition hover:bg-black/[0.03]"
            aria-label="Notifications"
          >
            <Bell size={16} strokeWidth={1.5} />
            <span
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5"
              style={{ background: 'var(--accent)' }}
            />
          </button>
          {actions}
        </div>
      </div>
    </header>
  )
}
