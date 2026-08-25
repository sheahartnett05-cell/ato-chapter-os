import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Users, ChevronRight, MessageSquare } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import { useGovernance } from '../context/GovernanceContext'
import { useAuth, usePermissions } from '../context/AuthContext'
import { useMembers } from '../context/MembersContext'

type Tab = 'groups' | 'chats'

export default function Committees() {
  const navigate = useNavigate()
  const { committees, committeeChat, createCommittee, getCommittee } = useGovernance()
  const { memberId } = useAuth()
  const permissions = usePermissions()
  const { members, getMemberById } = useMembers()
  const resolvedMemberId = memberId ?? members[0]?.id ?? ''
  const canManageAll = permissions.canAccessExecTools

  const [tab, setTab] = useState<Tab>('groups')
  const [createOpen, setCreateOpen] = useState(false)
  const [groupKind, setGroupKind] = useState<'committee' | 'subgroup'>('committee')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [chairId, setChairId] = useState(resolvedMemberId)
  const [parentId, setParentId] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isPrivate, setIsPrivate] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')

  const visibleCommittees = useMemo(() => {
    if (canManageAll) return committees
    return committees.filter((c) => c.memberIds.includes(resolvedMemberId))
  }, [committees, canManageAll, resolvedMemberId])

  const topLevel = visibleCommittees.filter((c) => !c.parentId)
  const subgroupsFor = (parent: string) =>
    visibleCommittees.filter((c) => c.parentId === parent)

  const chatThreads = useMemo(() => {
    return visibleCommittees
      .map((c) => {
        const messages = committeeChat.filter((m) => m.committeeId === c.id)
        const last = messages[messages.length - 1]
        return { committee: c, last, count: messages.length }
      })
      .filter((t) => t.count > 0)
      .sort((a, b) => {
        const at = a.last?.timestamp ?? ''
        const bt = b.last?.timestamp ?? ''
        return bt.localeCompare(at)
      })
  }, [visibleCommittees, committeeChat])

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase()
    if (!q) return members
    return members.filter((m) =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
    )
  }, [members, memberSearch])

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const resetCreate = () => {
    setName('')
    setDescription('')
    setChairId(resolvedMemberId)
    setParentId('')
    setSelectedMembers([])
    setIsPrivate(false)
    setMemberSearch('')
    setGroupKind('committee')
  }

  const handleCreate = () => {
    if (!name.trim() || !chairId) return
    if (groupKind === 'subgroup' && !parentId) return
    const committee = createCommittee({
      name,
      description,
      chairId,
      memberIds: selectedMembers,
      isPrivate,
      parentId: groupKind === 'subgroup' ? parentId : undefined,
    })
    setCreateOpen(false)
    resetCreate()
    navigate(`/committees/${committee.id}?tab=members`)
  }

  const renderCard = (c: (typeof committees)[number]) => {
    const chair = getMemberById(c.chairId)
    const parent = c.parentId ? getCommittee(c.parentId) : undefined
    return (
      <Link
        key={c.id}
        to={`/committees/${c.id}`}
        className="group rounded-2xl bg-neutral-50 p-4 ring-1 ring-black/5 transition hover:ring-black/10"
      >
        <div className="flex items-start justify-between">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: c.color.startsWith('var') ? 'var(--primary)' : c.color }}
          >
            {c.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex gap-1">
            {c.parentId && (
              <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[9px] font-bold uppercase text-neutral-600">
                Subgroup
              </span>
            )}
            {c.isPrivate && (
              <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[9px] font-bold uppercase text-neutral-600">
                Private
              </span>
            )}
          </div>
        </div>
        <h3 className="mt-3 text-sm font-semibold text-neutral-900 group-hover:text-[var(--accent)]">
          {c.name}
        </h3>
        {parent && (
          <p className="mt-0.5 text-[10px] text-neutral-400">Under {parent.name}</p>
        )}
        <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{c.description}</p>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-neutral-500">
          <Users size={11} />
          {c.memberIds.length} members · Chair {chair?.firstName ?? '—'}
        </p>
        <ChevronRight
          size={14}
          className="mt-2 text-neutral-300 group-hover:text-[var(--accent)]"
        />
      </Link>
    )
  }

  return (
    <>
      <TopBar
        title="Committees"
        subtitle="Groups, subgroups, and committee chat"
        actions={
          canManageAll ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="btn-primary gap-2 px-4 py-2 text-sm font-bold shadow-sm"
            >
              <Plus size={16} />
              New group
            </button>
          ) : undefined
        }
      />
      <PageShell>
        <div className="mb-6 flex gap-1 border-b border-black/5">
          {(
            [
              ['groups', 'Groups'],
              ['chats', 'Chats'],
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

        {tab === 'groups' && (
          <>
            {visibleCommittees.length === 0 ? (
              <div className="rounded-2xl bg-neutral-50 px-8 py-12 text-center">
                <Users size={32} className="mx-auto text-neutral-300" />
                <p className="mt-4 text-sm text-neutral-600">
                  {canManageAll
                    ? 'No committees yet. Create one and add members.'
                    : 'You are not in any committees yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {topLevel.map((committee) => (
                  <div key={committee.id}>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {renderCard(committee)}
                    </div>
                    {subgroupsFor(committee.id).length > 0 && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pl-4 border-l-2 border-neutral-200">
                        {subgroupsFor(committee.id).map(renderCard)}
                      </div>
                    )}
                  </div>
                ))}
                {visibleCommittees.filter((c) => c.parentId && !topLevel.some((t) => t.id === c.parentId)).map(renderCard)}
              </div>
            )}
          </>
        )}

        {tab === 'chats' && (
          <div className="divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5 bg-white">
            {chatThreads.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-neutral-500">
                No committee messages yet. Open a group and post in Chat.
              </p>
            ) : (
              chatThreads.map(({ committee, last }) => {
                const author = last ? getMemberById(last.authorId) : undefined
                return (
                  <Link
                    key={committee.id}
                    to={`/committees/${committee.id}?tab=chat`}
                    className="flex items-start gap-4 px-5 py-4 transition hover:bg-neutral-50"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{
                        backgroundColor: committee.color.startsWith('var')
                          ? 'var(--primary)'
                          : committee.color,
                      }}
                    >
                      <MessageSquare size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-neutral-900">{committee.name}</p>
                        {last && (
                          <span className="shrink-0 text-[10px] text-neutral-400">
                            {new Date(last.timestamp).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                      {last && (
                        <p className="mt-0.5 truncate text-sm text-neutral-600">
                          <span className="font-medium">{author?.firstName ?? 'Member'}:</span>{' '}
                          {last.body}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-neutral-300" />
                  </Link>
                )
              })
            )}
          </div>
        )}
      </PageShell>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New committee or subgroup" size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-500">Type</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  ['committee', 'Committee'],
                  ['subgroup', 'Subgroup'],
                ] as const
              ).map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setGroupKind(kind)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    groupKind === kind
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-black/5 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {groupKind === 'subgroup' && (
            <div>
              <label className="text-xs font-medium text-neutral-500">Parent committee</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="mt-1 w-full rounded-sm border border-black/5 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-accent/40"
              >
                <option value="">Select parent…</option>
                {committees.filter((c) => !c.parentId).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-neutral-500">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Social Committee"
              className="mt-1 w-full rounded-sm border border-black/5 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-accent/40"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this group handle?"
              className="mt-1 w-full resize-none rounded-sm border border-black/5 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-accent/40"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500">Chair</label>
            <select
              value={chairId}
              onChange={(e) => setChairId(e.target.value)}
              className="mt-1 w-full rounded-sm border border-black/5 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-accent/40"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500">Members</label>
            <input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search members…"
              className="mt-1 w-full rounded-sm border border-black/5 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-accent/40"
            />
            <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-sm border border-black/5 bg-white p-2">
              {filteredMembers.map((m) => (
                <li key={m.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-neutral-50">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(m.id) || m.id === chairId}
                      disabled={m.id === chairId}
                      onChange={() => toggleMember(m.id)}
                      className="rounded border-black/10 text-accent focus:ring-accent"
                    />
                    <span>
                      {m.firstName} {m.lastName}
                      {m.id === chairId && (
                        <span className="ml-1 text-[10px] text-neutral-400">(chair)</span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-black/10 text-accent focus:ring-accent"
            />
            Private group (members only)
          </label>

          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || (groupKind === 'subgroup' && !parentId)}
            className="btn-primary w-full py-3 text-sm font-bold shadow-sm disabled:opacity-50"
          >
            Create {groupKind === 'subgroup' ? 'subgroup' : 'committee'}
          </button>
        </div>
      </Modal>
    </>
  )
}
