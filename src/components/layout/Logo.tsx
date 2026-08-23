import { Link } from 'react-router-dom'
import { useChapter } from '../../context/ChapterContext'

export function Logo({ compact = false, onDark = true }: { compact?: boolean; onDark?: boolean }) {
  const { chapter } = useChapter()

  return (
    <Link to="/home" className="flex items-center gap-2.5 group">
      <div
        className="flex h-9 w-9 items-center justify-center font-serif text-xs"
        style={{
          backgroundColor: onDark ? 'var(--accent)' : 'var(--primary)',
          color: onDark ? 'var(--accent-foreground)' : 'var(--primary-foreground)',
        }}
      >
        {chapter.letters}
      </div>
      {!compact && (
        <div className="min-w-0 leading-tight">
          <span
            className={`block truncate font-serif text-sm tracking-tight ${
              onDark ? 'text-white' : 'text-[var(--ink)]'
            }`}
          >
            {chapter.nickname}
          </span>
          <span
            className={`block truncate font-mono text-[9px] uppercase tracking-[0.14em] ${
              onDark ? 'text-white/50' : 'text-[var(--muted)]'
            }`}
          >
            {chapter.chapterDesignation}
          </span>
        </div>
      )}
    </Link>
  )
}
