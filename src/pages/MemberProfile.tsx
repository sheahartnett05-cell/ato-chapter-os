import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shirt,
} from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Card, CardHeader } from '../components/ui/Card'
import {
  StatusPill,
  duesVariant,
  memberStatusVariant,
  attendanceVariant,
} from '../components/ui/StatusPill'
import { getMember } from '../data/mockData'
import { useMembers } from '../context/MembersContext'
import { useChapter } from '../context/ChapterContext'
import { useChapterOps } from '../context/ChapterOpsContext'

const tabs = [
  'Overview',
  'Attendance',
  'Dues',
  'Events',
  'Points',
  'Tasks',
  'Forms',
] as const

type Tab = (typeof tabs)[number]

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>()
  const { getMemberById } = useMembers()
  const { events } = useChapterOps()
  const member = getMemberById(id ?? '') ?? getMember(id ?? '')
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const { languagePack } = useChapter()

  if (!member) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-navy">Member not found</p>
          <Link to="/members" className="mt-2 text-sm text-gold hover:underline">
            Back to roster
          </Link>
        </div>
      </div>
    )
  }

  const memberEvents = events
    .filter((e) => e.date >= '2025-08-23')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)

  return (
    <>
      <TopBar
        title={`${member.firstName} ${member.lastName}`}
        subtitle={member.role ?? `${member.major} · Class of ${member.graduationYear}`}
        actions={
          <Link
            to="/members"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-slate-600 hover:bg-surface"
          >
            <ArrowLeft size={16} />
            Back to roster
          </Link>
        }
      />

      <div className="p-8">
        {/* Profile header */}
        <Card className="mb-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-navy text-3xl font-bold text-white">
              {member.avatar}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-navy">
                  {member.firstName} {member.lastName}
                </h2>
                <StatusPill label={member.status} variant={memberStatusVariant(member.status)} />
                {member.isExec && <StatusPill label={member.role ?? 'Officer'} variant="gold" />}
              </div>
              <p className="mt-1 text-slate-500">
                {member.major} · Class of {member.graduationYear} · {member.pledgeClass}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} /> {member.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone size={14} /> {member.phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />{' '}
                  {new Date(member.birthday + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Shirt size={14} /> Size {member.shirtSize}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center sm:gap-6">
              <div>
                <p className="text-2xl font-bold text-navy">{member.attendancePct}%</p>
                <p className="text-xs text-slate-500">Attendance</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{member.points}</p>
                <p className="text-xs text-slate-500">Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">
                  ${member.duesPaid}
                </p>
                <p className="text-xs text-slate-500">Dues Paid</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab
                  ? 'border-gold text-gold-dark'
                  : 'border-transparent text-slate-500 hover:text-navy'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Overview' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Chapter Info" />
              <dl className="space-y-3 text-sm">
                {member.big && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Big {languagePack.memberSingular}</dt>
                    <dd className="font-medium text-navy">{member.big}</dd>
                  </div>
                )}
                {member.little && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Little {languagePack.memberSingular}</dt>
                    <dd className="font-medium text-navy">{member.little}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Committee</dt>
                  <dd className="font-medium text-navy">{member.committee ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">{languagePack.candidateTerm} Class</dt>
                  <dd className="font-medium text-navy">{member.pledgeClass}</dd>
                </div>
              </dl>
            </Card>
            <Card>
              <CardHeader title="Emergency Contact" />
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Name</dt>
                  <dd className="font-medium text-navy">{member.emergencyContact}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="font-medium text-navy">{member.emergencyPhone}</dd>
                </div>
              </dl>
            </Card>
          </div>
        )}

        {activeTab === 'Attendance' && (
          <Card padding={false}>
            <div className="border-b border-border px-5 py-4">
              <p className="text-sm text-slate-500">
                Semester attendance: <strong className="text-navy">{member.attendancePct}%</strong>
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-left text-xs font-medium uppercase text-slate-500">
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { event: 'Weekly Chapter Meeting', date: '2025-08-18', status: 'Present', pts: 5 },
                  { event: 'Weekly Chapter Meeting', date: '2025-08-11', status: 'Present', pts: 5 },
                  { event: 'Summer Work Day', date: '2025-08-04', status: 'Excused', pts: 0 },
                  { event: 'IFC Mandatory Meeting', date: '2025-07-28', status: 'Absent', pts: 0 },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 font-medium text-navy">{row.event}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {new Date(row.date + 'T12:00:00').toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill label={row.status} variant={attendanceVariant(row.status)} />
                    </td>
                    <td className="px-5 py-3 text-navy">{row.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {activeTab === 'Dues' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Balance Summary" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status</span>
                  <StatusPill label={member.duesStatus} variant={duesVariant(member.duesStatus)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Expected</span>
                  <span className="font-semibold text-navy">${member.duesExpected}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Paid</span>
                  <span className="font-semibold text-emerald-600">${member.duesPaid}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="font-medium text-navy">Remaining</span>
                  <span className="text-lg font-bold text-red-600">
                    ${member.duesExpected - member.duesPaid}
                  </span>
                </div>
              </div>
            </Card>
            <Card>
              <CardHeader title="Payment History" />
              <ul className="space-y-3 text-sm">
                {member.duesPaid > 0 ? (
                  <>
                    <li className="flex justify-between rounded-lg bg-surface p-3">
                      <span>Aug 1, 2025 — Venmo</span>
                      <span className="font-medium text-emerald-600">
                        ${Math.min(member.duesPaid, 425)}
                      </span>
                    </li>
                    {member.duesPaid > 425 && (
                      <li className="flex justify-between rounded-lg bg-surface p-3">
                        <span>Jul 15, 2025 — Check</span>
                        <span className="font-medium text-emerald-600">
                          ${member.duesPaid - 425}
                        </span>
                      </li>
                    )}
                  </>
                ) : (
                  <li className="text-slate-500">No payments recorded</li>
                )}
              </ul>
            </Card>
          </div>
        )}

        {activeTab === 'Events' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {memberEvents.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="rounded-xl border border-border bg-white p-4 transition hover:border-gold/40 hover:shadow-md"
              >
                <StatusPill label={event.type} variant="gold" />
                <h4 className="mt-2 font-semibold text-navy">{event.name}</h4>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(event.date + 'T12:00:00').toLocaleDateString()} · {event.time}
                </p>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'Points' && (
          <Card padding={false}>
            <div className="border-b border-border px-5 py-4">
              <p className="text-lg font-bold text-navy">Total: {member.points} points</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-left text-xs font-medium uppercase text-slate-500">
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { event: 'Philanthropy Day', date: '2025-08-10', pts: 15 },
                  { event: 'Chapter Meeting', date: '2025-08-18', pts: 5 },
                  { event: 'Brotherhood BBQ', date: '2025-08-05', pts: 10 },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 font-medium text-navy">{row.event}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {new Date(row.date + 'T12:00:00').toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 font-medium text-gold">+{row.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {activeTab === 'Tasks' && (
          <Card>
            <ul className="space-y-3">
              {[
                { task: 'Submit Fall Formal RSVP', due: 'Aug 30', status: 'In Progress' },
                { task: 'Complete risk management quiz', due: 'Sep 5', status: 'Not Started' },
              ].map((t, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium text-navy">{t.task}</p>
                    <p className="text-xs text-slate-500">Due {t.due}</p>
                  </div>
                  <StatusPill label={t.status} variant="medium" />
                </li>
              ))}
            </ul>
          </Card>
        )}

        {activeTab === 'Forms' && (
          <Card>
            <ul className="space-y-3">
              {[
                { form: 'Absence Excuse — Aug 4 Work Day', submitted: 'Aug 3, 2025' },
                { form: 'Fall Formal Guest Registration', submitted: 'Pending' },
              ].map((f, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <p className="font-medium text-navy">{f.form}</p>
                  <span className="text-xs text-slate-500">{f.submitted}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  )
}
