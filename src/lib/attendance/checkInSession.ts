import { readJson, writeJson } from '../persist'
import {
  newCheckInSecret,
  rotatingCheckInCode,
  secondsUntilNextRotation,
  validateRotatingCheckInCode,
} from './rotatingCode'

export const CHECKIN_SESSIONS_KEY = 'chapter-os-checkin-sessions'
export const DEFAULT_ROTATE_SECONDS = 30

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
  const session: CheckInSession = {
    eventId: input.eventId,
    chapterKey: input.chapterKey,
    secret: newCheckInSecret(),
    rotateSeconds: input.rotateSeconds ?? DEFAULT_ROTATE_SECONDS,
    openedAt: new Date().toISOString(),
    openedBy: input.openedBy,
  }
  writeCheckInSessions([session, ...sessions].slice(0, 40))
  return session
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
