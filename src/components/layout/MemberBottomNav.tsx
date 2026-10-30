import { NavLink } from 'react-router-dom'
import { CalendarDays, Megaphone, Settings, User, UsersRound } from 'lucide-react'
import { useChapterFeaturesOptional } from '../../context/ChapterFeaturesContext'
import type { ChapterFeatureId } from '../../types/chapterFeatures'

const NAV = [
  { to: '/my-dashboard', label: 'Room', icon: Megaphone, end: true },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, feature: 'calendar' as const },
  { to: '/committees', label: 'Groups', icon: UsersRound, feature: 'committees' as const },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

export function MemberBottomNav() {
  const features = useChapterFeaturesOptional()
  const featureOk = (id?: ChapterFeatureId) =>
    !id || features?.isFeatureEnabled(id) !== false

  const visibleNav = NAV.filter((item) => featureOk('feature' in item ? item.feature : undefined))

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[var(--z-nav)] border-t backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)]"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--surface-card) 96%, transparent)',
        borderColor: 'var(--rule)',
      }}
      aria-label="Chapter Room"
    >
      <div className="mx-auto flex max-w-lg justify-around py-2.5 md:max-w-2xl">
        {visibleNav.map((item) => {
          const { to, label, icon: Icon } = item
          const end = 'end' in item ? item.end : undefined
          return (
            <NavLink
              key={to}
              to={to}
              end={Boolean(end)}
              className={({ isActive }) =>
                `flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 px-3 py-1 font-mono text-[11px] uppercase tracking-wider ${
                  isActive ? 'text-[var(--primary)]' : 'text-[var(--muted)]'
                }`
              }
            >
              <Icon size={18} strokeWidth={1.5} aria-hidden />
              {label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
