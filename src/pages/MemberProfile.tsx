import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Calendar, Shirt } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Card, CardHeader } from '../components/ui/Card'
import {
  StatusPill,
  duesVariant,
  memberStatusVariant,
  attendanceVariant,
} from '../components/ui/StatusPill'
import { useMembers } from '../context/MembersContext'
import { useChapter } from '../context/ChapterContext'
import { useChapterOps } from '../context/ChapterOpsContext'
import { localTodayIso } from '../lib/liveAlerts'

const tabs = ['Overview', 'Attendance', 'Dues', 'Events', 'Points'] as const
type Tab = (typeof tabs)[number]

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>()
  const { getMemberById } = useMembers()
  const { events, duesPayments, duesCharges, getEventAttendance } = useChapterOps()
  const member = getMemberById(id ?? '')
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const { languagePack } = useChapter()

  const attendanceRows = useMemo(() => {
    if (!member) return []
    const rows: Array<{
      eventId: string
      event: string
      date: string
      status: string
      pts: number
    }> = []
    for (const ev of events) {
      const entry = getEventAttendance(ev.id).find((a) => a.memberId === member.id)
      if (entry) {
        rows.push({
          eventId: ev.id,
          event: ev.name,
          date: ev.date,
          status: entry.status,
          pts: entry.pointsEarned,
        })
      }
    }
    return rows.sort((a, b) => b.date.localeCompare(a.date))
  }, [events, getEventAttendance, member])

  const totalPoints = useMemo(
    () => attendanceRows.reduce((sum, row) => sum + row.pts, 0),
    [attendanceRows]
  )

  const paymentHistory = useMemo(() => {
    if (!member) return []
    return duesPayments
      .filter((p) => p.memberId === member.id && p.amountPaid > 0)
      .map((p) => ({
        ...p,
        chargeLabel: duesCharges.find((c) => c.id === p.chargeId)?.label ?? 'Dues',
      }))
      .sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? ''))
  }, [duesPayments, duesCharges, member])

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
    .filter((e) => e.date >= localTodayIso())
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
                  <Calendar size={14} />
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
            <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-3 sm:gap-6">
              <div>
                <p className="text-2xl font-bold text-navy">{member.attendancePct}%</p>
                <p className="text-xs text-slate-500">Attendance</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{totalPoints}</p>
                <p className="text-xs text-slate-500">Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">${member.duesPaid}</p>
                <p className="text-xs text-slate-500">Dues Paid</p>
              </div>
            </div>
          </div>
        </Card>

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
            {attendanceRows.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                No attendance recorded yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
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
                  {attendanceRows.map((row) => (
                    <tr key={row.eventId}>
                      <td className="px-5 py-3 font-medium text-navy">
                        <Link to={`/events/${row.eventId}`} className="hover:underline">
                          {row.event}
                        </Link>
                      </td>
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
              </div>
            )}
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
                {paymentHistory.length === 0 ? (
                  <li className="text-slate-500">No payments recorded</li>
                ) : (
                  paymentHistory.map((p) => (
                    <li key={p.id} className="flex justify-between rounded-lg bg-surface p-3">
                      <span>
                        {p.paidAt
                          ? new Date(p.paidAt + 'T12:00:00').toLocaleDateString()
                          : '—'}{' '}
                        — {p.chargeLabel}
                        {p.method ? ` · ${p.method}` : ''}
                      </span>
                      <span className="font-medium text-emerald-600">${p.amountPaid}</span>
                    </li>
                  ))
                )}
              </ul>
            </Card>
          </div>
        )}

        {activeTab === 'Events' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {memberEvents.length === 0 ? (
              <p className="text-sm text-slate-500">No upcoming events.</p>
            ) : (
              memberEvents.map((event) => (
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
              ))
            )}
          </div>
        )}

        {activeTab === 'Points' && (
          <Card padding={false}>
            <div className="border-b border-border px-5 py-4">
              <p className="text-lg font-bold text-navy">Total: {totalPoints} points</p>
            </div>
            {attendanceRows.filter((r) => r.pts > 0).length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">No points earned yet.</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface/50 text-left text-xs font-medium uppercase text-slate-500">
                    <th className="px-5 py-3">Event</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attendanceRows
                    .filter((r) => r.pts > 0)
                    .map((row) => (
                      <tr key={row.eventId}>
                        <td className="px-5 py-3 font-medium text-navy">{row.event}</td>
                        <td className="px-5 py-3 text-slate-600">
                          {new Date(row.date + 'T12:00:00').toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3 font-medium text-gold">+{row.pts}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </>
  )
}
