import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { Maximize2, QrCode, X } from 'lucide-react'
import {
  closeCheckInSession,
  getOpenCheckInSession,
  liveCheckInPayload,
  openCheckInSession,
  type CheckInSession,
} from '../../lib/attendance/checkInSession'

type Props = {
  eventId: string
  eventName: string
  chapterKey: string
  canManage: boolean
  checkedInCount: number
  rosterCount: number
  openedBy?: string
}

export function CheckInQrPanel({
  eventId,
  eventName,
  chapterKey,
  canManage,
  checkedInCount,
  rosterCount,
  openedBy,
}: Props) {
  const [session, setSession] = useState<CheckInSession | null>(() =>
    getOpenCheckInSession(eventId, chapterKey)
  )
  const [now, setNow] = useState(Date.now())
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    setSession(getOpenCheckInSession(eventId, chapterKey))
  }, [eventId, chapterKey])

  useEffect(() => {
    if (!session || session.closedAt) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [session])

  const live = useMemo(() => {
    if (!session || session.closedAt) return null
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    return liveCheckInPayload(session, origin, now)
  }, [session, now])

  useEffect(() => {
    if (!live?.url) {
      setQrDataUrl('')
      return
    }
    let cancelled = false
    void QRCode.toDataURL(live.url, {
      width: 420,
      margin: 1,
      color: { dark: '#1a1a1a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [live?.url])

  const open = () => {
    const next = openCheckInSession({ eventId, chapterKey, openedBy })
    setSession(next)
    setNow(Date.now())
  }

  const close = () => {
    closeCheckInSession(eventId, chapterKey)
    setSession(null)
    setFullscreen(false)
  }

  if (!canManage && (!session || session.closedAt)) {
    return (
      <p className="p-6 text-sm text-[var(--muted)]">
        Officers have not opened QR check-in for this event yet.
      </p>
    )
  }

  const panel = (
    <div
      className={
        fullscreen
          ? 'fixed inset-0 z-[80] flex flex-col items-center justify-center gap-6 bg-[var(--surface-tint)] p-8'
          : 'space-y-4 border border-[var(--rule)] bg-[var(--surface-card)] p-5'
      }
    >
      <div className="flex w-full max-w-lg items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Chapter QR check-in
          </p>
          <h3 className="mt-1 font-serif text-2xl tracking-tight text-[var(--ink)]">{eventName}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {checkedInCount} / {rosterCount} checked in · code rotates every{' '}
            {session?.rotateSeconds ?? 30}s
          </p>
        </div>
        {fullscreen ? (
          <button type="button" className="btn-ghost" onClick={() => setFullscreen(false)}>
            <X size={16} /> Close display
          </button>
        ) : null}
      </div>

      {!session || session.closedAt ? (
        <div className="space-y-3">
          <p className="max-w-md text-sm text-[var(--muted)]">
            Opens a chapter-scoped QR for this event. Members scan to mark Present. Codes rotate so
            screenshots go stale quickly.
          </p>
          {canManage ? (
            <button type="button" className="btn-primary" onClick={open}>
              <QrCode size={16} /> Open QR check-in
            </button>
          ) : null}
        </div>
      ) : live ? (
        <div className="flex w-full max-w-lg flex-col items-center gap-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`Check-in QR for ${eventName}`}
              className={fullscreen ? 'h-[min(70vw,520px)] w-[min(70vw,520px)]' : 'h-56 w-56'}
            />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center border border-[var(--rule)] text-sm text-[var(--muted)]">
              Generating QR…
            </div>
          )}
          <p className="font-mono text-4xl tracking-[0.35em] text-[var(--ink)] sm:text-5xl">
            {live.code}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
            Refreshes in {live.secondsLeft}s
          </p>
          {!fullscreen && canManage ? (
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" className="btn-ghost" onClick={() => setFullscreen(true)}>
                <Maximize2 size={14} /> Projector view
              </button>
              <button type="button" className="btn-ghost" onClick={close}>
                Close session
              </button>
            </div>
          ) : null}
          <p className="max-w-md text-center text-xs text-[var(--muted)]">
            QR is bound to this chapter. Validated on this browser; cloud multi-device enforcement
            still uses shared chapter storage when sync is on.
          </p>
        </div>
      ) : null}
    </div>
  )

  return panel
}
