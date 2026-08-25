import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  UserSearch,
  Kanban,
  Smartphone,
  Megaphone,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Settings,
  Presentation,
  Scale,
  UsersRound,
  PieChart,
  Home,
  ScrollText,
} from 'lucide-react'
import { Logo } from './Logo'
import { MemberAvatar } from '../ui/MemberAvatar'
import { useAuth, usePermissions } from '../../context/AuthContext'
import { useChapter } from '../../context/ChapterContext'
import { useChapterFeaturesOptional } from '../../context/ChapterFeaturesContext'
import { useStandardsModuleConfig } from '../../hooks/useStandardsModuleConfig'
import { roleLabel } from '../../types/permissions'
import type { ChapterFeatureId } from '../../types/chapterFeatures'

const mainNav = [
  { to: '/home', label: 'Home', icon: LayoutDashboard, end: true },
  {
    to: '/announcements',
    label: 'Announcements',
    icon: Megaphone,
    perm: 'canPostAnnouncements' as const,
    feature: 'announcements' as const,
  },
  {
    to: '/members',
    label: 'Members',
    icon: Users,
    perm: 'canManageRoster' as const,
    feature: 'roster' as const,
  },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, feature: 'calendar' as const },
  { to: '/excuses', label: 'Excuses', icon: ClipboardCheck, perm: 'canAccessExecTools' as const, feature: 'calendar' as const },
  { to: '/library-hours', label: 'Library Hours', icon: BookOpen, perm: 'canVerifyStudyHours' as const, feature: 'studyHours' as const },
  {
    to: '/budgets',
    label: 'Budgets',
    icon: PieChart,
    perm: 'canManageBudgets' as const,
    feature: 'budgets' as const,
  },
  { to: '/house', label: 'House', icon: Home, feature: 'house' as const },
  { to: '/bylaws', label: 'Bylaws', icon: ScrollText, feature: 'bylaws' as const },
  { to: '/tables', label: 'Forms', icon: ClipboardList, feature: 'tables' as const },
  {
    to: '/committees',
    label: 'Committees',
    icon: UsersRound,
    feature: 'committees' as const,
  },
]

const recruitmentNav = [
  { to: '/recruitment', label: 'Overview', icon: UserSearch },
  { to: '/recruitment/pipeline', label: 'Pipeline', icon: Kanban },
]

const adminNav = [
  {
    to: '/standards',
    label: 'Standards',
    icon: Scale,
    perm: 'canViewJBoardCases' as const,
    feature: 'standards' as const,
    dynamicLabel: true as const,
  },
  {
    to: '/chapter-setup',
    label: 'Chapter Setup',
    icon: Settings,
    perm: 'canAccessAdminSettings' as const,
  },
  {
    to: '/exec-slides',
    label: 'Exec Slides',
    icon: Presentation,
    perm: 'canAccessExecTools' as const,
    feature: 'execSlides' as const,
  },
]

function NavItem({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 border-l-2 px-3 py-2 text-sm transition ${
          isActive
            ? 'border-[var(--accent)] bg-white/10 text-white'
            : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} strokeWidth={1.5} className={isActive ? 'text-[var(--accent)]' : 'text-white/40'} />
          {label}
        </>
      )}
    </NavLink>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 px-3 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-white/35">
      {children}
    </p>
  )
}

export function Sidebar() {
  const { chapter, languagePack } = useChapter()
  const { profile, role } = useAuth()
  const permissions = usePermissions()
  const features = useChapterFeaturesOptional()
  const isFeatureEnabled = features?.isFeatureEnabled ?? (() => true)
  const { moduleName } = useStandardsModuleConfig()

  const featureOk = (feature?: ChapterFeatureId) => !feature || isFeatureEnabled(feature)
  const visibleMain = mainNav.filter(
    (item) => featureOk(item.feature) && (!item.perm || permissions[item.perm])
  )
  const visibleAdmin = adminNav
    .filter((item) => featureOk(item.feature) && (!item.perm || permissions[item.perm]))
    .map((item) =>
      'dynamicLabel' in item && item.dynamicLabel
        ? { ...item, label: moduleName || item.label }
        : item
    )
  const showRecruitment = permissions.canManageRecruitment && isFeatureEnabled('recruitment')
  const displayName = `${profile.firstName} ${profile.lastName}`.trim() || 'Member'

  return (
    <aside className="theme-sidebar flex h-full w-56 shrink-0 flex-col">
      <div className="theme-stripe shrink-0" />

      <div className="border-b border-white/10 px-4 py-5">
        <Logo onDark />
        <div className="mt-4 flex gap-px">
          {[chapter.primaryColor, chapter.accentColor, chapter.secondaryColor].map((c) => (
            <span key={c} className="h-0.5 flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-2 py-5">
        <div>
          <SectionLabel>Main</SectionLabel>
          <ul>
            {visibleMain.map((item) => (
              <li key={item.to}>
                <NavItem {...item} />
              </li>
            ))}
          </ul>
        </div>

        {showRecruitment && (
          <div>
            <SectionLabel>{languagePack.recruitmentTerm}</SectionLabel>
            <ul>
              {recruitmentNav.map((item) => (
                <li key={item.to}>
                  <NavItem {...item} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {visibleAdmin.length > 0 && (
          <div>
            <SectionLabel>Admin</SectionLabel>
            <ul>
              {visibleAdmin.map((item) => (
                <li key={item.to}>
                  <NavItem {...item} />
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <SectionLabel>Account</SectionLabel>
          <ul>
            <li>
              <NavItem to="/settings" label="Settings" icon={Settings} />
            </li>
            <li>
              <NavLink
                to="/my-dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 border-l-2 px-3 py-2 text-sm transition ${
                    isActive
                      ? 'border-[var(--accent)] bg-white/10 text-white'
                      : 'border-transparent text-white/60 hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Smartphone
                      size={16}
                      strokeWidth={1.5}
                      className={isActive ? 'text-[var(--accent)]' : 'text-white/40'}
                    />
                    Chapter Room
                  </>
                )}
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          to="/profile"
          className="flex items-center gap-2.5 rounded-sm px-1 py-1 transition hover:bg-white/5"
        >
          <MemberAvatar
            photoUrl={profile.photoUrl}
            initials={profile.avatar || chapter.letters.slice(0, 2)}
            size="sm"
            accentColor="var(--accent)"
            className="font-mono text-[10px] font-semibold"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{displayName}</p>
            <p className="truncate font-mono text-[9px] uppercase tracking-wider text-white/45">
              {role ? roleLabel(role) : chapter.university}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
