import type { Prospect } from '../../types'
import { currentTermLabel, localTodayIso } from '../demoRelativeDates'
import { makeCycleId, type RushCycle } from './types'

export type CycleMigrationResult = {
  cycles: RushCycle[]
  prospects: Prospect[]
  changed: boolean
}

/** Idempotent: ensure a current-term cycle exists and every prospect has a cycleId. */
export function migrateCyclesAndProspects(
  cyclesIn: RushCycle[] | null | undefined,
  prospectsIn: Prospect[]
): CycleMigrationResult {
  let changed = false
  let cycles = Array.isArray(cyclesIn) ? [...cyclesIn] : []

  if (cycles.length === 0) {
    const label = currentTermLabel()
    cycles = [
      {
        id: makeCycleId(label),
        label,
        startedAt: localTodayIso(),
      },
    ]
    changed = true
  }

  const active =
    cycles.find((c) => !c.archivedAt) ??
    [...cycles].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]

  if (!active) {
    return { cycles, prospects: prospectsIn, changed }
  }

  const knownIds = new Set(cycles.map((c) => c.id))
  const prospects = prospectsIn.map((p) => {
    if (p.cycleId && knownIds.has(p.cycleId)) return p
    changed = true
    return { ...p, cycleId: active.id }
  })

  return { cycles, prospects, changed }
}

export function findActiveCycle(cycles: RushCycle[]): RushCycle | undefined {
  return cycles.find((c) => !c.archivedAt)
}
