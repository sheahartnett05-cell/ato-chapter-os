import { Link } from 'react-router-dom'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="flex items-center gap-1">
        <span
          className="font-serif text-xl font-bold text-white tracking-tight"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          ΑΤΩ
        </span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <circle cx="12" cy="12" r="10" stroke="#c87941" strokeWidth="1.5" />
          <path
            d="M12 5v14M5 12h14M8.5 8.5l7 7M15.5 8.5l-7 7"
            stroke="#c87941"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {!compact && (
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/90">
            Chapter OS
          </span>
          <span className="text-[10px] text-white/50">UWF · Fall 2025</span>
        </div>
      )}
    </Link>
  )
}
