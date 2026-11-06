import { NavLink, useLocation } from 'react-router-dom'
import { CalendarDays, Home, Settings, User, UsersRound } from 'lucide-react'
import { useChapterFeaturesOptional } from '../../context/ChapterFeaturesContext'
import { isMobileNavActive } from '../../lib/mobileNavActive'
import type { ChapterFeatureId } from '../../types/chapterFeatures'

const NAV = [
  { to: '/my-dashboard', label: 'Home', icon: Home, end: true },
  { to: '/calendar', label: 'Events', icon: CalendarDays, feature: 'calendar' as const },
  { to: '/committees', label: 'Groups', icon: UsersRound, feature: 'committees' as const },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'More', icon: Settings },
] as const

export function MemberBottomNav() {
  const { pathname } = useLocation()
  const features = useChapterFeaturesOptional()
  const featureOk = (id?: ChapterFeatureId) =>
    !id || features?.isFeatureEnabled(id) !== false

  const visibleNav = NAV.filter((item) => featureOk('feature' in item ? item.feature : undefined))

  return (
    <nav
      className="relative z-[var(--z-nav)] shrink-0 border-t bg-[var(--surface-card)] pb-[env(safe-area-inset-bottom,0px)]"
      style={{ borderColor: 'var(--rule)' }}
      aria-label="Chapter navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5 px-1.5 pt-1 md:max-w-2xl">
        {visibleNav.map((item) => {
          const { to, label, icon: Icon } = item
          const end = 'end' in item ? item.end : undefined
          const active = isMobileNavActive(pathname, to, Boolean(end))
          return (
            <NavLink
              key={to}
              to={to}
              end={Boolean(end)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
                active
                  ? 'bg-[var(--primary-subtle)] text-[var(--primary)]'
                  : 'text-[var(--muted)] active:bg-black/[0.03]'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} aria-hidden />
              <span className="truncate">{label}</span>
              {active ? (
                <span
                  className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-[var(--accent)]"
                  aria-hidden
                />
              ) : null}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
