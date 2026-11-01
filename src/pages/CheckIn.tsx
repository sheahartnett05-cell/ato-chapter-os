import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, QrCode } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useChapter } from '../context/ChapterContext'
import { useChapterOps } from '../context/ChapterOpsContext'
import {
  chapterAttendanceKey,
  tryValidateCheckIn,
} from '../lib/attendance/checkInSession'
import { normalizePoints } from '../lib/attendance/attendanceMath'

export default function CheckInPage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const [params] = useSearchParams()
  const { events, setAttendanceEntry, getEventAttendance } = useChapterOps()
  const { chapter, selectedOrgId } = useChapter()
  const { memberId, isOnboarded } = useAuth()

  const chapterKey = useMemo(
    () => chapterAttendanceKey(selectedOrgId || chapter.id, chapter.chapterDesignation),
    [selectedOrgId, chapter.id, chapter.chapterDesignation]
  )

  const event = events.find((e) => e.id === eventId)
  const queryChapter = params.get('ch')?.trim() || chapterKey
  const queryCode = (params.get('code') || '').trim().toUpperCase()

  const [code, setCode] = useState(queryCode)
  const [message, setMessage] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const autoTried = useRef(false)

  const alreadyPresent =
    memberId != null &&
    getEventAttendance(eventId).some((a) => a.memberId === memberId && a.status === 'Present')

  const submit = (rawCode = code) => {
    setMessage(null)
    setOk(false)
    if (!event) {
      setMessage('Event not found in this chapter.')
      return
    }
    if (!isOnboarded || !memberId) {
      setMessage('Open the Chaptera app signed in (or guest demo) as a member, then scan again.')
      return
    }
    if (queryChapter && queryChapter !== chapterKey) {
      setMessage('This QR is for a different chapter than the one open in this browser.')
      return
    }
    const result = tryValidateCheckIn({
      eventId,
      chapterKey,
      code: rawCode,
    })
    if (!result.ok) {
      setMessage(result.reason)
      return
    }
    setAttendanceEntry(eventId, memberId, 'Present', normalizePoints(event.points), {
      source: 'check_in',
    })
    setOk(true)
    setMessage(`You're checked in for ${event.name}.`)
  }

  useEffect(() => {
    if (autoTried.current || !queryCode || alreadyPresent || !isOnboarded || !memberId) return
    autoTried.current = true
    submit(queryCode)
    // One-shot on mount when the QR deep-link includes a code
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryCode, alreadyPresent, isOnboarded, memberId])

  return (
    <div className="min-h-screen bg-[var(--surface-tint)] text-[var(--ink)]">
      <div className="theme-stripe" />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-10">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
            <QrCode size={12} className="mr-1 inline" />
            Chapter check-in
          </p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight">
            {event?.name ?? 'Event check-in'}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {chapter.chapterDesignation} · {chapter.university || 'Chapter'}
          </p>
        </div>

        {alreadyPresent || ok ? (
          <div className="border border-[var(--rule)] bg-[var(--surface-card)] p-5">
            <p className="flex items-center gap-2 font-semibold text-emerald-800">
              <CheckCircle2 size={18} /> Checked in
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {message ?? 'Present is already recorded for this meeting.'}
            </p>
            <Link to="/my-dashboard" className="btn-primary mt-4 inline-flex">
              Chapter Room
            </Link>
          </div>
        ) : (
          <div className="space-y-4 border border-[var(--rule)] bg-[var(--surface-card)] p-5">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                6-character code
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="input-editorial mt-2 font-mono text-2xl tracking-[0.3em]"
                placeholder="ABC234"
                autoCapitalize="characters"
                autoCorrect="off"
              />
            </label>
            <button type="button" className="btn-primary w-full" onClick={() => submit()}>
              Check in
            </button>
            {queryCode ? (
              <button
                type="button"
                className="btn-ghost w-full"
                onClick={() => submit(queryCode)}
              >
                Use code from QR
              </button>
            ) : null}
            {message ? <p className="text-sm text-red-800">{message}</p> : null}
            {!isOnboarded ? (
              <p className="text-sm text-[var(--muted)]">
                <Link to="/demo" className="underline-offset-2 hover:underline">
                  Enter the demo
                </Link>{' '}
                or sign in first, then open this link again.
              </p>
            ) : null}
          </div>
        )}
      </main>
    </div>
  )
}
