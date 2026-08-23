const variants = {
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  outstanding: 'bg-red-50 text-red-700 ring-red-600/20',
  partial: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  overdue: 'bg-red-100 text-red-800 ring-red-700/30',
  active: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  newMember: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  alumni: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  present: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  absent: 'bg-red-50 text-red-700 ring-red-600/20',
  excused: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  going: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  maybe: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  notGoing: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  high: 'bg-red-50 text-red-700 ring-red-600/20',
  medium: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  low: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  gold: 'bg-gold/10 text-gold-dark ring-gold/30',
  default: 'bg-slate-100 text-slate-700 ring-slate-500/20',
} as const

type Variant = keyof typeof variants

interface StatusPillProps {
  label: string
  variant?: Variant
}

export function StatusPill({ label, variant = 'default' }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${variants[variant]}`}
    >
      {label}
    </span>
  )
}

export function duesVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    Paid: 'paid',
    'Partially Paid': 'partial',
    Outstanding: 'outstanding',
    Overdue: 'overdue',
  }
  return map[status] ?? 'default'
}

export function memberStatusVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    Active: 'active',
    'New Member': 'newMember',
    Alumni: 'alumni',
    Inactive: 'default',
  }
  return map[status] ?? 'default'
}

export function rsvpVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    Going: 'going',
    Maybe: 'maybe',
    'Not Going': 'notGoing',
  }
  return map[status] ?? 'default'
}

export function attendanceVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    Present: 'present',
    Absent: 'absent',
    Excused: 'excused',
  }
  return map[status] ?? 'default'
}

export function priorityVariant(priority: string): Variant {
  const map: Record<string, Variant> = {
    high: 'high',
    medium: 'medium',
    low: 'low',
  }
  return map[priority] ?? 'default'
}
