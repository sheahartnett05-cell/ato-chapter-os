import type { BudgetLineItem } from '../../types/budget'

const SEGMENT_COLORS = [
  'var(--primary)',
  'var(--accent)',
  '#64748b',
  '#94a3b8',
  '#475569',
  '#cbd5e1',
  '#1e293b',
  '#c87941',
]

interface BudgetDonutChartProps {
  lineItems: BudgetLineItem[]
  size?: number
}

export function BudgetDonutChart({ lineItems, size = 220 }: BudgetDonutChartProps) {
  const total = lineItems.reduce((s, i) => s + i.allocated, 0)
  if (total <= 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full border border-[var(--rule)] bg-[var(--surface-card)]"
        style={{ width: size, height: size }}
      >
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">No data</p>
      </div>
    )
  }

  const radius = 42
  const circumference = 2 * Math.PI * radius
  let offset = 0

  const segments = lineItems.map((item, index) => {
    const pct = item.allocated / total
    const dash = pct * circumference
    const segment = {
      item,
      color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
      dash,
      offset,
      pct,
    }
    offset += dash
    return segment
  })

  const totalSpent = lineItems.reduce((s, i) => s + i.spent, 0)
  const totalAllocated = lineItems.reduce((s, i) => s + i.allocated, 0)
  const spentPct = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--rule)"
            strokeWidth="12"
          />
          {segments.map(({ item, color, dash, offset: segOffset }) => (
            <circle
              key={item.id}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-segOffset}
              className="transition-all duration-500"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="font-serif text-2xl tracking-tight text-[var(--ink)]">{spentPct}%</p>
          <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--muted)]">Spent</p>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2">
        {segments.map(({ item, color, pct }) => (
          <li key={item.id} className="flex items-center gap-3 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[var(--ink)]">{item.label}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                ${item.spent.toLocaleString()} / ${item.allocated.toLocaleString()} ·{' '}
                {Math.round(pct * 100)}%
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
