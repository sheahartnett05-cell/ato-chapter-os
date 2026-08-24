import { useMemo, useState } from 'react'
import { BarChart3, ClipboardList, FileText, Megaphone, Pin, Plus } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import { PollCard } from '../components/communications/PollCard'
import { SignupCard } from '../components/communications/SignupCard'
import { useAuth, usePermissions } from '../context/AuthContext'
import { useCommunications } from '../context/CommunicationsContext'
import { useChapter } from '../context/ChapterContext'
import { useMembers } from '../context/MembersContext'
import {
  applyTemplateTokens,
  DEFAULT_TEMPLATE_TOKENS,
} from '../data/templateData'
import { CURRENT_MEMBER_ID } from '../data/mockData'
import { roleLabel } from '../types/permissions'
import type { AnnouncementTemplate, PostKind } from '../types/features'

type Tab = 'feed' | 'polls' | 'signups' | 'templates'
type ComposerKind = PostKind

function kindIcon(kind: PostKind) {
  if (kind === 'poll') return BarChart3
  if (kind === 'signup') return ClipboardList
  return Megaphone
}

function kindLabel(kind: PostKind) {
  if (kind === 'poll') return 'Poll'
  if (kind === 'signup') return 'Sign-up'
  return 'Post'
}

export default function Announcements() {
  const { chapter, languagePack } = useChapter()
  const { profile, role, memberId } = useAuth()
  const permissions = usePermissions()
  const { posts, templates, addPost, togglePin } = useCommunications()
  const { getMemberById } = useMembers()

  const voterId = memberId ?? getMemberById(memberId ?? '')?.id ?? CURRENT_MEMBER_ID
  const canCreate = permissions.canPostAnnouncements

  const [tab, setTab] = useState<Tab>('feed')
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerKind, setComposerKind] = useState<ComposerKind>('announcement')
  const [selectedTemplate, setSelectedTemplate] = useState<AnnouncementTemplate | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [pollCloses, setPollCloses] = useState('2025-08-30')
  const [signupSlots, setSignupSlots] = useState(['', ''])
  const [pinNew, setPinNew] = useState(false)

  const sorted = useMemo(
    () =>
      [...posts].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }),
    [posts]
  )

  const polls = sorted.filter((p) => p.kind === 'poll')
  const signups = sorted.filter((p) => p.kind === 'signup')

  const applyTemplate = (tpl: AnnouncementTemplate) => {
    const tokens = {
      ...DEFAULT_TEMPLATE_TOKENS,
      memberTerm: languagePack.memberSingular.toLowerCase(),
    }
    setSelectedTemplate(tpl)
    setTitle(applyTemplateTokens(tpl.title, tokens))
    setBody(applyTemplateTokens(tpl.body, tokens))
    if (tpl.category === 'poll') {
      setComposerKind('poll')
      setPollQuestion(tpl.pollQuestion ?? 'Your question?')
      setPollOptions(tpl.pollOptions ?? ['Option A', 'Option B'])
    } else if (tpl.category === 'signup') {
      setComposerKind('signup')
      setSignupSlots(tpl.signupSlots ?? ['Shift 1', 'Shift 2'])
    } else {
      setComposerKind('announcement')
    }
    setComposerOpen(true)
    setTab('feed')
  }

  const openComposer = (kind: ComposerKind) => {
    setComposerKind(kind)
    setSelectedTemplate(null)
    setTitle('')
    setBody('')
    setPollQuestion('')
    setPollOptions(['', ''])
    setSignupSlots(['', ''])
    setComposerOpen(true)
  }

  const publish = () => {
    if (!title.trim()) return
    const author = `${profile.firstName} ${profile.lastName}`.trim() || 'Exec'
    const authorRole = role ? roleLabel(role) : 'Officer'

    if (composerKind === 'poll') {
      const opts = pollOptions.map((o) => o.trim()).filter(Boolean)
      if (!pollQuestion.trim() || opts.length < 2) return
      addPost({
        kind: 'poll',
        title: title.trim(),
        body: body.trim(),
        author,
        authorRole,
        pinned: pinNew,
        poll: {
          question: pollQuestion.trim(),
          optionLabels: opts,
          closesAt: pollCloses,
          allowMultiple: false,
        },
      })
    } else if (composerKind === 'signup') {
      const slots = signupSlots.map((s) => s.trim()).filter(Boolean)
      if (slots.length < 1) return
      addPost({
        kind: 'signup',
        title: title.trim(),
        body: body.trim(),
        author,
        authorRole,
        pinned: pinNew,
        signup: { slotLabels: slots },
      })
    } else {
      addPost({
        kind: 'announcement',
        title: title.trim(),
        body: body.trim(),
        author,
        authorRole,
        pinned: pinNew,
      })
    }
    setComposerOpen(false)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'feed', label: 'Feed' },
    { id: 'polls', label: 'Polls' },
    { id: 'signups', label: 'Sign-ups' },
    { id: 'templates', label: 'Templates' },
  ]

  return (
    <>
      <TopBar
        title="Announcements"
        subtitle={`${chapter.nickname} · ${chapter.semester}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex border border-[var(--rule)]">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider ${
                    tab === t.id
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'text-[var(--muted)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {canCreate && (
              <div className="flex gap-1">
                <button type="button" onClick={() => openComposer('announcement')} className="btn-ghost text-xs">
                  <Megaphone size={12} /> Post
                </button>
                <button type="button" onClick={() => openComposer('poll')} className="btn-ghost text-xs">
                  <BarChart3 size={12} /> Poll
                </button>
                <button type="button" onClick={() => openComposer('signup')} className="btn-ghost text-xs">
                  <ClipboardList size={12} /> Sign-up
                </button>
              </div>
            )}
          </div>
        }
      />

      <PageShell className="space-y-6">
        {tab === 'templates' && (
          <section>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              One-click templates — edit tokens before publishing
            </p>
            <ul className="divide-y divide-[var(--rule)] border border-[var(--rule)]">
              {templates.map((tpl) => (
                <li key={tpl.id} className="flex flex-wrap items-center gap-4 px-4 py-4">
                  <FileText size={16} className="shrink-0 text-[var(--primary)]" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--ink)]">{tpl.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      {tpl.category} · {tpl.title.slice(0, 48)}
                      {tpl.title.length > 48 ? '…' : ''}
                    </p>
                  </div>
                  {canCreate && (
                    <button type="button" onClick={() => applyTemplate(tpl)} className="btn-primary text-xs">
                      Use template
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'feed' && (
          <ul className="space-y-6">
            {sorted.length === 0 && (
              <li className="border border-[var(--rule)] px-4 py-8 text-center font-mono text-xs text-[var(--muted)]">
                No posts yet
              </li>
            )}
            {sorted.map((a) => {
              const Icon = kindIcon(a.kind)
              return (
                <li key={a.id} className="border border-[var(--rule)] bg-[var(--surface-card)]">
                  <div className="border-b border-[var(--rule)] px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {a.pinned && <Pin size={12} className="text-[var(--primary)]" />}
                          <Icon size={12} className="text-[var(--muted)]" />
                          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--primary)]">
                            {kindLabel(a.kind)}
                          </span>
                          <h3 className="font-serif text-lg tracking-tight text-[var(--ink)]">{a.title}</h3>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{a.body}</p>
                        <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                          {a.author} · {a.authorRole} ·{' '}
                          {new Date(a.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      {canCreate && a.kind === 'announcement' && (
                        <button
                          type="button"
                          onClick={() => togglePin(a.id)}
                          className="btn-ghost shrink-0 text-[10px]"
                        >
                          {a.pinned ? 'Unpin' : 'Pin'}
                        </button>
                      )}
                    </div>
                  </div>
                  {a.kind === 'poll' && (
                    <div className="p-4">
                      <PollCard post={a} memberId={voterId} compact />
                    </div>
                  )}
                  {a.kind === 'signup' && (
                    <div className="p-4">
                      <SignupCard post={a} memberId={voterId} compact />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {tab === 'polls' && (
          <ul className="space-y-6">
            {polls.length === 0 && (
              <li className="font-mono text-xs text-[var(--muted)]">No active polls</li>
            )}
            {polls.map((a) => (
              <li key={a.id} className="space-y-3">
                <div>
                  <h3 className="font-serif text-xl tracking-tight text-[var(--ink)]">{a.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{a.body}</p>
                </div>
                <PollCard post={a} memberId={voterId} />
              </li>
            ))}
          </ul>
        )}

        {tab === 'signups' && (
          <ul className="space-y-6">
            {signups.length === 0 && (
              <li className="font-mono text-xs text-[var(--muted)]">No sign-ups open</li>
            )}
            {signups.map((a) => (
              <li key={a.id} className="space-y-3">
                <div>
                  <h3 className="font-serif text-xl tracking-tight text-[var(--ink)]">{a.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{a.body}</p>
                </div>
                <SignupCard post={a} memberId={voterId} />
              </li>
            ))}
          </ul>
        )}
      </PageShell>

      <Modal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        title={`New ${kindLabel(composerKind)}${selectedTemplate ? ` · ${selectedTemplate.name}` : ''}`}
      >
        <div className="space-y-3">
          <input
            className="input-editorial"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="input-editorial min-h-[80px] resize-none"
            placeholder="Body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
          />

          {composerKind === 'poll' && (
            <>
              <input
                className="input-editorial"
                placeholder="Poll question"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
              />
              {pollOptions.map((opt, i) => (
                <input
                  key={i}
                  className="input-editorial"
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const next = [...pollOptions]
                    next[i] = e.target.value
                    setPollOptions(next)
                  }}
                />
              ))}
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ''])}
                className="btn-ghost text-xs"
              >
                <Plus size={12} /> Add option
              </button>
              <input
                type="date"
                className="input-editorial font-mono"
                value={pollCloses}
                onChange={(e) => setPollCloses(e.target.value)}
              />
            </>
          )}

          {composerKind === 'signup' && (
            <>
              {signupSlots.map((slot, i) => (
                <input
                  key={i}
                  className="input-editorial"
                  placeholder={`Slot ${i + 1}`}
                  value={slot}
                  onChange={(e) => {
                    const next = [...signupSlots]
                    next[i] = e.target.value
                    setSignupSlots(next)
                  }}
                />
              ))}
              <button
                type="button"
                onClick={() => setSignupSlots([...signupSlots, ''])}
                className="btn-ghost text-xs"
              >
                <Plus size={12} /> Add slot
              </button>
            </>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pinNew} onChange={(e) => setPinNew(e.target.checked)} />
            Pin to top of feed
          </label>

          <button type="button" onClick={publish} className="btn-primary w-full">
            Publish {kindLabel(composerKind).toLowerCase()}
          </button>
        </div>
      </Modal>
    </>
  )
}

