import { readJson, writeJson } from '../persist'
import {
  newCheckInSecret,
  rotatingCheckInCode,
  secondsUntilNextRotation,
  validateRotatingCheckInCode,
} from './rotatingCode'

export const CHECKIN_SESSIONS_KEY = 'chapter-os-checkin-sessions'
export const CHECKIN_ROTATE_PREF_KEY = 'chapter-os-checkin-rotate-pref'
export const DEFAULT_ROTATE_SECONDS = 30

/** Host-selectable door-code lifetimes (Pres / VP / Secretary). */
export const CHECKIN_ROTATE_OPTIONS = [
  { seconds: 30, label: '30 seconds' },
  { seconds: 10 * 60, label: '10 minutes' },
  { seconds: 30 * 60, label: '30 minutes' },
  { seconds: 60 * 60, label: '1 hour' },
  { seconds: 3 * 60 * 60, label: '3 hours' },
  { seconds: 6 * 60 * 60, label: '6 hours' },
  { seconds: 12 * 60 * 60, label: '12 hours' },
  { seconds: 24 * 60 * 60, label: '24 hours' },
] as const

export type CheckInRotateSeconds = (typeof CHECKIN_ROTATE_OPTIONS)[number]['seconds']

export type CheckInSession = {
  eventId: string
  /** Chapter-scoped key so foreign QRs cannot check into another chapter's demo/session */
  chapterKey: string
  secret: string
  rotateSeconds: number
  openedAt: string
  closedAt?: string
  openedBy?: string
}

export function isAllowedRotateSeconds(value: number): value is CheckInRotateSeconds {
  return CHECKIN_ROTATE_OPTIONS.some((o) => o.seconds === value)
}

export function readPreferredRotateSeconds(): CheckInRotateSeconds {
  try {
    const raw = localStorage.getItem(CHECKIN_ROTATE_PREF_KEY)
    const n = raw ? Number(raw) : NaN
    if (isAllowedRotateSeconds(n)) return n
  } catch {
    /* ignore */
  }
  return DEFAULT_ROTATE_SECONDS
}

export function writePreferredRotateSeconds(seconds: CheckInRotateSeconds) {
  try {
    localStorage.setItem(CHECKIN_ROTATE_PREF_KEY, String(seconds))
  } catch {
    /* ignore */
  }
}

export function formatRotateDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) {
    const m = Math.round(seconds / 60)
    return `${m} min`
  }
  const h = seconds / 3600
  return Number.isInteger(h) ? `${h} hr` : `${h.toFixed(1)} hr`
}

export function formatSecondsLeft(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  if (s < 60) return `${s}s`
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const rem = s % 60
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return rem > 0 && s < 10 * 60 ? `${m}m ${rem}s` : `${m}m`
}

export function chapterAttendanceKey(orgId: string, chapterDesignation: string): string {
  return `${orgId.trim().toLowerCase()}::${chapterDesignation.trim().toLowerCase()}`
}

export function readCheckInSessions(): CheckInSession[] {
  return readJson<CheckInSession[]>(CHECKIN_SESSIONS_KEY, [])
}

export function writeCheckInSessions(sessions: CheckInSession[]) {
  writeJson(CHECKIN_SESSIONS_KEY, sessions)
}

export function getOpenCheckInSession(
  eventId: string,
  chapterKey: string,
  sessions = readCheckInSessions()
): CheckInSession | null {
  const open = sessions.find(
    (s) =>
      s.eventId === eventId &&
      s.chapterKey === chapterKey &&
      !s.closedAt
  )
  return open ?? null
}

function flushCheckInCloud() {
  void import('../chapterCloud')
    .then(({ flushChapterKvQueue }) => flushChapterKvQueue())
    .catch(() => {})
}

export function openCheckInSession(input: {
  eventId: string
  chapterKey: string
  openedBy?: string
  rotateSeconds?: number
}): CheckInSession {
  const sessions = readCheckInSessions().map((s) =>
    s.eventId === input.eventId && !s.closedAt
      ? { ...s, closedAt: new Date().toISOString() }
      : s
  )
  const rotateSeconds = isAllowedRotateSeconds(input.rotateSeconds ?? NaN)
    ? input.rotateSeconds!
    : readPreferredRotateSeconds()
  writePreferredRotateSeconds(rotateSeconds)
  const session: CheckInSession = {
    eventId: input.eventId,
    chapterKey: input.chapterKey,
    secret: newCheckInSecret(),
    rotateSeconds,
    openedAt: new Date().toISOString(),
    openedBy: input.openedBy,
  }
  writeCheckInSessions([session, ...sessions].slice(0, 40))
  // Officer phones must see this session immediately when members scan.
  flushCheckInCloud()
  return session
}

/** Change rotation on a live session (new window schedule; current code may change). */
export function updateCheckInRotateSeconds(
  eventId: string,
  chapterKey: string,
  rotateSeconds: number
): CheckInSession | null {
  if (!isAllowedRotateSeconds(rotateSeconds)) return null
  const sessions = readCheckInSessions()
  let updated: CheckInSession | null = null
  const next = sessions.map((s) => {
    if (s.eventId === eventId && s.chapterKey === chapterKey && !s.closedAt) {
      updated = { ...s, rotateSeconds }
      return updated
    }
    return s
  })
  if (!updated) return null
  writePreferredRotateSeconds(rotateSeconds)
  writeCheckInSessions(next)
  flushCheckInCloud()
  return updated
}

export function closeCheckInSession(eventId: string, chapterKey: string): CheckInSession | null {
  const sessions = readCheckInSessions()
  let closed: CheckInSession | null = null
  const next = sessions.map((s) => {
    if (s.eventId === eventId && s.chapterKey === chapterKey && !s.closedAt) {
      closed = { ...s, closedAt: new Date().toISOString() }
      return closed
    }
    return s
  })
  if (closed) writeCheckInSessions(next)
  return closed
}

export function buildCheckInUrl(opts: {
  origin: string
  eventId: string
  chapterKey: string
  code: string
}): string {
  const url = new URL(`/check-in/${opts.eventId}`, opts.origin)
  url.searchParams.set('ch', opts.chapterKey)
  url.searchParams.set('code', opts.code)
  return url.toString()
}

export function liveCheckInPayload(session: CheckInSession, origin: string, now = Date.now()) {
  const epochSec = Math.floor(now / 1000)
  const code = rotatingCheckInCode(session.secret, session.rotateSeconds, epochSec)
  return {
    code,
    secondsLeft: secondsUntilNextRotation(session.rotateSeconds, epochSec),
    url: buildCheckInUrl({
      origin,
      eventId: session.eventId,
      chapterKey: session.chapterKey,
      code,
    }),
  }
}

export function tryValidateCheckIn(opts: {
  eventId: string
  chapterKey: string
  code: string
}): { ok: true; session: CheckInSession } | { ok: false; reason: string } {
  const session = getOpenCheckInSession(opts.eventId, opts.chapterKey)
  if (!session) {
    return { ok: false, reason: 'No open check-in for this chapter event.' }
  }
  if (session.chapterKey !== opts.chapterKey) {
    return { ok: false, reason: 'This QR belongs to a different chapter.' }
  }
  if (!validateRotatingCheckInCode(session.secret, session.rotateSeconds, opts.code)) {
    return { ok: false, reason: 'Code expired or incorrect. Scan again.' }
  }
  return { ok: true, session }
}
