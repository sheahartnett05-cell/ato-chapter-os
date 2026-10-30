import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  Home,
  Kanban,
  LayoutDashboard,
  Megaphone,
  PieChart,
  Scale,
  ScrollText,
  UserSearch,
  Users,
} from 'lucide-react'
import type { DashboardTileId } from './tileIds'

export type TileRegistryMeta = {
  label: string
  icon: LucideIcon
  href: string
}

export const TILE_REGISTRY: Record<DashboardTileId, TileRegistryMeta> = {
  dues: { label: 'Dues', icon: DollarSign, href: '/dues' },
  attendance: { label: 'Attendance', icon: CalendarDays, href: '/attendance' },
  next_event: { label: 'Next event', icon: CalendarDays, href: '/calendar' },
  rush_pipeline: { label: 'Rush pipeline', icon: UserSearch, href: '/recruitment' },
  budget: { label: 'Budget', icon: PieChart, href: '/budgets' },
  study_hours: { label: 'Study hours', icon: BookOpen, href: '/library-hours' },
  open_excuses: { label: 'Open excuses', icon: ClipboardCheck, href: '/attendance' },
  action_items: { label: 'Action items', icon: ClipboardList, href: '/home' },
  minutes_pending: { label: 'Minutes', icon: ScrollText, href: '/calendar' },
  roster_changes: { label: 'Roster', icon: Users, href: '/members' },
  good_standing: { label: 'Good standing', icon: Users, href: '/members' },
  standards_cases: { label: 'Standards', icon: Scale, href: '/standards' },
  repeat_absences: { label: 'Absences', icon: CalendarDays, href: '/members' },
  nm_class: { label: 'NM class', icon: Users, href: '/members' },
  nm_behind: { label: 'NM progress', icon: Users, href: '/members' },
  risk_forms: { label: 'Risk forms', icon: ClipboardList, href: '/calendar' },
  sober_monitors: { label: 'Sober monitors', icon: ClipboardCheck, href: '/calendar' },
  compliance_deadline: { label: 'Compliance', icon: ScrollText, href: '/chapter-setup' },
  service_hours: { label: 'Service hours', icon: Megaphone, href: '/chapter-setup' },
  funds_raised: { label: 'Philanthropy', icon: DollarSign, href: '/chapter-setup' },
  maintenance: { label: 'Maintenance', icon: Home, href: '/house' },
  chores: { label: 'Chores', icon: Home, href: '/house' },
  house_bills: { label: 'House bills', icon: DollarSign, href: '/house' },
  alumni: { label: 'Alumni', icon: Users, href: '/chapter-setup' },
  participation: { label: 'Participation', icon: Kanban, href: '/calendar' },
}

export function tileLabelUpper(id: DashboardTileId, recruitmentTerm?: string): string {
  if (id === 'rush_pipeline' && recruitmentTerm) {
    return `${recruitmentTerm} pipeline`.toUpperCase()
  }
  return TILE_REGISTRY[id].label.toUpperCase()
}

export function tileMeta(id: DashboardTileId): TileRegistryMeta {
  return TILE_REGISTRY[id]
}

/** Fallback icon when id missing from map */
export const DEFAULT_TILE_ICON: LucideIcon = LayoutDashboard
