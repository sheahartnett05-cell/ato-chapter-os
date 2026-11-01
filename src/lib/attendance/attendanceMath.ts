import type { AttendanceEntry, AttendanceStatus, Member } from '../../types'

/**
 * Excuse → attendance transitions (authoritative rule):
 * - approve → Excused unless Present already (Present wins; do not overwrite).
 * - reject / reopen → if the row is Excused, revert to unrecorded, or restore
 *   Absent when a prior roll-call Absent was replaced by the excuse; a deny on a
 *   pending excuse with no Excused row marks Absent (unexcused).
 */

export type AttendanceSource = 'roll_call' | 'excuse' | 'check_in'

export type ExcuseAttendanceDecision = 'approved' | 'denied' | 'reopened'

export type AttendancePatch =
  | { kind: 'upsert'; entry: AttendanceEntry }
  | { kind: 'remove' }
  | { kind: 'noop' }

function recordedAtMs(entry: AttendanceEntry): number {
  if (!entry.recordedAt) return 0
  const t = Date.parse(entry.recordedAt)
  return Number.isFinite(t) ? t : 0
}

/** Clamp / drop non-finite points; never negative. */
export function normalizePoints(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, n)
}

/**
 * One authoritative row per member: keep the latest recordedAt.
 * Invalid / non-finite points are zeroed; points are never negative.
 */
export function normalizeAttendanceEntries(entries: AttendanceEntry[]): AttendanceEntry[] {
  const byMember = new Map<string, AttendanceEntry>()
  for (const raw of entries) {
    if (!raw?.memberId) continue
    const entry: AttendanceEntry = {
      ...raw,
      pointsEarned: normalizePoints(raw.pointsEarned),
    }
    const prev = byMember.get(entry.memberId)
    if (!prev || recordedAtMs(entry) >= recordedAtMs(prev)) {
      byMember.set(entry.memberId, entry)
    }
  }
  return [...byMember.values()]
}

export function normalizeAttendanceByEvent(
  attendanceByEvent: Record<string, AttendanceEntry[]>
): Record<string, AttendanceEntry[]> {
  const out: Record<string, AttendanceEntry[]> = {}
  for (const [eventId, list] of Object.entries(attendanceByEvent)) {
    out[eventId] = normalizeAttendanceEntries(list ?? [])
  }
  return out
}

/** Present and Excused count positively; unrecorded events are omitted. */
export function attendancePctFromEntries(entries: AttendanceEntry[]): number | null {
  const list = normalizeAttendanceEntries(entries)
  if (list.length === 0) return null
  let good = 0
  for (const e of list) {
    if (e.status === 'Present' || e.status === 'Excused') good += 1
  }
  return Math.round((good / list.length) * 100)
}

/** Per-event rate: recorded rows only (unrecorded stay out of the denominator). */
export function eventAttendancePct(entries: AttendanceEntry[]): number | null {
  return attendancePctFromEntries(entries)
}

export function memberAttendancePct(
  memberId: string,
  attendanceByEvent: Record<string, AttendanceEntry[]>
): number | null {
  const rows: AttendanceEntry[] = []
  for (const list of Object.values(attendanceByEvent)) {
    const hit = normalizeAttendanceEntries(list ?? []).find((e) => e.memberId === memberId)
    if (hit) rows.push(hit)
  }
  return attendancePctFromEntries(rows)
}

/**
 * Only Present earns event points. Prefer the event's configured points when
 * provided; otherwise use the stored row (already normalized ≥ 0).
 */
export function pointsFromEntry(
  entry: AttendanceEntry,
  eventPoints?: number
): number {
  if (entry.status !== 'Present') return 0
  if (eventPoints != null) return normalizePoints(eventPoints)
  return normalizePoints(entry.pointsEarned)
}

export function memberPoints(
  memberId: string,
  attendanceByEvent: Record<string, AttendanceEntry[]>,
  eventPointsById?: Record<string, number>
): number {
  let total = 0
  for (const [eventId, list] of Object.entries(attendanceByEvent)) {
    const hit = normalizeAttendanceEntries(list ?? []).find((e) => e.memberId === memberId)
    if (!hit) continue
    total += pointsFromEntry(hit, eventPointsById?.[eventId])
  }
  return total
}

