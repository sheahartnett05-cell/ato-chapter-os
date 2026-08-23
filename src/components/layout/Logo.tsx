import { Link } from 'react-router-dom'
import { useChapter } from '../../context/ChapterContext'
import { OrgLetterBadge } from '../ui/OrgLetterBadge'

/** Product mark — agora portal with columns + arch */
export function AgoraMark({
  size = 36,
  onDark = false,
  className = '',
}: {
  size?: number
  onDark?: boolean
  className?: string
}) {
  const fill = onDark ? '#c4a35a' : '#1a1a1a'
  const ink = onDark ? '#141414' : '#c4a35a'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <rect width="40" height="40" rx="3" fill={fill} />
      <rect
        x="6.5"
        y="6.5"
        width="27"
        height="27"
        rx="1.25"
        stroke={ink}
        strokeWidth="1.25"
        fill="none"
        opacity={0.85}
      />
      <rect x="12" y="12" width="4.5" height="1.75" fill={ink} />
      <rect x="12.75" y="13.75" width="3" height="16.5" fill={ink} />
      <rect x="23.5" y="12" width="4.5" height="1.75" fill={ink} />
      <rect x="24.25" y="13.75" width="3" height="16.5" fill={ink} />
      <path
        d="M14.5 19c0-3.4 2.5-5.75 5.5-5.75S25.5 15.6 25.5 19"
        stroke={ink}
        strokeWidth="1.35"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="18.75" y="12.75" width="2.5" height="2.5" rx="0.3" fill={ink} />
      <rect x="11" y="30.25" width="18" height="1.5" fill={ink} />
    </svg>
  )
}

export function Logo({
  compact = false,
  onDark = true,
  to = '/home',
}: {
  compact?: boolean
  onDark?: boolean
  to?: string
}) {
  const { chapter } = useChapter()
  const isProduct = chapter.id === 'agora' || chapter.id === 'chapter-os'

  const title = isProduct ? 'Agora' : chapter.nickname
  const subtitle = isProduct
    ? 'Chapter operations'
    : chapter.chapterDesignation || chapter.letters

  const badgeColor = onDark ? chapter.accentColor : chapter.primaryColor

  return (
    <Link to={to} className="group flex items-center gap-2.5">
      {isProduct ? (
        <AgoraMark size={36} onDark={onDark} />
      ) : (
        <OrgLetterBadge letters={chapter.letters} backgroundColor={badgeColor} size={36} />
      )}

      {!compact && (
        <div className="min-w-0 leading-tight">
          <span
            className={`block truncate font-serif text-[15px] tracking-tight transition-opacity group-hover:opacity-90 ${
              onDark ? 'text-white' : 'text-[var(--ink)]'
            }`}
          >
            {title}
          </span>
          <span
            className={`mt-0.5 block truncate font-mono text-[9px] uppercase tracking-[0.16em] ${
              onDark ? 'text-white/45' : 'text-[var(--muted)]'
            }`}
          >
            {subtitle}
          </span>
        </div>
      )}
    </Link>
  )
}
