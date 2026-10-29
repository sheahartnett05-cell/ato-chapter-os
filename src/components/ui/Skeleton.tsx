type SkeletonProps = {
  className?: string
}

/** Pulse block; respects prefers-reduced-motion via CSS. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton-block rounded-sm bg-[var(--rule)] ${className}`}
      aria-hidden
    />
  )
}

export function SkeletonRows({
  count = 3,
  className = '',
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={`space-y-3 ${className}`} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-2/5 max-w-[10rem]" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}
