import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { EmptyState } from '../components/ui/EmptyState'
import { InviteCodesPanel } from '../components/settings/InviteCodesPanel'
import { useAuth, usePermissions } from '../context/AuthContext'
import { useChapterViewMode } from '../context/ChapterViewModeContext'
import { userIsExecCapable } from '../lib/access/can'
import { useChapter } from '../context/ChapterContext'
import { useChapterFeatures } from '../context/ChapterFeaturesContext'
import { useChapterOps } from '../context/ChapterOpsContext'
import { useGovernance } from '../context/GovernanceContext'
import { useMembers } from '../context/MembersContext'
import { leaveGuestPreview } from '../lib/leaveGuestPreview'
import {
  readNotifyPrefs,
  writeNotifyPrefs,
  type NotifyPrefs,
} from '../lib/notifications/notifyPrefs'
import { notificationPermission } from '../lib/notifications/localPush'
import {
  locationDeniedHelp,
  queryLocationPermission,
  readLocationPrefs,
  requestLocationPermission,
  writeLocationPrefs,
  type LocationPermissionState,
  type LocationPrefs,
} from '../lib/location/locationPrefs'
import { PwaInstallButton } from '../components/pwa/PwaInstallButton'
import { ONBOARDING_ROLES, roleLabel, type UserProfile } from '../types/permissions'

type SettingsTab = 'account' | 'position' | 'invites'

function TabPills({
  active,
  onChange,
  showPosition,
  showInvites,
}: {
  active: SettingsTab
  onChange: (t: SettingsTab) => void
  showPosition: boolean
  showInvites: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        onClick={() => onChange('account')}
        className={`rounded-sm px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
          active === 'account' ? 'theme-pill-active' : 'theme-pill-muted'
        }`}
      >
        Account
      </button>
      {showPosition && (
        <button
          type="button"
          onClick={() => onChange('position')}
          className={`rounded-sm px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
            active === 'position' ? 'theme-pill-active' : 'theme-pill-muted'
          }`}
        >
          Position
        </button>
      )}
      {showInvites && (
        <button
          type="button"
          onClick={() => onChange('invites')}
          className={`rounded-sm px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
            active === 'invites' ? 'theme-pill-active' : 'theme-pill-muted'
          }`}
        >
          Invites
        </button>
      )}
    </div>
  )
}

function OfficerPositionsEntry() {
  const permissions = usePermissions()
  if (permissions.isMemberView && !permissions.canAccessAdminSettings) return null

  return (
    <details className="group rounded-xl border border-[var(--rule)] bg-[var(--surface-card)]">
      <summary className="cursor-pointer list-none px-4 py-3 font-serif text-lg tracking-tight text-[var(--ink)] marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-2">
          Officer positions
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] group-open:hidden">
            Show
          </span>
        </span>
      </summary>
      <div className="space-y-3 border-t border-[var(--rule)] px-4 py-3">
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          Assign seats, edit titles, and map officers to dashboard functions.
        </p>
        {permissions.canAccessAdminSettings ? (
          <Link
            to="/chapter-setup#officer-positions"
            className="btn-primary inline-block text-xs"
          >
            Manage officer positions
          </Link>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Contact your chapter president to update officer seats.
          </p>
        )}
      </div>
    </details>
  )
}

function AppViewModeCard() {
  const { role } = useAuth()
  const permissions = usePermissions()
  const { viewMode, setViewMode } = useChapterViewMode()
  if (!userIsExecCapable(role, permissions)) return null

  return (
    <section className="rounded-sm border border-[var(--rule)] bg-[var(--surface-card)] px-4 py-4">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        App experience
      </p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Chapter Room — the member layout with bottom tabs. Officer Home — the officer sidebar and
        tools.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setViewMode('chapter-room')}
          className={`rounded-sm px-3 py-2 font-mono text-[11px] uppercase tracking-wider ${
            viewMode === 'chapter-room' ? 'theme-pill-active' : 'theme-pill-muted'
          }`}
        >
          Chapter Room
        </button>
        <button
          type="button"
          onClick={() => setViewMode('operations')}
          className={`rounded-sm px-3 py-2 font-mono text-[11px] uppercase tracking-wider ${
            viewMode === 'operations' ? 'theme-pill-active' : 'theme-pill-muted'
          }`}
        >
          Officer Home
        </button>
      </div>
    </section>
  )
}

