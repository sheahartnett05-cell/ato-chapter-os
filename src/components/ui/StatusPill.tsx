const variants = {
  paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  outstanding: 'bg-red-50 text-red-800 border-red-200',
  partial: 'bg-amber-50 text-amber-900 border-amber-200',
  overdue: 'bg-red-100 text-red-900 border-red-300',
  active: 'bg-[var(--primary-subtle)] text-[var(--primary)] border-[var(--rule)]',
  newMember: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  alumni: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  present: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  absent: 'bg-red-50 text-red-800 border-red-200',
  excused: 'bg-amber-50 text-amber-900 border-amber-200',
  going: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  maybe: 'bg-amber-50 text-amber-900 border-amber-200',
  notGoing: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  high: 'bg-red-50 text-red-800 border-red-200',
  medium: 'bg-amber-50 text-amber-900 border-amber-200',
  low: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  gold: 'bg-[var(--accent-subtle)] text-[var(--primary)] border-[var(--rule)]',
  default: 'bg-neutral-100 text-neutral-700 border-neutral-200',
} as const

type Variant = keyof typeof variants

interface StatusPillProps {
  label: string
  variant?: Variant
}

export function StatusPill({ label, variant = 'default' }: StatusPillProps) {
  return (
    <span
      className={`tag inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${variants[variant]}`}
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
