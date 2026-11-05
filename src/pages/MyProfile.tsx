import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useIsMemberShell } from '../hooks/useShellKind'
import { useMembers } from '../context/MembersContext'
import { useChapter } from '../context/ChapterContext'
import { useChapterOps } from '../context/ChapterOpsContext'
import { PhotoUpload } from '../components/ui/PhotoUpload'
import { MemberAvatar } from '../components/ui/MemberAvatar'
import { roleLabel } from '../types/permissions'
import {
  StatusPill,
  duesVariant,
  memberStatusVariant,
  attendanceVariant,
} from '../components/ui/StatusPill'
import { formatAttendancePct, pointsFromEntry } from '../lib/attendance/attendanceMath'

export default function MyProfile() {
  const {
    profile,
    role,
    onboarding,
    updateProfile,
    permissions,
    authEmail,
    emailVerified,
    signOut,
    requiresSupabaseAuth,
    updatePassword,
  } = useAuth()
  const isMemberShell = useIsMemberShell()
  const { getMemberById, updateMemberProfile } = useMembers()
  const { chapter } = useChapter()
  const { events, getEventAttendance } = useChapterOps()
  const member = onboarding?.memberId ? getMemberById(onboarding.memberId) : undefined
  const [leaving, setLeaving] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)

  // Prefer auth profile; fall back to roster row so restore races never show blank.
  const viewProfile = useMemo(
    () => ({
      ...profile,
      firstName: profile.firstName || member?.firstName || '',
      lastName: profile.lastName || member?.lastName || '',
      phone: profile.phone || member?.phone || '',
      email: profile.email || member?.email,
      avatar: profile.avatar || member?.avatar || '',
      photoUrl: profile.photoUrl || member?.photoUrl,
      graduationYear: profile.graduationYear || member?.graduationYear || new Date().getFullYear() + 1,
      major: profile.major || member?.major,
      birthday: profile.birthday || member?.birthday,
      shirtSize: profile.shirtSize || member?.shirtSize,
      emergencyContact: profile.emergencyContact || member?.emergencyContact,
      emergencyPhone: profile.emergencyPhone || member?.emergencyPhone,
    }),
    [profile, member]
  )

  const attendanceRows = useMemo(() => {
    if (!member) return []
    const rows: Array<{ eventId: string; event: string; date: string; status: string; pts: number }> =
      []
    for (const ev of events) {
      const entry = getEventAttendance(ev.id).find((a) => a.memberId === member.id)
      if (entry) {
        rows.push({
          eventId: ev.id,
          event: ev.name,
          date: ev.date,
          status: entry.status,
          pts: pointsFromEntry(entry, ev.points),
        })
      }
    }
    return rows.sort((a, b) => b.date.localeCompare(a.date))
  }, [events, getEventAttendance, member])

  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(viewProfile)

  useEffect(() => {
    if (!editing) setLocal(viewProfile)
  }, [viewProfile, editing])

  const save = () => {
    updateProfile(local)
    if (onboarding?.memberId) updateMemberProfile(onboarding.memberId, local)
    setEditing(false)
  }

  const displayName = `${viewProfile.firstName} ${viewProfile.lastName}`.trim() || 'Member'
  const initials =
    viewProfile.avatar ||
    `${viewProfile.firstName.charAt(0)}${viewProfile.lastName.charAt(0)}`.toUpperCase()

  return (
    <div className="min-h-screen pb-12" style={{ background: 'var(--surface-tint)' }}>
      <div className="theme-stripe" />
      <header className="theme-sidebar px-5 pb-6 pt-4">
        <div className="flex items-center justify-between">
          <Link
            to={isMemberShell ? '/my-dashboard' : '/home'}
            className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-white/60 hover:text-white"
          >
            <ArrowLeft size={12} /> Back
          </Link>
          <Link to="/settings" className="text-white/60 hover:text-white">
            <Settings size={16} />
          </Link>
        </div>

        <div className="mt-6 flex items-end gap-4">
          {editing ? (
            <PhotoUpload
              value={local.photoUrl}
              initials={initials}
              onChange={(url) => setLocal({ ...local, photoUrl: url })}
              size="lg"
              accentColor={chapter.primaryColor}
            />
          ) : (
            <MemberAvatar
              photoUrl={viewProfile.photoUrl}
              initials={initials}
              size="lg"
              accentColor={chapter.primaryColor}
            />
          )}
          <div>
            <h1 className="font-serif text-3xl tracking-tight text-white">{displayName}</h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
              {role ? roleLabel(role) : 'Member'} · {chapter.chapterDesignation}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-5 px-4 py-6">
        {requiresSupabaseAuth ? (
          <section className="border border-[var(--rule)] bg-[var(--surface-card)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Account
            </p>
            {emailVerified && authEmail ? (
              <>
                <p className="mt-2 text-sm text-[var(--ink)]">
                  Signed in as <span className="font-medium">{authEmail}</span>
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  One chapter at a time — {chapter.chapterDesignation || 'this chapter'} on this
                  profile. Sign out on this device, or leave the chapter before joining another.
                </p>
                <div className="mt-4 space-y-2 border-t border-[var(--rule)] pt-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    Password
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Set a password so you can sign in on any phone without waiting for a code.
                  </p>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="input-editorial min-h-11"
                    placeholder="New password (8+ characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="input-editorial min-h-11"
                    placeholder="Confirm password"
                    value={newPassword2}
                    onChange={(e) => setNewPassword2(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-primary min-h-11 w-full text-xs disabled:opacity-40"
                    disabled={
                      passwordBusy ||
                      newPassword.length < 8 ||
                      newPassword !== newPassword2
                    }
                    onClick={() => {
                      setPasswordMsg(null)
                      setPasswordBusy(true)
                      void updatePassword(newPassword).then((res) => {
                        setPasswordBusy(false)
                        if (!res.ok) {
                          setPasswordMsg(res.error ?? 'Could not save password')
                          return
                        }
                        setNewPassword('')
                        setNewPassword2('')
                        setPasswordMsg('Password saved — use it next time on Login.')
                      })
                    }}
                  >
                    {passwordBusy ? 'Saving…' : 'Save password'}
                  </button>
                  {passwordMsg ? (
                    <p className="text-xs text-[var(--muted)]">{passwordMsg}</p>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-ghost min-h-11 text-xs"
                    onClick={() => void signOut().then(() => window.location.assign('/login'))}
                  >
                    Sign out
                  </button>
                  <button
                    type="button"
                    className="btn-ghost min-h-11 text-xs text-red-800"
                    disabled={leaving}
                    onClick={() => {
                      if (
                        !window.confirm(
                          'Leave this chapter? You can join or create another after. Officers who are the last president must transfer first.'
                        )
                      ) {
                        return
                      }
                      setLeaving(true)
                      void import('../lib/chapterCloud')
                        .then(({ wipeLocalAndLeaveCloudChapters }) =>
                          wipeLocalAndLeaveCloudChapters()
                        )
                        .then(() => signOut())
                        .then(() => window.location.assign('/login'))
                        .finally(() => setLeaving(false))
                    }}
                  >
                    {leaving ? 'Leaving…' : 'Leave chapter'}
                  </button>
                  <Link to="/settings" className="btn-ghost min-h-11 text-xs">
                    Notification settings
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-[var(--ink)]">
                  Sign in to restore this profile on any phone.
                </p>
                <Link to="/login" className="btn-primary mt-3 inline-flex min-h-11 items-center text-xs">
                  Sign in to my profile
                </Link>
              </>
            )}
          </section>
        ) : null}

        {member && (
          <div className="flex flex-wrap gap-2">
            <StatusPill label={member.status} variant={memberStatusVariant(member.status)} />
            <StatusPill label={member.duesStatus} variant={duesVariant(member.duesStatus)} />
            <StatusPill
              label={`${formatAttendancePct(member.attendancePct)} attendance`}
              variant={attendanceVariant(
                member.attendancePct == null
                  ? 'Low'
                  : member.attendancePct >= 80
                    ? 'Good'
                    : 'Low'
              )}
            />
          </div>
        )}

        <section className="border border-[var(--rule)] bg-[var(--surface-card)] p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Your profile
            </p>
            {!editing ? (
              <button
                type="button"
                onClick={() => {
                  setLocal(viewProfile)
                  setEditing(true)
                }}
                className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]"
              >
                Edit
              </button>
            ) : (
              <button type="button" onClick={save} className="btn-primary px-3 py-1.5 text-xs">
                Save
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  value={local.firstName}
                  onChange={(e) => setLocal({ ...local, firstName: e.target.value })}
                  className="input-editorial"
                  placeholder="First"
                />
                <input
                  value={local.lastName}
                  onChange={(e) => setLocal({ ...local, lastName: e.target.value })}
                  className="input-editorial"
                  placeholder="Last"
                />
              </div>
              <input
                type="email"
                value={local.email ?? ''}
                onChange={(e) => setLocal({ ...local, email: e.target.value })}
                className="input-editorial"
                placeholder="Email"
              />
              <input
                value={local.phone}
                onChange={(e) => setLocal({ ...local, phone: e.target.value })}
                className="input-editorial"
                placeholder="Phone"
              />
              <input
                value={local.major ?? ''}
                onChange={(e) => setLocal({ ...local, major: e.target.value })}
                className="input-editorial"
                placeholder="Major"
              />
              <input
                type="number"
                value={local.graduationYear}
                onChange={(e) =>
                  setLocal({ ...local, graduationYear: Number(e.target.value) })
                }
                className="input-editorial font-mono"
                placeholder="Grad year"
              />
              <input
                type="date"
                value={local.birthday ?? ''}
                onChange={(e) => setLocal({ ...local, birthday: e.target.value })}
                className="input-editorial"
              />
              <select
                value={local.shirtSize ?? 'M'}
                onChange={(e) => setLocal({ ...local, shirtSize: e.target.value })}
                className="input-editorial w-full"
              >
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                value={local.emergencyContact ?? ''}
                onChange={(e) => setLocal({ ...local, emergencyContact: e.target.value })}
                className="input-editorial"
                placeholder="Emergency contact name"
              />
              <input
                value={local.emergencyPhone ?? ''}
                onChange={(e) => setLocal({ ...local, emergencyPhone: e.target.value })}
                className="input-editorial"
                placeholder="Emergency contact phone"
              />
            </div>
          ) : (
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-[var(--muted)]" />
                {viewProfile.phone || '—'}
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-[var(--muted)]" />
                {viewProfile.email || '—'}
              </li>
              <li>
                <span className="text-[var(--muted)]">Major </span>
                {viewProfile.major || '—'}
              </li>
              <li className="font-mono text-xs text-[var(--muted)]">
                Class of {viewProfile.graduationYear}
              </li>
              {viewProfile.birthday && (
                <li className="text-[var(--muted)]">
                  Birthday {new Date(viewProfile.birthday + 'T12:00:00').toLocaleDateString()}
                </li>
              )}
              {viewProfile.shirtSize && (
                <li className="text-[var(--muted)]">Shirt size {viewProfile.shirtSize}</li>
              )}
              {viewProfile.emergencyContact && (
                <li className="text-[var(--muted)]">
                  Emergency: {viewProfile.emergencyContact}
                  {viewProfile.emergencyPhone ? ` · ${viewProfile.emergencyPhone}` : ''}
                </li>
              )}
            </ul>
          )}
        </section>

        {member && (
          <section className="border border-[var(--rule)] bg-[var(--surface-card)] p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Chapter record
            </p>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--muted)]">Pledge class</dt>
                <dd className="font-medium">{member.pledgeClass}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Points</dt>
                <dd className="font-mono font-medium">{member.points}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Dues paid</dt>
                <dd className="font-mono font-medium">
                  ${member.duesPaid} / ${member.duesExpected}
                </dd>
              </div>
            </dl>
            {permissions.canManageRoster && (
              <Link
                to={`/members/${member.id}`}
                className="mt-4 inline-block font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]"
              >
                Full roster profile →
              </Link>
            )}
          </section>
        )}

        {member && (
          <section className="border border-[var(--rule)] bg-[var(--surface-card)] p-4">
            <div className="mb-3 flex items-end justify-between gap-2">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  Attendance history
                </p>
                <p className="mt-1 font-serif text-2xl tracking-tight text-[var(--ink)]">
                  {formatAttendancePct(member.attendancePct)}
                </p>
              </div>
            </div>
            {attendanceRows.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No meetings recorded yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--rule)]">
                {attendanceRows.slice(0, 12).map((row) => (
                  <li key={row.eventId} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--ink)]">{row.event}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        {new Date(row.date + 'T12:00:00').toLocaleDateString()}
                      </p>
                    </div>
                    <StatusPill
                      label={row.status}
                      variant={
                        row.status === 'Present'
                          ? 'present'
                          : row.status === 'Excused'
                            ? 'maybe'
                            : 'absent'
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
