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
import { MemberAvatar } from '../components/ui/MemberAvatar'
import { PhotoUpload } from '../components/ui/PhotoUpload'
import { StatusPill } from '../components/ui/StatusPill'
import { Modal } from '../components/ui/Modal'
import { useRecruitment } from '../context/RecruitmentContext'
import { useAuth } from '../context/AuthContext'
import { useChapter } from '../context/ChapterContext'

export default function PNMProfile() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const { getProspect, getActivities, updateProspect, appendNote } = useRecruitment()
  const prospect = id ? getProspect(id) : undefined
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [newNote, setNewNote] = useState('')
  const { languagePack } = useChapter()

  if (!prospect) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Link to="/recruitment/pipeline" className="text-accent hover:underline">
          Back to pipeline
        </Link>
      </div>
    )
  }

  const activities =
    getActivities(prospect.id).length > 0
      ? getActivities(prospect.id)
      : [
          {
            id: 'default',
            date: prospect.lastContact || '2025-08-01',
            type: 'Note',
            description: prospect.notes || 'No activity yet',
            author: prospect.assignedBrother || 'Recruitment',
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

  const authorName = `${profile.firstName} ${profile.lastName}`.trim() || 'Officer'

  return (
    <>
      <TopBar
        title={`${prospect.firstName} ${prospect.lastName}`}
        subtitle="Potential New Member Profile"
        actions={
          <Link
            to="/recruitment/pipeline"
            className="flex items-center gap-2 rounded-sm border border-black/5 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            <ArrowLeft size={16} />
            Pipeline
          </Link>
        }
      />

      <div className="p-8">
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 text-white shadow-xl">
          <div className="p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-5">
                <div className="space-y-2">
                  <MemberAvatar
                    photoUrl={prospect.photoUrl}
                    initials={prospect.avatar}
                    size="xl"
                    className="rounded-2xl ring-2 ring-white/20"
                  />
                  <PhotoUpload
                    value={prospect.photoUrl}
                    initials={prospect.avatar}
                    onChange={(url) => updateProspect(prospect.id, { photoUrl: url })}
                    size="sm"
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-3xl font-bold">
                      {prospect.firstName} {prospect.lastName}
                    </h2>
                    <StatusPill label={prospect.status} variant="gold" />
                  </div>
                  <p className="mt-1 text-white/70">
                    {prospect.major || 'Undeclared'} · Class of {prospect.graduationYear}
                  </p>
                  <div className="mt-3 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={i < prospect.rating ? 'fill-accent text-accent' : 'text-white/30'}
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
                      Assigned to {prospect.assignedBrother || 'Unassigned'}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-white/60">No follow-up scheduled</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <Card>
              <CardHeader title="Contact Info" />
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3 text-neutral-600">
                  <Phone size={16} className="shrink-0 text-accent" />
                  {prospect.phone || '—'}
                </li>
                <li className="flex items-center gap-3 text-neutral-600">
                  <Mail size={16} className="shrink-0 text-accent" />
                  {prospect.email || '—'}
                </li>
                <li className="flex items-center gap-3 text-neutral-600">
                  <AtSign size={16} className="shrink-0 text-accent" />
                  {prospect.instagram || '—'}
                </li>
                <li className="flex items-center gap-3 text-neutral-600">
                  <MapPin size={16} className="shrink-0 text-accent" />
                  {prospect.hometown || '—'}
                </li>
              </ul>
            </Card>

            <Card>
              <CardHeader title={`${languagePack.recruitmentTerm} Info`} />
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Assigned {languagePack.memberSingular}</dt>
                  <dd className="font-medium text-neutral-900">{prospect.assignedBrother || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Source</dt>
                  <dd className="font-medium text-neutral-900">{prospect.source || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Last Contact</dt>
                  <dd className="font-medium text-neutral-900">
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
                {prospect.interests.length === 0 ? (
                  <p className="text-sm text-neutral-500">None listed</p>
                ) : (
                  prospect.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-sm bg-neutral-900/5 px-3 py-1 text-xs font-medium text-neutral-900"
                    >
                      {interest}
                    </span>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader
                title="Activity Timeline"
                action={
                  <button
                    type="button"
                    onClick={() => setShowNoteModal(true)}
                    className="flex items-center gap-1 text-xs font-medium text-accent hover:opacity-80"
                  >
                    <Plus size={14} /> Add Note
                  </button>
                }
              />
              <div className="relative space-y-0">
                {activities.map((activity, i) => (
                  <div key={activity.id} className="relative flex gap-4 pb-6">
                    {i < activities.length - 1 && (
                      <div className="absolute left-[15px] top-8 h-full w-px bg-black/5" />
                    )}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-accent/10 text-sm">
                      {activityIcons[activity.type] ?? '📌'}
                    </div>
                    <div className="min-w-0 flex-1 rounded-lg border border-black/5 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                          {activity.type}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-neutral-400">
                          <Calendar size={12} />
                          {new Date(activity.date + 'T12:00:00').toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-neutral-700">{activity.description}</p>
                      <p className="mt-2 text-xs text-neutral-400">by {activity.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Notes" action={<MessageSquare size={16} className="text-neutral-400" />} />
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">
                {prospect.notes || 'No notes yet'}
              </p>
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
          className="w-full rounded-sm border border-black/5 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            if (newNote.trim()) appendNote(prospect.id, newNote.trim(), authorName)
            setNewNote('')
            setShowNoteModal(false)
          }}
          className="mt-3 w-full rounded-sm bg-accent py-2.5 text-sm font-semibold text-white"
        >
          Save Note
        </button>
      </Modal>
    </>
  )
}
