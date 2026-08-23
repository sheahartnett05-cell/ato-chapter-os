import { contrastText } from '../../lib/themeUtils'

/**
 * Optically centered org lettermark.
 * Greek/Latin serif caps have uneven side-bearings — we size + center
 * with flex so marks don't sit heavy on the left.
 */
export function OrgLetterBadge({
  letters,
  backgroundColor,
  size = 40,
  className = '',
}: {
  letters: string
  backgroundColor: string
  size?: number
  className?: string
}) {
  const fg = contrastText(backgroundColor)
  const text = letters.trim()
  const len = text.length
  const fontSize =
    len <= 2 ? Math.round(size * 0.42) : len === 3 ? Math.round(size * 0.32) : Math.round(size * 0.26)

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor,
        color: fg,
        borderRadius: Math.max(3, Math.round(size * 0.1)),
      }}
      aria-hidden
    >
      <span
        className="pointer-events-none absolute inset-[12%] rounded-[1px] border opacity-20"
        style={{ borderColor: 'currentColor' }}
      />
      <span
        className="relative z-[1] grid place-items-center font-serif font-semibold"
        style={{
          fontSize,
          lineHeight: 1,
          letterSpacing: len > 2 ? '-0.06em' : '0.01em',
          // Optical vertical center for cap-height serifs
          transform: 'translateY(0.06em)',
          paddingLeft: len > 3 ? 1 : 0,
          paddingRight: len > 3 ? 1 : 0,
        }}
      >
        {text}
      </span>
    </span>
  )
}
