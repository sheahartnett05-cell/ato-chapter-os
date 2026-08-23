import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Star,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Card, CardHeader } from '../components/ui/Card'
import {
  StatusPill,
  rsvpVariant,
  attendanceVariant,
} from '../components/ui/StatusPill'
import { getEvent, getMember, rsvps, attendance, events } from '../data/mockData'

export default function EventPage() {
  const { id } = useParams<{ id: string }>()
  const event = getEvent(id ?? '')
  const [activeSection, setActiveSection] = useState<'rsvp' | 'attendance' | 'points'>('rsvp')

  if (!event) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-navy">Event not found</p>
      </div>
    )
  }

  const eventRsvps = rsvps[event.id] ?? []
  const eventAttendance = attendance[event.id] ?? []

  const goingCount = eventRsvps.filter((r) => r.status === 'Going').length
  const maybeCount = eventRsvps.filter((r) => r.status === 'Maybe').length

  return (
    <>
      <TopBar
        title={event.name}
        subtitle={`${event.type} · ${new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
        actions={
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-slate-600 hover:bg-surface"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
        }
      />

      <div className="p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Event details */}
          <Card className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill label={event.type} variant="gold" />
              {event.required && <StatusPill label="Required" variant="high" />}
              {event.rsvpRequired && <StatusPill label="RSVP Required" variant="active" />}
              {event.guestAllowed && <StatusPill label="Guests Allowed" variant="default" />}
            </div>
            <p className="mt-4 text-slate-600 leading-relaxed">{event.description}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg bg-surface p-3">
                <Clock size={18} className="text-gold" />
                <div>
                  <p className="text-xs text-slate-500">Time</p>
                  <p className="text-sm font-medium text-navy">{event.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-surface p-3">
                <MapPin size={18} className="text-gold" />
                <div>
                  <p className="text-xs text-slate-500">Location</p>
                  <p className="text-sm font-medium text-navy">{event.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-surface p-3">
                <Star size={18} className="text-gold" />
                <div>
                  <p className="text-xs text-slate-500">Points</p>
                  <p className="text-sm font-medium text-navy">{event.points} points</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-surface p-3">
                <Users size={18} className="text-gold" />
                <div>
                  <p className="text-xs text-slate-500">Dress Code</p>
                  <p className="text-sm font-medium text-navy">{event.dressCode}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader title="RSVP Summary" />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Going</span>
                  <span className="font-bold text-emerald-600">{goingCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Maybe</span>
                  <span className="font-bold text-amber-600">{maybeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Not Going</span>
                  <span className="font-bold text-slate-600">
                    {eventRsvps.filter((r) => r.status === 'Not Going').length}
                  </span>
                </div>
              </div>
            </Card>
            {event.name.includes('Formal') ? (
              <Link
                to="/tables/t1"
                className="block rounded-xl border border-gold/30 bg-gold/5 p-4 text-center transition hover:bg-gold/10"
              >
                <p className="text-sm font-semibold text-gold-dark">View Fall Formal Table</p>
                <p className="mt-1 text-xs text-slate-500">RSVPs, guests & seating</p>
              </Link>
            ) : null}
          </div>
        </div>

        {/* Section tabs */}
        <div className="mt-8 flex gap-1 border-b border-border">
          {(['rsvp', 'attendance', 'points'] as const).map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={`border-b-2 px-4 py-2.5 text-sm font-medium capitalize transition ${
                activeSection === section
                  ? 'border-gold text-gold-dark'
                  : 'border-transparent text-slate-500 hover:text-navy'
              }`}
            >
              {section}
            </button>
          ))}
        </div>

        <Card className="mt-4" padding={false}>
          {activeSection === 'rsvp' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-left text-xs font-medium uppercase text-slate-500">
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Guest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {eventRsvps.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-slate-500">
                      No RSVPs yet
                    </td>
                  </tr>
                ) : (
                  eventRsvps.map((rsvp) => {
                    const member = getMember(rsvp.memberId)
                    if (!member) return null
                    return (
                      <tr
                        key={rsvp.memberId}
                        className="hover:bg-surface/50"
                      >
                        <td className="px-5 py-3">
                          <Link
                            to={`/members/${member.id}`}
                            className="flex items-center gap-3 font-medium text-navy hover:text-gold-dark"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                              {member.avatar}
                            </div>
                            {member.firstName} {member.lastName}
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          <StatusPill label={rsvp.status} variant={rsvpVariant(rsvp.status)} />
                        </td>
                        <td className="px-5 py-3 text-slate-600">{rsvp.guest ?? '—'}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}

          {activeSection === 'attendance' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-left text-xs font-medium uppercase text-slate-500">
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Check-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {eventAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-slate-500">
                      Attendance not recorded yet — event hasn't occurred
                    </td>
                  </tr>
                ) : (
                  eventAttendance.map((entry) => {
                    const member = getMember(entry.memberId)
                    if (!member) return null
                    return (
                      <tr key={entry.memberId}>
                        <td className="px-5 py-3">
                          <Link
                            to={`/members/${member.id}`}
                            className="font-medium text-navy hover:text-gold-dark"
                          >
                            {member.firstName} {member.lastName}
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          <StatusPill
                            label={entry.status}
                            variant={attendanceVariant(entry.status)}
                          />
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {entry.status === 'Present' && (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 size={14} /> Checked in
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}

          {activeSection === 'points' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-left text-xs font-medium uppercase text-slate-500">
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Points Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {eventAttendance.length > 0
                  ? eventAttendance.map((entry) => {
                      const member = getMember(entry.memberId)
                      if (!member) return null
                      return (
                        <tr key={entry.memberId}>
                          <td className="px-5 py-3 font-medium text-navy">
                            {member.firstName} {member.lastName}
                          </td>
                          <td className="px-5 py-3 text-slate-600">{entry.status}</td>
                          <td className="px-5 py-3 font-medium text-gold">+{entry.pointsEarned}</td>
                        </tr>
                      )
                    })
                  : eventRsvps.map((entry) => {
                      const member = getMember(entry.memberId)
                      if (!member) return null
                      const pts = entry.status === 'Going' ? event.points : 0
                      return (
                        <tr key={entry.memberId}>
                          <td className="px-5 py-3 font-medium text-navy">
                            {member.firstName} {member.lastName}
                          </td>
                          <td className="px-5 py-3 text-slate-600">{entry.status}</td>
                          <td className="px-5 py-3 font-medium text-gold">+{pts}</td>
                        </tr>
                      )
                    })}
              </tbody>
            </table>
          )}
        </Card>

        {/* Mini calendar */}
        <Card className="mt-6">
          <CardHeader title="Event Calendar" subtitle="Click an event to view details" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <Link
                key={e.id}
                to={`/events/${e.id}`}
                className={`flex items-center gap-3 rounded-lg border p-3 transition ${
                  e.id === event.id
                    ? 'border-gold bg-gold/5'
                    : 'border-border hover:border-navy/20'
                }`}
              >
                <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-navy text-white">
                  <span className="text-[10px] uppercase">
                    {new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-sm font-bold">
                    {new Date(e.date + 'T12:00:00').getDate()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy">{e.name}</p>
                  <p className="text-xs text-slate-500">{e.time}</p>
                </div>
                <Calendar size={14} className="ml-auto shrink-0 text-slate-400" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
