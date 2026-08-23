import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export function PageShell({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto max-w-6xl space-y-10 px-6 py-10 lg:px-10 ${className}`}>
      {children}
    </div>
  )
}

export function Section({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex items-end justify-between gap-4 border-b border-[var(--rule)] pb-3">
        <div>
          <h2 className="font-serif text-2xl tracking-tight text-[var(--ink)]">{title}</h2>
          {subtitle && (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function ListRow({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex w-full items-center gap-4 border-b border-[var(--rule)] py-3.5 transition last:border-0 hover:bg-black/[0.02] ${className}`}
    >
      {children}
    </div>
  )
}

export function PrimaryActionRow({
  actions,
}: {
  actions: Array<{
    label: string
    icon: ReactNode
    onClick?: () => void
    to?: string
    primary?: boolean
  }>
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {actions.map(({ label, icon, onClick, to, primary }) => {
        const classes = primary ? 'btn-primary' : 'btn-ghost'
        const inner = (
          <>
            <span className="opacity-80">{icon}</span>
            <span>{label}</span>
          </>
        )
        if (to) {
          return (
            <Link key={label} to={to} className={`shrink-0 ${classes}`}>
              {inner}
            </Link>
          )
        }
        return (
          <button key={label} type="button" onClick={onClick} className={`shrink-0 ${classes}`}>
            {inner}
          </button>
        )
      })}
    </div>
  )
}
