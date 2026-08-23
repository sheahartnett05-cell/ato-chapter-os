interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

/** Editorial surface — sharp border, no floating wash */
export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`theme-card ${padding ? 'p-5' : ''} ${className}`}>{children}</div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4 border-b border-[var(--rule)] pb-3">
      <div>
        <h3 className="font-serif text-xl tracking-tight text-[var(--ink)]">{title}</h3>
        {subtitle && (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
