import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Table2,
  UserSearch,
  Kanban,
  Smartphone,
  ChevronDown,
} from 'lucide-react'
import { Logo } from './Logo'
import { useState } from 'react'

const execNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/events/e2', label: 'Events', icon: CalendarDays },
  { to: '/tables/t1', label: 'Chapter Tables', icon: Table2 },
  { to: '/recruitment', label: 'Recruitment', icon: UserSearch },
  { to: '/recruitment/pipeline', label: 'Pipeline', icon: Kanban },
]

export function Sidebar() {
  const location = useLocation()
  const [recruitmentOpen, setRecruitmentOpen] = useState(
    location.pathname.startsWith('/recruitment')
  )

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-navy text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Logo />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
          Executive
        </p>
        <ul className="space-y-0.5">
          {execNav.slice(0, 4).map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon size={18} className="shrink-0 opacity-80" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setRecruitmentOpen(!recruitmentOpen)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
          >
            <span className="flex items-center gap-3">
              <UserSearch size={18} className="opacity-80" />
              Recruitment
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${recruitmentOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {recruitmentOpen && (
            <ul className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
              {execNav.slice(4).map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        isActive
                          ? 'text-gold font-medium'
                          : 'text-white/60 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={15} />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
          Member View
        </p>
        <NavLink
          to="/my-dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-gold/20 text-gold-light'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <Smartphone size={18} className="shrink-0 opacity-80" />
          My Dashboard
        </NavLink>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-sm font-bold text-navy">
            MC
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Marcus Chen</p>
            <p className="truncate text-xs text-white/50">President</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
