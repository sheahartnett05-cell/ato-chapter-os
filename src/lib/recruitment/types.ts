export interface RushCycle {
  id: string
  label: string
  startedAt: string
  archivedAt?: string
  bidDay?: string
}

export function slugTermLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function makeCycleId(label: string): string {
  return `cycle-${slugTermLabel(label) || 'term'}`
}
