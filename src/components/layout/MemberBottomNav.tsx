import { Link, useLocation } from 'react-router-dom'
import { CalendarDays, Megaphone, Settings, User, UsersRound } from 'lucide-react'

const NAV = [
  { to: '/my-dashboard', label: 'Room', icon: Megaphone, end: true },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/committees', label: 'Groups', icon: UsersRound },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

function isActive(pathname: string, to: string, end?: boolean) {
  if (end) return pathname === to || pathname === '/chapter-room'
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function MemberBottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-xl"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--surface-card) 96%, transparent)',
        borderColor: 'var(--rule)',
      }}
      aria-label="Chapter Room"
    >
      <div className="mx-auto flex max-w-lg justify-around py-2.5 md:max-w-2xl">
        {NAV.map((item) => {
          const { to, label, icon: Icon } = item
          const end = 'end' in item ? item.end : undefined
          const active = isActive(pathname, to, end)
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 font-mono text-[9px] uppercase tracking-wider ${
                active ? 'text-[var(--primary)]' : 'text-[var(--muted)]'
              }`}
            >
              <Icon size={18} strokeWidth={1.5} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