export function formatAttendancePct(pct: number | null | undefined): string {
  if (pct == null || !Number.isFinite(pct)) return '—'
  return `${Math.round(pct)}%`
}

export function buildRollCallEntry(
  memberId: string,
  status: AttendanceStatus,
  pointsEarned: number,
  recordedAt: string
): AttendanceEntry {
  return {
    memberId,
    status,
    pointsEarned: status === 'Present' ? normalizePoints(pointsEarned) : 0,
    recordedAt,
    source: 'roll_call',
  }
}

export function attendancePatchForExcuseDecision(
  decision: ExcuseAttendanceDecision,
  memberId: string,
  existing: AttendanceEntry | undefined,
  recordedAt: string
): AttendancePatch {
  if (decision === 'approved') {
    if (existing?.status === 'Present') return { kind: 'noop' }
    const rollCallStatus =
      existing?.source === 'roll_call'
        ? existing.status
        : existing?.rollCallStatus
    return {
      kind: 'upsert',
      entry: {
        memberId,
        status: 'Excused',
        pointsEarned: 0,
        recordedAt,
        source: 'excuse',
        ...(rollCallStatus ? { rollCallStatus } : {}),
      },
    }
  }

  // denied | reopened
  if (existing?.status === 'Excused') {
    if (existing.rollCallStatus === 'Absent') {
      return {
        kind: 'upsert',
        entry: {
          memberId,
          status: 'Absent',
          pointsEarned: 0,
          recordedAt,
          source: 'roll_call',
        },
      }
    }
    return { kind: 'remove' }
  }

  if (decision === 'reopened') return { kind: 'noop' }

  // Pending deny with no Excused row → unexcused Absent
  return {
    kind: 'upsert',
    entry: {
      memberId,
      status: 'Absent',
      pointsEarned: 0,
      recordedAt,
      source: 'excuse',
    },
  }
}

export function computeAttendancePctMap(
  attendanceByEvent: Record<string, AttendanceEntry[]>
): Record<string, number | null> {
  const memberIds = new Set<string>()
  for (const list of Object.values(attendanceByEvent)) {
    for (const e of normalizeAttendanceEntries(list ?? [])) memberIds.add(e.memberId)
  }
  const map: Record<string, number | null> = {}
  for (const id of memberIds) {
    map[id] = memberAttendancePct(id, attendanceByEvent)
  }
  return map
}

export function computePointsMap(
  attendanceByEvent: Record<string, AttendanceEntry[]>,
  eventPointsById?: Record<string, number>
): Record<string, number> {
  const memberIds = new Set<string>()
  for (const list of Object.values(attendanceByEvent)) {
    for (const e of normalizeAttendanceEntries(list ?? [])) memberIds.add(e.memberId)
  }
  const map: Record<string, number> = {}
  for (const id of memberIds) {
    map[id] = memberPoints(id, attendanceByEvent, eventPointsById)
  }
  return map
}

/** Recompute roster attendancePct + points from recorded attendance. */
export function syncMemberAttendanceStanding(
  members: Member[],
  attendanceByEvent: Record<string, AttendanceEntry[]>,
  eventPointsById?: Record<string, number>
): Member[] {
  const pctMap = computeAttendancePctMap(attendanceByEvent)
  const ptsMap = computePointsMap(attendanceByEvent, eventPointsById)
  const seasonStarted = Object.values(attendanceByEvent).some(
    (list) => normalizeAttendanceEntries(list ?? []).length > 0
  )

  return members.map((m) => {
    let next = m
    const pct = pctMap[m.id]
    if (pct !== undefined) {
      if (pct !== m.attendancePct) next = { ...next, attendancePct: pct }
    } else if (seasonStarted && m.attendancePct != null) {
      // Never recorded while others have rows → "—", never a fake 0%
      next = { ...next, attendancePct: null }
    }

    if (Object.prototype.hasOwnProperty.call(ptsMap, m.id)) {
      const pts = ptsMap[m.id]!
      if (pts !== next.points) next = { ...next, points: pts }
    } else if (seasonStarted && next.points !== 0) {
      next = { ...next, points: 0 }
    }
    return next
  })
}
