import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useMembers } from '../context/MembersContext'
import { useChapter } from '../context/ChapterContext'
import { roleLabel } from '../types/permissions'
import {
  StatusPill,
  duesVariant,
  memberStatusVariant,
  attendanceVariant,
} from '../components/ui/StatusPill'

export default function MyProfile() {
  const { profile, role, onboarding, updateProfile, permissions } = useAuth()
  const { getMemberById, updateMemberProfile } = useMembers()
  const { chapter } = useChapter()
  const member = onboarding?.memberId ? getMemberById(onboarding.memberId) : undefined

  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(profile)

  const save = () => {
    updateProfile(local)
    if (onboarding?.memberId) updateMemberProfile(onboarding.memberId, local)
    setEditing(false)
  }

  const displayName = `${profile.firstName} ${profile.lastName}`.trim() || 'Member'
  const initials = profile.avatar || displayName.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen pb-12" style={{ background: 'var(--surface-tint)' }}>
      <div className="theme-stripe" />
      <header className="theme-sidebar px-5 pb-6 pt-4">
        <div className="flex items-center justify-between">
          <Link
            to={permissions.isMemberView ? '/my-dashboard' : '/home'}
            className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-white/60 hover:text-white"
          >
            <ArrowLeft size={12} /> Back
          </Link>
          <Link to="/settings" className="text-white/60 hover:text-white">
            <Settings size={16} />
          </Link>
        </div>

        <div className="mt-6 flex items-end gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center font-serif text-xl text-white"
            style={{ backgroundColor: chapter.primaryColor }}
          >
            {initials}
          </div>
          <div>
            <h1 className="font-serif text-3xl tracking-tight text-white">{displayName}</h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
              {role ? roleLabel(role) : 'Member'} · {chapter.chapterDesignation}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-5">
        {member && (
          <div className="flex flex-wrap gap-2">
            <StatusPill label={member.status} variant={memberStatusVariant(member.status)} />
            <StatusPill label={member.duesStatus} variant={duesVariant(member.duesStatus)} />
            <StatusPill
              label={`${member.attendancePct}% attendance`}
              variant={attendanceVariant(member.attendancePct >= 80 ? 'Good' : 'Low')}
            />
          </div>
        )}

        <section className="border border-[var(--rule)] bg-[var(--surface-card)] p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Contact
            </p>
            {!editing ? (
              <button
                type="button"
                onClick={() => {
                  setLocal(profile)
                  setEditing(true)
                }}
                className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]"
              >
                Edit
              </button>
            ) : (
              <button type="button" onClick={save} className="btn-primary text-xs py-1.5 px-3">
                Save
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
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
                value={local.phone}
                onChange={(e) => setLocal({ ...local, phone: e.target.value })}
                className="input-editorial"
                placeholder="Phone"
              />
              <input
                type="number"
                value={local.graduationYear}
                onChange={(e) =>
                  setLocal({ ...local, graduationYear: Number(e.target.value) })
                }
                className="input-editorial font-mono"
              />
            </div>
          ) : (
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-[var(--muted)]" />
                {profile.phone || '—'}
              </li>
              {member?.email && (
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-[var(--muted)]" />
                  {member.email}
                </li>
              )}
              <li className="font-mono text-xs text-[var(--muted)]">
                Class of {profile.graduationYear}
              </li>
            </ul>
          )}
        </section>

        {member && (
          <section className="border border-[var(--rule)] bg-[var(--surface-card)] p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Chapter record
            </p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[var(--muted)]">Major</dt>
                <dd className="font-medium">{member.major}</dd>
              </div>
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
      </main>
    </div>
  )
}
