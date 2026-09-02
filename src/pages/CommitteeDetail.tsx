import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Send, UserPlus, X } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import { useGovernance } from '../context/GovernanceContext'
import { useAuth, usePermissions } from '../context/AuthContext'
import { useMembers } from '../context/MembersContext'

type DetailTab = 'chat' | 'members' | 'feed'

export default function CommitteeDetail() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as DetailTab) || 'chat'

  const {
    getCommittee,
    committeeChat,
    groupAnnouncements,
    committeeTasks,
    addCommitteeMember,
    removeCommitteeMember,
    sendCommitteeMessage,
  } = useGovernance()
  const { memberId } = useAuth()
  const permissions = usePermissions()
  const { members, getMemberById } = useMembers()

  const committee = id ? getCommittee(id) : undefined
  const resolvedMemberId = memberId ?? members[0]?.id ?? ''
  const isMember = committee?.memberIds.includes(resolvedMemberId) ?? false
  const isChair = committee?.chairId === resolvedMemberId
  const canManageMembers = permissions.canAccessExecTools || isChair

  const [messageDraft, setMessageDraft] = useState('')
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [memberPick, setMemberPick] = useState('')
  const [memberSearch, setMemberSearch] = useState('')

  const messages = useMemo(
    () =>
      committee
        ? committeeChat
            .filter((m) => m.committeeId === committee.id)
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        : [],
    [committee, committeeChat]
  )

  const feed = committee
    ? groupAnnouncements.filter((a) => a.committeeId === committee.id)
    : []
  const tasks = committee ? committeeTasks.filter((t) => t.committeeId === committee.id) : []

  const availableToAdd = useMemo(() => {
    if (!committee) return []
    const q = memberSearch.trim().toLowerCase()
    return members.filter((m) => {
      if (committee.memberIds.includes(m.id)) return false
      if (!q) return true
      return `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
    })
  }, [members, committee, memberSearch])

  const setTab = (next: DetailTab) => {
    setSearchParams({ tab: next }, { replace: true })
  }

  if (!committee) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <p className="text-sm text-neutral-500">Committee not found</p>
        <Link to="/committees" className="text-sm font-semibold text-accent hover:underline">
          ← Back to committees
        </Link>
      </div>
    )
  }

  if (!isMember && !permissions.canAccessExecTools) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-neutral-600">This is a private committee you are not part of.</p>
        <Link to="/committees" className="text-sm font-semibold text-accent hover:underline">
          ← Back to committees
        </Link>
      </div>
    )
  }

  const chair = getMemberById(committee.chairId)

  const handleSend = () => {
    if (!messageDraft.trim()) return
    sendCommitteeMessage(committee.id, resolvedMemberId, messageDraft)
    setMessageDraft('')
  }

  const handleAddMember = () => {
    if (!memberPick) return
    addCommitteeMember(committee.id, memberPick)
    setMemberPick('')
    setAddMemberOpen(false)
    setMemberSearch('')
  }

  return (
    <>
      <TopBar
        title={committee.name}
        subtitle={`${committee.memberIds.length} members${committee.parentId ? ' · Subgroup' : ''}`}
        actions={
          <Link
            to="/committees"
            className="flex items-center gap-1 rounded-sm border border-black/5 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            <ArrowLeft size={14} /> All groups
          </Link>
        }
      />
      <PageShell className="space-y-5">
        <p className="text-sm text-neutral-600">{committee.description}</p>
        {chair && (
          <p className="text-xs text-neutral-400">
            Chair: {chair.firstName} {chair.lastName}
          </p>
        )}

        <div className="flex gap-1 border-b border-black/5">
          {(
            [
              ['chat', 'Chat'],
              ['members', 'Members'],
              ['feed', 'Feed'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                tab === key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'chat' && (
          <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-black/5 bg-white">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-500">
                  No messages yet. Start the conversation.
                </p>
              ) : (
                messages.map((msg) => {
                  const author = getMemberById(msg.authorId)
                  const mine = msg.authorId === resolvedMemberId
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                          mine ? 'bg-accent text-white' : 'bg-neutral-100 text-neutral-900'
                        }`}
                      >
                        {!mine && (
                          <p
                            className={`mb-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              mine ? 'text-white/80' : 'text-neutral-500'
                            }`}
                          >
                            {author ? `${author.firstName} ${author.lastName}` : 'Member'}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.body}</p>
                        <p
                          className={`mt-1 text-[10px] ${
                            mine ? 'text-white/70' : 'text-neutral-400'
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="flex gap-2 border-t border-black/5 p-3">
              <input
                value={messageDraft}
                onChange={(e) => setMessageDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Message your committee…"
                className="min-w-0 flex-1 rounded-sm border border-black/5 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-accent/40"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!messageDraft.trim()}
                className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Send size={15} />
                Send
              </button>
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div className="space-y-4">
            {canManageMembers && (
              <button
                type="button"
                onClick={() => setAddMemberOpen(true)}
                className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-white"
              >
                <UserPlus size={15} />
                Add member
              </button>
            )}
            <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5 bg-white">
              {committee.memberIds.map((mid) => {
                const m = getMemberById(mid)
                const isCommitteeChair = mid === committee.chairId
                if (!m) return null
                return (
                  <li
                    key={mid}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-sm text-xs font-bold text-white"
                        style={{ backgroundColor: 'var(--brand-primary)' }}
                      >
                        {m.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">
                          {m.firstName} {m.lastName}
                          {isCommitteeChair && (
                            <span className="ml-2 rounded bg-[var(--primary-subtle)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--primary)]">
                              Chair
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-neutral-500">{m.role ?? 'Member'}</p>
                      </div>
                    </div>
                    {canManageMembers && !isCommitteeChair && (
                      <button
                        type="button"
                        onClick={() => removeCommitteeMember(committee.id, mid)}
                        className="inline-flex items-center gap-1 rounded-sm border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        <X size={12} />
                        Remove
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {tab === 'feed' && (
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase text-neutral-400">
                Announcements
              </p>
              <ul className="space-y-2">
                {feed.length === 0 ? (
                  <li className="text-xs text-neutral-500">No posts</li>
                ) : (
                  feed.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-xl bg-neutral-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        {a.isUrgent && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-700">
                            Urgent
                          </span>
                        )}
                        <p className="text-sm font-semibold text-neutral-900">{a.title}</p>
                      </div>
                      <p className="mt-1 text-sm text-neutral-600">{a.body}</p>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase text-neutral-400">Tasks</p>
              <ul className="space-y-2">
                {tasks.map((t) => {
                  const assignee = t.assigneeId ? getMemberById(t.assigneeId) : null
                  return (
                    <li key={t.id} className="rounded-xl bg-neutral-50 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{t.title}</span>
                        <span className="text-[10px] text-neutral-400">
                          {assignee?.firstName ?? '—'}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-neutral-200">
                        <div
                          className="h-full rounded-sm bg-[var(--accent)]"
                          style={{ width: `${t.progress}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}
      </PageShell>

      <Modal open={addMemberOpen} onClose={() => setAddMemberOpen(false)} title="Add committee member">
        <div className="space-y-4">
          <input
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            placeholder="Search roster…"
            aria-label="Search roster"
            className="w-full rounded-sm border border-black/5 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-accent/40"
          />
          <select
            value={memberPick}
            onChange={(e) => setMemberPick(e.target.value)}
            className="w-full rounded-sm border border-black/5 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-accent/40"
          >
            <option value="">Select member…</option>
            {availableToAdd.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddMember}
            disabled={!memberPick}
            className="btn-primary w-full py-2.5 text-sm font-bold disabled:opacity-50"
          >
            Add to committee
          </button>
        </div>
      </Modal>
    </>
  )
}
