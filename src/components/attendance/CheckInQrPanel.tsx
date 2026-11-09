import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { Maximize2, Printer, QrCode, X } from 'lucide-react'
import {
  CHECKIN_ROTATE_OPTIONS,
  closeCheckInSession,
  formatRotateDuration,
  formatSecondsLeft,
  getOpenCheckInSession,
  liveCheckInPayload,
  openCheckInSession,
  readPreferredRotateSeconds,
  updateCheckInRotateSeconds,
  type CheckInRotateSeconds,
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

function printCheckInSheet(opts: {
  eventName: string
  code: string
  qrDataUrl: string
  rotateSeconds: number
  secondsLeft: number
}) {
  const validUntil = new Date(Date.now() + opts.secondsLeft * 1000)
  const untilLabel = validUntil.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
  const win = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900')
  if (!win) return
  win.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Check-in · ${opts.eventName.replace(/[<>&"]/g, '')}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 2rem;
      font-family: Georgia, "Times New Roman", serif;
      color: #141414;
      text-align: center;
    }
    h1 { font-size: 1.75rem; margin: 0 0 0.35rem; }
    .meta { font-family: ui-monospace, monospace; font-size: 0.75rem; letter-spacing: 0.08em;
      text-transform: uppercase; color: #5c5c5c; margin-bottom: 1.5rem; }
    img { width: min(70vw, 360px); height: auto; margin: 0 auto 1.25rem; display: block; }
    .code { font-family: ui-monospace, monospace; font-size: 3rem; letter-spacing: 0.35em;
      font-weight: 700; margin: 0.5rem 0 1rem; }
    .valid { font-size: 1rem; margin: 0; }
    .hint { margin-top: 1.5rem; font-size: 0.85rem; color: #5c5c5c; max-width: 28rem; margin-left: auto; margin-right: auto; }
    @media print {
      body { padding: 0.75in; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <p class="meta">Chapter QR check-in</p>
  <h1>${opts.eventName.replace(/[<>&]/g, '')}</h1>
  <p class="meta">Rotates every ${formatRotateDuration(opts.rotateSeconds)}</p>
  ${opts.qrDataUrl ? `<img src="${opts.qrDataUrl}" alt="Check-in QR" />` : ''}
  <p class="code">${opts.code}</p>
  <p class="valid"><strong>Valid until about ${untilLabel}</strong></p>
  <p class="hint">Members scan this QR or enter the code in the chapter app. After it rotates, print again for a fresh code.</p>
  <script>window.onload = function () { window.focus(); window.print(); }</script>
</body>
</html>`)
  win.document.close()
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
  const [rotateSeconds, setRotateSeconds] = useState<CheckInRotateSeconds>(() =>
    readPreferredRotateSeconds()
  )
  const [now, setNow] = useState(Date.now())
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const open = getOpenCheckInSession(eventId, chapterKey)
    setSession(open)
    if (open && !open.closedAt) {
      const match = CHECKIN_ROTATE_OPTIONS.find((o) => o.seconds === open.rotateSeconds)
      if (match) setRotateSeconds(match.seconds)
    }
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
      width: 720,
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

  const applyRotate = (next: CheckInRotateSeconds) => {
    setRotateSeconds(next)
    if (session && !session.closedAt) {
      const updated = updateCheckInRotateSeconds(eventId, chapterKey, next)
      if (updated) {
        setSession(updated)
        setNow(Date.now())
      }
    }
  }

  const open = () => {
    const next = openCheckInSession({
      eventId,
      chapterKey,
      openedBy,
      rotateSeconds,
    })
    setSession(next)
    setNow(Date.now())
    void import('../../lib/notifications/localPush').then(({ notifyLocalOnce }) =>
      notifyLocalOnce({
        title: 'QR check-in live',
        body: `${eventName} — code valid about ${formatRotateDuration(next.rotateSeconds)}.`,
        tag: `qr-live-${eventId}`,
        url: `/events/${eventId}`,
      })
    )
  }

  const close = () => {
    closeCheckInSession(eventId, chapterKey)
    setSession(null)
    setFullscreen(false)
  }

  const onPrint = () => {
    if (!live || !qrDataUrl) return
    printCheckInSheet({
      eventName,
      code: live.code,
      qrDataUrl,
      rotateSeconds: session?.rotateSeconds ?? rotateSeconds,
      secondsLeft: live.secondsLeft,
    })
  }

  if (!canManage && (!session || session.closedAt)) {
    return (
      <p className="p-6 text-sm text-[var(--muted)]">
        QR check-in is not open yet. Only the President, Vice President, or Secretary can start the
        rotating code for this event.
      </p>
    )
  }

  const rotateSelect =
    canManage ? (
      <label className="block max-w-xs text-left">
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
          Code lifetime
        </span>
        <select
          value={rotateSeconds}
          onChange={(e) => applyRotate(Number(e.target.value) as CheckInRotateSeconds)}
          className="input-editorial min-h-11 w-full text-sm"
        >
          {CHECKIN_ROTATE_OPTIONS.map((o) => (
            <option key={o.seconds} value={o.seconds}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    ) : null

  const panel = (
    <div
      className={
        fullscreen
          ? 'fixed inset-0 z-[80] flex flex-col items-center justify-center gap-6 overflow-y-auto bg-[var(--surface-tint)] p-6 sm:p-10'
          : 'space-y-4 border border-[var(--rule)] bg-[var(--surface-card)] p-5'
      }
    >
      <div className="flex w-full max-w-lg items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Chapter QR check-in
          </p>
          <h3
            className={`mt-1 font-serif tracking-tight text-[var(--ink)] ${
              fullscreen ? 'text-3xl sm:text-5xl' : 'text-2xl'
            }`}
          >
            {eventName}
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {checkedInCount} / {rosterCount} checked in · rotates every{' '}
            {formatRotateDuration(session?.rotateSeconds ?? rotateSeconds)}
          </p>
        </div>
        {fullscreen ? (
          <button type="button" className="btn-ghost shrink-0" onClick={() => setFullscreen(false)}>
            <X size={16} /> Close display
          </button>
        ) : null}
      </div>

      {!session || session.closedAt ? (
        <div className="space-y-4">
          <p className="max-w-md text-sm text-[var(--muted)]">
            Opens a chapter-scoped QR for this event. Only Pres / VP / Secretary can host it. Pick
            how long each code stays valid — longer windows are better for printed sheets;
            short windows stop screenshot sharing.
          </p>
          {rotateSelect}
          {canManage ? (
            <button type="button" className="btn-primary" onClick={open}>
              <QrCode size={16} /> Open QR check-in
            </button>
          ) : null}
        </div>
      ) : live ? (
        <div className="flex w-full max-w-lg flex-col items-center gap-4">
          {!fullscreen && rotateSelect}
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`Check-in QR for ${eventName}`}
              className={
                fullscreen
                  ? 'h-[min(72vw,560px)] w-[min(72vw,560px)]'
                  : 'h-56 w-56'
              }
            />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center border border-[var(--rule)] text-sm text-[var(--muted)]">
              Generating QR…
            </div>
          )}
          <p
            className={`font-mono tracking-[0.35em] text-[var(--ink)] ${
              fullscreen ? 'text-5xl sm:text-7xl' : 'text-4xl sm:text-5xl'
            }`}
          >
            {live.code}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
            Refreshes in {formatSecondsLeft(live.secondsLeft)}
          </p>
          {canManage ? (
            <div className="flex flex-wrap justify-center gap-2">
              {!fullscreen ? (
                <button type="button" className="btn-ghost" onClick={() => setFullscreen(true)}>
                  <Maximize2 size={14} /> Full screen
                </button>
              ) : null}
              <button
                type="button"
                className="btn-ghost"
                onClick={onPrint}
                disabled={!qrDataUrl}
              >
                <Printer size={14} /> Print code
              </button>
              {!fullscreen ? (
                <button type="button" className="btn-ghost" onClick={close}>
                  Close session
                </button>
              ) : null}
            </div>
          ) : null}
          {!fullscreen ? (
            <p className="max-w-md text-center text-xs text-[var(--muted)]">
              Full screen for a projector or hallway display. Print for a paper sheet that stays
              valid until this code rotates.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )

  return panel
}
