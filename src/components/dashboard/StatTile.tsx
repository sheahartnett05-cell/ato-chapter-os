import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp } from 'lucide-react'
import type { StatTileViewModel } from '../../lib/dashboard/dashboardTypes'
import { tileMeta, DEFAULT_TILE_ICON } from '../../lib/dashboard/tileRegistryMeta'

type Props = {
  tile: StatTileViewModel
  className?: string
}

const CELL =
  'flex h-full min-h-[8.5rem] flex-col bg-[var(--surface-card)] p-4 sm:p-5'

function trendColor(trend: NonNullable<StatTileViewModel['trend']>) {
  const good =
    (trend.direction === 'up' && trend.goodWhen === 'up') ||
    (trend.direction === 'down' && trend.goodWhen === 'down')
  return good ? 'text-emerald-700' : 'text-red-700'
}

function tileHref(tile: StatTileViewModel) {
  if (!tile.search) return tile.href
  const s = tile.search
  if (s.startsWith('?') || s.startsWith('#')) return `${tile.href}${s}`
  return `${tile.href}?${s}`
}

export function StatTile({ tile, className = '' }: Props) {
  const Icon = tileMeta(tile.id).icon ?? DEFAULT_TILE_ICON

  if (tile.loading) {
    return (
      <div className={`${CELL} animate-pulse ${className}`}>
        <div className="h-3 w-24 rounded bg-black/5" />
        <div className="mt-4 h-8 w-20 rounded bg-black/5" />
      </div>
    )
  }

  return (
    <Link
      to={tileHref(tile)}
      className={`${CELL} transition hover:bg-black/[0.02] ${className}`}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)]">
          <Icon size={13} strokeWidth={1.75} className="shrink-0 text-[var(--primary)]" />
          <span className="truncate">{tile.label}</span>
        </div>

        <div className="mt-3 flex items-start justify-between gap-2">
          <p className="min-w-0 whitespace-nowrap font-serif text-[clamp(1.35rem,4.5vw,1.875rem)] leading-none tracking-tight text-[var(--ink)]">
            {tile.value}
          </p>
          {tile.trend && (
            <span
              className={`flex shrink-0 items-center gap-0.5 font-mono text-[10px] ${trendColor(tile.trend)}`}
            >
              {tile.trend.direction === 'up' ? (
                <ArrowUp size={12} strokeWidth={2} />
              ) : (
                <ArrowDown size={12} strokeWidth={2} />
              )}
              {tile.trend.delta}
            </span>
          )}
        </div>

        {tile.context && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-[var(--muted)]">
            {tile.context}
          </p>
        )}
      </div>

      <div className="mt-auto pt-4">
        {tile.progress != null && tile.progress >= 0 ? (
          <div className="h-0.5 w-full bg-[var(--rule)]">
            <div
              className="h-full bg-[var(--accent)] transition-all"
              style={{ width: `${Math.min(100, Math.round(tile.progress * 100))}%` }}
            />
          </div>
        ) : (
          <div className="h-0.5" aria-hidden />
        )}
      </div>
    </Link>
  )
}