function AccountSettings({
  profile,
  onSave,
  cloudEmail,
  onSignOut,
  showCloud,
  isGuest,
  memberId,
}: {
  profile: UserProfile
  onSave: (p: Partial<UserProfile>) => void
  cloudEmail?: string | null
  onSignOut?: () => void
  showCloud?: boolean
  isGuest?: boolean
  memberId?: string | null
}) {
  const [local, setLocal] = useState(profile)
  const [notifyPrefs, setNotifyPrefs] = useState<NotifyPrefs>(() => readNotifyPrefs())
  const [locationPrefs, setLocationPrefs] = useState<LocationPrefs>(() => readLocationPrefs())
  const [locationPerm, setLocationPerm] = useState<LocationPermissionState>('prompt')
  const [locationBusy, setLocationBusy] = useState(false)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)
  const { duesPayments, duesCharges } = useChapterOps()

  useEffect(() => {
    writeNotifyPrefs(notifyPrefs)
  }, [notifyPrefs])

  useEffect(() => {
    writeLocationPrefs(locationPrefs)
  }, [locationPrefs])

  useEffect(() => {
    void queryLocationPermission().then(setLocationPerm)
  }, [])

  const receipts = useMemo(() => {
    if (!memberId) return []
    return duesPayments
      .filter((p) => p.memberId === memberId && p.amountPaid > 0)
      .map((p) => ({
        id: p.id,
        label: duesCharges.find((c) => c.id === p.chargeId)?.label ?? 'Dues',
        amount: p.amountPaid,
        date: p.paidAt
          ? new Date(p.paidAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : '—',
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [duesPayments, duesCharges, memberId])

  const setNotify = async (key: keyof NotifyPrefs, value: boolean) => {
    if (key === 'push' && value) {
      const { ensurePushEnabled } = await import('../lib/notifications/localPush')
      const ok = await ensurePushEnabled()
      setNotifyPrefs(readNotifyPrefs())
      if (!ok) return
      return
    }
    setNotifyPrefs((prev) => ({ ...prev, [key]: value }))
  }

  const setLocationEnabled = async (value: boolean) => {
    setLocationMessage(null)
    if (!value) {
      setLocationPrefs({ enabled: false })
      return
    }
    setLocationBusy(true)
    const perm = await requestLocationPermission()
    setLocationPerm(perm)
    setLocationBusy(false)
    if (perm === 'granted') {
      setLocationPrefs({ enabled: true })
      setLocationMessage('Location allowed — study-hour check-in can use GPS.')
      return
    }
    if (perm === 'denied') {
      setLocationPrefs({ enabled: false })
      setLocationMessage(locationDeniedHelp())
      return
    }
    if (perm === 'unsupported') {
      setLocationPrefs({ enabled: false })
      setLocationMessage('This device or browser does not support location.')
      return
    }
    // prompt / inconclusive — keep preference on so the next GPS action can retry
    setLocationPrefs({ enabled: true })
    setLocationMessage('Allow location when your phone asks, then try again if needed.')
  }

  return (
    <div className="mx-auto max-w-xl space-y-10">
      <AppViewModeCard />
      <OfficerPositionsEntry />
      <div>
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          Profile
        </p>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
                First name
              </span>
              <input
                value={local.firstName}
                onChange={(e) => setLocal({ ...local, firstName: e.target.value })}
                placeholder="First"
                className="input-editorial w-full"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
                Last name
              </span>
              <input
                value={local.lastName}
                onChange={(e) => setLocal({ ...local, lastName: e.target.value })}
                placeholder="Last"
                className="input-editorial w-full"
              />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
              Phone
            </span>
            <input
              value={local.phone}
              onChange={(e) => setLocal({ ...local, phone: e.target.value })}
              placeholder="Phone"
              className="input-editorial w-full"
            />
          </label>
          <button
            type="button"
            onClick={() => onSave(local)}
            className="btn-primary"
          >
            Save profile
          </button>
        </div>
      </div>

      {isGuest ? (
        <div>
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
            Guest preview
          </p>
          <div className="space-y-3 rounded-md border border-[var(--rule)] px-4 py-4">
            <p className="text-sm text-[var(--ink)]">
              Local demo — data stays in this browser until you exit.
            </p>
            <p className="text-xs text-[var(--muted)]">
              Starting a real chapter or signing in will set the demo aside.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => leaveGuestPreview('/login')}
                className="btn-primary text-xs"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => leaveGuestPreview('/onboarding?intent=create')}
                className="btn-ghost text-xs"
              >
                Create chapter
              </button>
              <Link to="/demo" className="btn-ghost text-xs">
                Change demo role
              </Link>
            </div>
          </div>
        </div>
      ) : showCloud ? (
        <div>
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
            Cloud account
          </p>
          <div className="space-y-3 rounded-md border border-[var(--rule)] px-4 py-4">
            {cloudEmail ? (
              <>
                <p className="text-sm text-[var(--ink)]">
                  Signed in as <span className="font-medium">{cloudEmail}</span>
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Chapter data syncs when you&apos;re signed in. One chapter per account — leave
                  this chapter (Profile) before joining or creating another.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/my-profile" className="btn-primary text-xs">
                    Open my profile
                  </Link>
                  {onSignOut && (
                    <button type="button" onClick={onSignOut} className="btn-secondary text-xs">
                      Sign out
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--ink)]">
                  Not signed in — this chapter is saved only in this browser.
                </p>
                <Link to="/login" className="btn-primary inline-block text-xs">
                  Sign in to my profile
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          Install app
        </p>
        <p className="mb-3 text-xs text-[var(--muted)]">
          Install Chaptera as a PWA for a full-screen mobile home-screen experience.
        </p>
        <PwaInstallButton />
      </div>

      <div>
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          Notifications
        </p>
        <p className="mb-3 text-xs text-[var(--muted)]">
          Push alerts use this phone&apos;s notification permission (install Chaptera / Add to Home
          Screen on iPhone for best results). Turning On asks Apple or Google for permission. Alerts
          fire while the app or PWA can run — not closed-app server push yet. Email prefs are saved
          only.
          {notificationPermission() === 'denied'
            ? ' Permission is blocked — enable notifications for Chaptera in phone Settings.'
            : ''}
        </p>
        <ul className="divide-y divide-[var(--rule)] border border-[var(--rule)]">
          {(
            [
              { key: 'email' as const, label: 'Email' },
              { key: 'push' as const, label: 'Push' },
            ] as const
          ).map(({ key, label }) => {
            const checked = notifyPrefs[key]
            return (
              <li key={key} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <span className="text-sm font-medium text-[var(--ink)]">{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  aria-label={`${label} notifications`}
                  onClick={() => void setNotify(key, !checked)}
                  className={`min-h-11 min-w-[3.25rem] rounded-sm px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider ${
                    checked ? 'theme-pill-active' : 'theme-pill-muted'
                  }`}
                >
                  {checked ? 'On' : 'Off'}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          Location services
        </p>
        <p className="mb-3 text-xs text-[var(--muted)]">
          Used for library / study-hour GPS check-in. Turning On asks your phone (Apple or Google)
          for location permission. Chaptera cannot open system Settings for you — if blocked, use
          the device path below.
          {locationPerm === 'denied'
            ? ` Currently blocked. ${locationDeniedHelp()}`
            : locationPerm === 'granted'
              ? ' Phone permission is granted.'
              : ''}
        </p>
        <ul className="divide-y divide-[var(--rule)] border border-[var(--rule)]">
          <li className="flex items-center justify-between gap-4 px-4 py-3.5">
            <span className="text-sm font-medium text-[var(--ink)]">Location</span>
            <button
              type="button"
              role="switch"
              aria-checked={locationPrefs.enabled}
              aria-label="Location services"
              disabled={locationBusy}
              onClick={() => void setLocationEnabled(!locationPrefs.enabled)}
              className={`min-h-11 min-w-[3.25rem] rounded-sm px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider disabled:opacity-50 ${
                locationPrefs.enabled ? 'theme-pill-active' : 'theme-pill-muted'
              }`}
            >
              {locationBusy ? '…' : locationPrefs.enabled ? 'On' : 'Off'}
            </button>
          </li>
        </ul>
        {locationMessage ? (
          <p className="mt-2 text-xs text-[var(--muted)]">{locationMessage}</p>
        ) : null}
      </div>

      <div>
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          Dues receipts
          {isGuest ? (
            <span className="ml-2 font-normal normal-case tracking-normal text-[var(--muted)]">
              (sample)
            </span>
          ) : null}
        </p>
        {receipts.length === 0 ? (
          <EmptyState compact title="No payments recorded yet" />
        ) : (
          <ul className="divide-y divide-[var(--rule)] border border-[var(--rule)]">
            {receipts.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm"
              >
                <span className="min-w-0">
                  <span className="text-[var(--muted)]">{r.date}</span>
                  <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">
                    {r.label}
                    {isGuest ? ' · sample' : ''}
                  </span>
                </span>
                <span className="font-semibold tabular-nums text-[var(--ink)]">
                  ${r.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function TreasurerPanel() {
  const { fineSchedule, updateFineSchedule } = useGovernance()
  const [rules, setRules] = useState(fineSchedule)

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-semibold uppercase text-neutral-400">Fine schedule</p>
      <ul className="space-y-1.5">
        {rules.map((r, i) => (
          <li key={r.id} className="flex items-center gap-3 rounded-xl px-3 py-2 theme-pill-muted">
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.label}</span>
            <input
              type="number"
              value={r.amount}
              onChange={(e) => {
                const next = [...rules]
                next[i] = { ...r, amount: Number(e.target.value) }
                setRules(next)
              }}
              className="w-14 rounded-lg border border-black/5 bg-white px-2 py-1 text-sm text-right"
            />
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => updateFineSchedule(rules)}
        className="theme-pill-active rounded-sm px-4 py-2 text-xs font-semibold"
      >
        Save schedule
      </button>

      <p className="pt-2 text-[10px] font-semibold uppercase text-neutral-400">Payment gateway</p>
      <div className="rounded-xl px-3 py-2.5 text-sm theme-pill-muted">Stripe · Connected</div>

      <p className="text-[10px] font-semibold uppercase text-neutral-400">Dues</p>
      <div className="flex items-center justify-between rounded-xl px-3 py-2.5 theme-pill-muted">
        <span className="text-sm">Semester total</span>
        <input
          type="number"
          defaultValue={850}
          className="w-20 rounded-lg border border-black/5 bg-white px-2 py-1 text-sm text-right"
        />
      </div>
    </div>
  )
}

function JBoardPanel() {
  const { config, updateConfig } = useGovernance()
  const { members } = useMembers()
  const [localConfig, setLocalConfig] = useState(config)

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-semibold uppercase text-neutral-400">
        Standards committee
      </p>
      <select
        value={localConfig.standardsChairId}
        onChange={(e) =>
          setLocalConfig({
            ...localConfig,
            standardsChairId: e.target.value,
            jBoardChairId: e.target.value,
          })
        }
        className="w-full rounded-xl border border-black/5 bg-white px-3 py-2 text-sm"
      >
        {members.filter((m) => m.isExec).map((m) => (
          <option key={m.id} value={m.id}>
            {m.firstName} {m.lastName}
          </option>
        ))}
      </select>

      <p className="text-[10px] font-semibold uppercase text-neutral-400">Strike policy</p>
      <ul className="space-y-1 text-sm">
        {['1st — Warning', '2nd — $25 fine', '3rd — Standards hearing'].map((line) => (
          <li key={line} className="rounded-xl px-3 py-2 theme-pill-muted">
            {line}
          </li>
        ))}
      </ul>

      <Link to="/standards" className="text-xs font-semibold text-[var(--accent)]">
        Open Standards & Accountability →
      </Link>
      <Link to="/standards/setup" className="block text-xs font-semibold text-[var(--ink)]">
        Configure module wizard →
      </Link>

      <button
        type="button"
        onClick={() => updateConfig(localConfig)}
        className="theme-pill-active rounded-sm px-4 py-2 text-xs font-semibold"
      >
        Save
      </button>
    </div>
  )
}

function ChapterPoliciesPanel() {
  const {
    isFeatureEnabled,
    announcementsOfficersOnly,
    setAnnouncementsOfficersOnly,
  } = useChapterFeatures()

  return (
    <section className="rounded-xl border border-black/5 bg-neutral-50 px-4 py-4">
      <p className="text-[10px] font-semibold uppercase text-neutral-400">Chapter policies</p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-neutral-900">Officers-only announcements</p>
          <p className="mt-1 text-xs text-neutral-500">
            Restrict posting to officers and assigned editors. Members can still read the feed when
            this is off.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={announcementsOfficersOnly}
          disabled={!isFeatureEnabled('announcements')}
          onClick={() => setAnnouncementsOfficersOnly(!announcementsOfficersOnly)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-40 ${
            announcementsOfficersOnly ? 'bg-accent' : 'bg-neutral-200'
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
              announcementsOfficersOnly ? 'left-5' : 'left-0.5'
            }`}
          />
        </button>
      </div>
      <Link to="/chapter-setup" className="mt-3 inline-block text-xs font-semibold text-[var(--accent)]">
        More chapter setup →
      </Link>
    </section>
  )
}

function AdminPanel() {
  const navigate = useNavigate()
  const { resetOnboarding } = useAuth()
  const { chapter } = useChapter()
  const [wiping, setWiping] = useState(false)

  const rerunOnboarding = () => {
    resetOnboarding()
    // Full reload so MembersContext chapterLock / invites reset with storage
    window.location.assign('/onboarding')
  }

  const wipeEverything = async () => {
    if (
      !window.confirm(
        'Wipe this browser’s chapter data and leave cloud test memberships? You will start onboarding again.'
      )
    ) {
      return
    }
    setWiping(true)
    try {
      const { wipeLocalAndLeaveCloudChapters } = await import('../lib/chapterCloud')
      await wipeLocalAndLeaveCloudChapters()
      resetOnboarding()
      window.location.assign('/onboarding')
    } finally {
      setWiping(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase text-neutral-400">
          Chapter administration
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/chapter-setup"
            className="theme-pill-active rounded-sm px-4 py-2 text-xs font-semibold"
          >
            Assign positions, features & editors
          </Link>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="theme-pill-muted rounded-sm px-4 py-2 text-xs font-semibold"
          >
            Invites & account
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Edit chapter name, toggle features, seat officers, and choose who can edit each area.
        </p>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase text-neutral-400">Onboarding</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={rerunOnboarding}
            className="theme-pill-muted rounded-sm px-4 py-2 text-xs font-semibold"
          >
            Re-run setup wizard
          </button>
          <button
            type="button"
            disabled={wiping}
            onClick={() => void wipeEverything()}
            className="rounded-sm border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-800"
          >
            {wiping ? 'Wiping…' : 'Wipe test chapter data'}
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase text-neutral-400">Role matrix</p>
        <ul className="space-y-1 text-xs">
          {ONBOARDING_ROLES.map((r) => (
            <li key={r.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 theme-pill-muted">
              <span className="h-1.5 w-1.5 rounded-sm bg-[var(--accent)]" />
              {r.label}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase text-neutral-400">Chapter branding</p>
        <div className="flex gap-1">
          {[chapter.primaryColor, chapter.accentColor, chapter.secondaryColor].map((c) => (
            <span key={c} className="h-6 flex-1 rounded-lg ring-1 ring-black/5" style={{ backgroundColor: c }} />
          ))}
        </div>
        <p className="mt-2 text-[10px] text-neutral-400">
          Brand colors follow the national org selected at onboarding
        </p>
      </div>
    </div>
  )
}

function PositionDashboard() {
  const { role, permissions } = useAuth()

  if (!role || permissions.isMemberView) {
    return (
      <p className="text-sm text-neutral-500">No position tools for your role.</p>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm font-semibold text-neutral-900">{roleLabel(role)} tools</p>

      {permissions.canAccessAdminSettings && (
        <section className="rounded-xl border border-black/5 bg-neutral-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase text-neutral-400">President</p>
          <p className="mt-1 text-sm text-neutral-600">
            Assign officers, edit chapter profile, and manage who can access each tool.
          </p>
          <Link
            to="/chapter-setup"
            className="mt-3 inline-block text-xs font-semibold text-[var(--accent)]"
          >
            Open Chapter Setup →
          </Link>
        </section>
      )}

      {permissions.canAccessTreasurerSettings && (
        <section>
          {(role === 'President' || role === 'Treasurer') && (
            <>
              <p className="mb-3 text-[10px] font-semibold uppercase text-neutral-400">
                {role === 'Treasurer' ? 'Treasurer' : 'Treasurer · Overview'}
              </p>
              <TreasurerPanel />
            </>
          )}
        </section>
      )}

      {permissions.canAccessJBoardSettings && (
        <section>
          <p className="mb-3 text-[10px] font-semibold uppercase text-neutral-400">
            Standards & Accountability
          </p>
          <JBoardPanel />
        </section>
      )}

      {permissions.canManageRecruitment && role === 'RecruitmentChair' && (
        <section>
          <p className="mb-3 text-[10px] font-semibold uppercase text-neutral-400">Recruitment</p>
          <Link to="/recruitment/pipeline" className="text-xs font-semibold text-[var(--accent)]">
            Open pipeline →
          </Link>
        </section>
      )}

      {permissions.canAccessAdminSettings && (
        <section className="space-y-4">
          <ChapterPoliciesPanel />
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase text-neutral-400">Admin</p>
            <AdminPanel />
          </div>
        </section>
      )}
    </div>
  )
}

export default function Settings() {
  const {
    profile,
    updateProfile,
    role,
    permissions,
    onboarding,
    requiresSupabaseAuth: showCloud,
    authEmail,
    signOut,
  } = useAuth()
  const { updateMemberProfile } = useMembers()
  const location = useLocation()
  const initialTab =
    (location.state as { tab?: SettingsTab } | null)?.tab === 'invites' &&
    permissions.canManageInvites
      ? 'invites'
      : 'account'
  const [tab, setTab] = useState<SettingsTab>(initialTab)
  const hasPositionTab = false
  const hasInvitesTab = permissions.canManageInvites

  const saveProfile = (patch: Partial<UserProfile>) => {
    updateProfile(patch)
    if (onboarding?.memberId) updateMemberProfile(onboarding.memberId, patch)
  }

  return (
    <>
      <TopBar
        title="Settings"
        subtitle={role ? roleLabel(role) : undefined}
        showBrand={false}
      />
      <PageShell>
        {(hasPositionTab || hasInvitesTab) && (
          <div className="mb-8">
            <TabPills
              active={tab}
              onChange={setTab}
              showPosition={hasPositionTab}
              showInvites={hasInvitesTab}
            />
          </div>
        )}
        {tab === 'account' && (
          <AccountSettings
            profile={profile}
            onSave={saveProfile}
            showCloud={showCloud}
            cloudEmail={authEmail}
            isGuest={onboarding?.isGuest === true}
            memberId={onboarding?.memberId ?? null}
            onSignOut={() => {
              void signOut().then(() => window.location.assign('/onboarding'))
            }}
          />
        )}
        {tab === 'position' && hasPositionTab && <PositionDashboard />}
        {tab === 'invites' && hasInvitesTab && <InviteCodesPanel />}
      </PageShell>
    </>
  )
}
