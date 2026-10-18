import type { StatTileViewModel } from './dashboardTypes'

/** Tiles with nothing meaningful to show are dropped so the row stays clean. */
export function isDisplayableTile(tile: StatTileViewModel): boolean {
  if (tile.loading) return true
  if (tile.empty) return false
  if (tile.value === '—' && !tile.context?.trim()) return false
  return true
}

export function filterDisplayableTiles(tiles: StatTileViewModel[]): StatTileViewModel[] {
  return tiles.filter(isDisplayableTile)
}

export function statGridClassName(count: number): string {
  if (count <= 0) return 'grid-cols-1'
  if (count === 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-2 max-[380px]:grid-cols-1'
  if (count === 3) return 'grid-cols-2 max-[380px]:grid-cols-1 lg:grid-cols-3'
  return 'grid-cols-2 max-[380px]:grid-cols-1 lg:grid-cols-4'
}
