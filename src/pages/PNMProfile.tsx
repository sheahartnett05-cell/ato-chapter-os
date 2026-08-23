import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Phone,
  Mail,
  AtSign,
  MapPin,
  Calendar,
  Star,
  MessageSquare,
  Plus,
} from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Card, CardHeader } from '../components/ui/Card'
import { StatusPill } from '../components/ui/StatusPill'
import { Modal } from '../components/ui/Modal'
import { getProspect, pnmActivities } from '../data/mockData'

export default function PNMProfile() {
  const { id } = useParams<{ id: string }>()
  const prospect = getProspect(id ?? '')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [notes, setNotes] = useState(prospect?.notes ?? '')

  if (!prospect) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Link to="/recruitment/pipeline" className="text-gold hover:underline">
          Back to pipeline
        </Link>
      </div>
    )
  }

  const activities = pnmActivities[prospect.id] ?? [
    {
      id: 'default',
      date: prospect.lastContact || '2025-08-01',
      type: 'Note',
      description: prospect.notes,
      author: prospect.assignedBrother,
    },
  ]

  const activityIcons: Record<string, string> = {
    Call: '📞',
    Text: '💬',
    Event: '📅',
    Meeting: '🤝',
    Referral: '👤',
    Note: '📝',
  }

  return (
    <>
      <TopBar
        title={`${prospect.firstName} ${prospect.lastName}`}
        subtitle="Potential New Member Profile"
        actions={
          <Link
            to="/recruitment/pipeline"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-slate-600 hover:bg-surface"
          >
            <ArrowLeft size={16} />
            Pipeline
          </Link>
        }
      />

      <div className="p-8">
        {/* Hero header — most polished screen */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-light to-navy-muted text-white shadow-xl">
          <div className="p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gold text-2xl font-bold text-navy shadow-lg">
                  {prospect.avatar}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-3xl font-bold">
                      {prospect.firstName} {prospect.lastName}
                    </h2>
                    <StatusPill label={prospect.status} variant="gold" />
                  </div>
                  <p className="mt-1 text-white/70">
                    {prospect.major} · Class of {prospect.graduationYear}
                  </p>
                  <div className="mt-3 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={i < prospect.rating ? 'fill-gold text-gold' : 'text-white/30'}
                      />
                    ))}
                    <span className="ml-2 text-sm text-white/60">
                      {prospect.rating > 0 ? `${prospect.rating}/5` : 'Unrated'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm lg:min-w-[240px]">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  Next Follow-up
                </p>
                {prospect.nextFollowUp ? (
                  <>
                    <p className="mt-2 text-lg font-bold">
                      {new Date(prospect.nextFollowUp + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="mt-1 text-sm text-white/60">
                      Assigned to {prospect.assignedBrother}
                    </p>
                    <button
                      type="button"
                      className="mt-3 w-full rounded-lg bg-gold py-2 text-sm font-semibold text-navy transition hover:bg-gold-light"
                    >
                      Mark Complete
                    </button>
                  </>
                ) : (
                  <p className="mt-2 text-white/60">No follow-up scheduled</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column — contact & interests */}
          <div className="space-y-6">
            <Card>
              <CardHeader title="Contact Info" />
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3 text-slate-600">
                  <Phone size={16} className="shrink-0 text-gold" />
                  {prospect.phone}
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <Mail size={16} className="shrink-0 text-gold" />
                  {prospect.email}
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <AtSign size={16} className="shrink-0 text-gold" />
                  {prospect.instagram}
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <MapPin size={16} className="shrink-0 text-gold" />
                  {prospect.hometown}
                </li>
              </ul>
            </Card>

            <Card>
              <CardHeader title="Recruitment Info" />
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Main Contact</dt>
                  <dd className="font-medium text-navy">{prospect.assignedBrother}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Source</dt>
                  <dd className="font-medium text-navy">{prospect.source}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Last Contact</dt>
                  <dd className="font-medium text-navy">
                    {prospect.lastContact
                      ? new Date(prospect.lastContact + 'T12:00:00').toLocaleDateString()
                      : 'Never'}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card>
              <CardHeader title="Interests" />
              <div className="flex flex-wrap gap-2">
                {prospect.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full bg-navy/5 px-3 py-1 text-xs font-medium text-navy"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Center — activity timeline */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader
                title="Activity Timeline"
                action={
                  <button
                    type="button"
                    onClick={() => setShowNoteModal(true)}
                    className="flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-dark"
                  >
                    <Plus size={14} /> Add Note
                  </button>
                }
              />
              <div className="relative space-y-0">
                {activities.map((activity, i) => (
                  <div key={activity.id} className="relative flex gap-4 pb-6">
                    {i < activities.length - 1 && (
                      <div className="absolute left-[15px] top-8 h-full w-px bg-border" />
                    )}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-sm">
                      {activityIcons[activity.type] ?? '📌'}
                    </div>
                    <div className="min-w-0 flex-1 rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gold-dark">
                          {activity.type}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar size={12} />
                          {new Date(activity.date + 'T12:00:00').toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{activity.description}</p>
                      <p className="mt-2 text-xs text-slate-400">by {activity.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Notes"
                action={
                  <MessageSquare size={16} className="text-slate-400" />
                }
              />
              <p className="text-sm leading-relaxed text-slate-600">{notes}</p>
            </Card>

            <Card>
              <CardHeader title="Quick Actions" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {['Log Call', 'Send Text', 'Schedule Meet', 'Invite to Event'].map((action) => (
                  <button
                    key={action}
                    type="button"
                    className="rounded-lg border border-border py-3 text-sm font-medium text-navy transition hover:border-gold hover:bg-gold/5"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Modal open={showNoteModal} onClose={() => setShowNoteModal(false)} title="Add Note">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={4}
          placeholder="Add a note about this prospect…"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            if (newNote.trim()) setNotes((prev) => prev + '\n\n' + newNote.trim())
            setNewNote('')
            setShowNoteModal(false)
          }}
          className="mt-3 w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-white"
        >
          Save Note
        </button>
      </Modal>
    </>
  )
}
