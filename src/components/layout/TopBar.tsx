import { Bell, Search } from 'lucide-react'
import { useState } from 'react'
import { TopBarChapterModeLinks } from './ChapterModeNav'
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
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-5">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <TopBarChapterModeLinks />
          {showBrand && (
            <div className="hidden sm:block">
              <Logo compact onDark={false} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-2xl leading-tight tracking-tight text-[var(--ink)]">{title}</h1>
            {subtitle && (
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:shrink-0 lg:justify-end">
            {actions}
          </div>
        )}

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
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
            className="relative border border-[var(--rule)] p-2 text-[var(--ink)] transition hover:bg-black/[0.03]"
            aria-label="Notifications"
          >
            <Bell size={16} strokeWidth={1.5} />
            <span
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5"
              style={{ background: 'var(--accent)' }}
            />
          </button>
        </div>
      </div>
    </header>
  )
}
