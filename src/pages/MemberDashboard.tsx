import { Link } from 'react-router-dom'
import {
  DollarSign,
  CalendarCheck,
  CalendarDays,
  UserPlus,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Logo } from '../components/layout/Logo'
import { Card, CardHeader } from '../components/ui/Card'
import { StatusPill, duesVariant, rsvpVariant } from '../components/ui/StatusPill'
import {
  CURRENT_MEMBER_ID,
  getMember,
  events,
  prospects,
  rsvps,
} from '../data/mockData'

export default function MemberDashboard() {
  const member = getMember(CURRENT_MEMBER_ID)!
  const myEvents = events.filter((e) => rsvps[e.id]?.some((r) => r.memberId === member.id))
  const myProspects = prospects.filter((p) => p.assignedBrother.includes(member.firstName))

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile header */}
      <header className="sticky top-0 z-20 bg-navy px-4 py-4 text-white lg:hidden">
        <Logo compact />
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-sm font-bold text-navy">
            {member.avatar}
          </div>
          <div>
            <p className="text-sm font-semibold">
              Hey, {member.firstName}
            </p>
            <p className="text-xs text-white/60">{member.pledgeClass}</p>
          </div>
        </div>
      </header>

      {/* Desktop sidebar hint */}
      <div className="mx-auto max-w-lg px-4 py-6 lg:max-w-4xl lg:px-8">
        <div className="mb-6 hidden lg:block">
          <Link
            to="/"
            className="text-sm text-gold hover:text-gold-dark"
          >
            ← Back to Executive View
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-navy">My Dashboard</h1>
          <p className="text-slate-500">
            {member.firstName} {member.lastName} · Regular Member View
          </p>
        </div>

        {/* Quick status cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="!p-4">
            <DollarSign size={20} className="text-gold" />
            <p className="mt-2 text-lg font-bold text-navy">
              ${member.duesExpected - member.duesPaid}
            </p>
            <p className="text-xs text-slate-500">Dues remaining</p>
            <StatusPill label={member.duesStatus} variant={duesVariant(member.duesStatus)} />
          </Card>
          <Card className="!p-4">
            <CalendarCheck size={20} className="text-gold" />
            <p className="mt-2 text-lg font-bold text-navy">{member.attendancePct}%</p>
            <p className="text-xs text-slate-500">Attendance</p>
          </Card>
          <Card className="!p-4">
            <CalendarDays size={20} className="text-gold" />
            <p className="mt-2 text-lg font-bold text-navy">{myEvents.length}</p>
            <p className="text-xs text-slate-500">Upcoming events</p>
          </Card>
          <Card className="!p-4">
            <UserPlus size={20} className="text-gold" />
            <p className="mt-2 text-lg font-bold text-navy">{myProspects.length}</p>
            <p className="text-xs text-slate-500">My prospects</p>
          </Card>
        </div>

        {/* My Dues */}
        <Card className="mt-6">
          <CardHeader title="My Dues" subtitle={`$${member.duesPaid} of $${member.duesExpected} paid`} />
          <div className="mb-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-navy to-gold"
              style={{ width: `${(member.duesPaid / member.duesExpected) * 100}%` }}
            />
          </div>
          {member.duesPaid < member.duesExpected && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <AlertCircle size={16} />
              Payment due by September 15, 2025
            </div>
          )}
          {member.duesStatus === 'Paid' && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 size={16} />
              You're all caught up!
            </div>
          )}
          <button
            type="button"
            className="mt-4 w-full rounded-lg bg-gold py-2.5 text-sm font-semibold text-white hover:bg-gold-dark"
          >
            Make Payment
          </button>
        </Card>

        {/* My Attendance */}
        <Card className="mt-6">
          <CardHeader title="My Attendance" subtitle="Recent chapter meetings" />
          <ul className="space-y-2">
            {[
              { event: 'Chapter Meeting — Aug 18', status: 'Present' },
              { event: 'Chapter Meeting — Aug 11', status: 'Present' },
              { event: 'Summer Work Day — Aug 4', status: 'Excused' },
            ].map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
              >
                <span className="text-navy">{item.event}</span>
                <StatusPill
                  label={item.status}
                  variant={item.status === 'Present' ? 'present' : 'excused'}
                />
              </li>
            ))}
          </ul>
        </Card>

        {/* My Events */}
        <Card className="mt-6">
          <CardHeader title="My Events" />
          <ul className="space-y-2">
            {events.slice(0, 4).map((event) => {
              const rsvp = rsvps[event.id]?.find((r) => r.memberId === member.id)
              return (
                <li key={event.id}>
                  <Link
                    to={`/events/${event.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition hover:border-gold/40 hover:bg-gold/5"
                  >
                    <div>
                      <p className="text-sm font-medium text-navy">{event.name}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(event.date + 'T12:00:00').toLocaleDateString()} · {event.time}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {rsvp && (
                        <StatusPill label={rsvp.status} variant={rsvpVariant(rsvp.status)} />
                      )}
                      <ChevronRight size={16} className="text-slate-400" />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>

        {/* My Recruitment */}
        <Card className="mt-6 mb-8">
          <CardHeader
            title="My Recruitment"
            action={
              <Link to="/recruitment/pipeline" className="text-xs font-medium text-gold">
                View pipeline →
              </Link>
            }
          />
          {myProspects.length > 0 ? (
            <ul className="space-y-2">
              {myProspects.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/recruitment/pnm/${p.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition hover:border-gold/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                        {p.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-navy">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{p.major}</p>
                      </div>
                    </div>
                    <StatusPill label={p.status} variant="gold" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No prospects assigned yet.</p>
          )}
          <button
            type="button"
            className="mt-4 w-full rounded-lg border border-gold py-2.5 text-sm font-semibold text-gold-dark hover:bg-gold/5"
          >
            + Add Prospect
          </button>
        </Card>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white lg:hidden">
        <div className="flex justify-around py-2">
          {[
            { label: 'Home', to: '/my-dashboard', active: true },
            { label: 'Calendar', to: '/events/e2', active: false },
            { label: 'Events', to: '/events/e5', active: false },
            { label: 'Recruitment', to: '/recruitment', active: false },
            { label: 'More', to: '/', active: false },
          ].map(({ label, to, active }) => (
            <Link
              key={label}
              to={to}
              className={`flex flex-col items-center px-2 py-1 text-[10px] font-medium ${
                active ? 'text-gold' : 'text-slate-400'
              }`}
            >
              <span className="mb-0.5 h-1 w-1 rounded-full bg-current" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
