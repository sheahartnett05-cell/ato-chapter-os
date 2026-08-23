import { Bell, Search } from 'lucide-react'
import { useState } from 'react'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const [search, setSearch] = useState('')

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-8 py-4">
        <div>
          <h1 className="text-xl font-semibold text-navy">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder="Search members, events, PNMs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
            />
          </div>
          <button
            type="button"
            className="relative rounded-lg border border-border p-2 text-slate-500 transition hover:bg-surface hover:text-navy"
          >
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold" />
          </button>
          {actions}
        </div>
      </div>
    </header>
  )
}
