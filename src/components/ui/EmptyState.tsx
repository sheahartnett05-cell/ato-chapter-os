import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  compact?: boolean
  className?: string
}

/** Shared empty placeholder — serif title, muted copy, rule border (matches FeatureRoute card). */
export function EmptyState({
  title,
  description,
  icon,
  action,
  compact,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`border border-[var(--rule)] bg-[var(--surface-card)] text-center ${
        compact ? 'px-4 py-6' : 'px-6 py-8'
      } ${className}`}
    >
      {icon ? <div className="mb-3 flex justify-center text-[var(--muted)]">{icon}</div> : null}
      <p className="font-serif text-xl tracking-tight text-[var(--ink)]">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
