import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Check, Pencil, Plus, Trash2, Settings2, Users, X } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell, Section } from '../components/ui/Section'
import { useAuth, usePermissions } from '../context/AuthContext'
import { useChapter } from '../context/ChapterContext'
import { useChapterFeatures } from '../context/ChapterFeaturesContext'
import {
  roleFromPositionTitle,
  useChapterPositions,
} from '../context/ChapterPositionsContext'
import { useMembers } from '../context/MembersContext'
import { ONBOARDING_ROLES, roleLabel, type UserRole } from '../types/permissions'
import type { EditorCapabilityId } from '../types/chapterFeatures'

export default function ChapterSetup() {
  const { chapter, saveChapterMeta } = useChapter()
  const { positions, addPosition, removePosition, assignPosition, updatePosition } =
    useChapterPositions()
  const {
    catalog,
    editorCatalog,
    isFeatureEnabled,
    setFeatureEnabled,
    getEditors,
    toggleEditor,
  } = useChapterFeatures()
  const { members, accounts, assignMemberRole } = useMembers()
  const { memberId, updateRole, role } = useAuth()
  const permissions = usePermissions()

  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editorCap, setEditorCap] = useState<EditorCapabilityId>('editStandards')
  const [meta, setMeta] = useState({
    chapterDesignation: chapter.chapterDesignation,
    university: chapter.university,
  })
  const [metaSaved, setMetaSaved] = useState(false)

  const activeMembers = useMemo(
    () =>
      [...members]
        .filter((m) => m.status === 'Active' || m.status === 'New Member')
        .sort((a, b) => a.lastName.localeCompare(b.lastName)),
    [members]
  )

  const canManageSetup = permissions.canAccessAdminSettings || role === 'President'
  if (!canManageSetup) {
    return <Navigate to="/home" replace />
  }

  const applyRole = (targetMemberId: string, nextRole: UserRole) => {
    assignMemberRole(targetMemberId, nextRole)
    if (targetMemberId === memberId) updateRole(nextRole)
  }

  const onAssignSeat = (positionId: string, title: string, nextMemberId: string) => {
    const assigned = nextMemberId || undefined
    assignPosition(positionId, assigned)
    if (!assigned) return
    const mapped = roleFromPositionTitle(title)
    if (mapped) applyRole(assigned, mapped)
  }

  const saveMeta = () => {
    saveChapterMeta({
      chapterDesignation: meta.chapterDesignation.trim(),
      university: meta.university.trim(),
    })
    setMetaSaved(true)
    window.setTimeout(() => setMetaSaved(false), 2000)
  }

  const add = () => {
    if (!newTitle.trim()) return
    addPosition(newTitle.trim(), newDescription.trim() || undefined)
    setNewTitle('')
    setNewDescription('')
  }

  const startEdit = (id: string, title: string, description?: string) => {
    setEditingId(id)
    setEditTitle(title)
    setEditDescription(description ?? '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
  }

  const saveEdit = (id: string) => {
    const title = editTitle.trim()
    if (!title) return
    updatePosition(id, {
      title,
      description: editDescription.trim() || undefined,
    })
    const pos = positions.find((p) => p.id === id)
    if (pos?.assignedMemberId) {
      const mapped = roleFromPositionTitle(title)
      if (mapped) applyRole(pos.assignedMemberId, mapped)
    }
    cancelEdit()
  }

  const deletePosition = (id: string, title: string) => {
    if (!window.confirm(`Remove “${title}” from officer positions?`)) return
    removePosition(id)
    if (editingId === id) cancelEdit()
  }

  const roleForMember = (id: string): UserRole => {
    const acct = accounts.find((a) => a.memberId === id)
    return acct?.role ?? 'ActiveMember'
  }

  return (
    <>
      <TopBar
        title="Chapter Setup"
        subtitle="Profile, features, officer seats, and who can edit"
        showBrand={false}
        actions={
          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-sm border border-black/5 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            <Settings2 size={15} />
            Settings
          </Link>
        }
      />

      <PageShell>
        <Section title="Chapter profile" subtitle="Shown in the sidebar and member app">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                Organization
              </p>
              <p className="mt-1 rounded-2xl bg-neutral-50 px-4 py-3 text-sm font-semibold">
                {chapter.orgName}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                Type
              </p>
              <p className="mt-1 rounded-2xl bg-neutral-50 px-4 py-3 text-sm font-semibold">
                {chapter.orgType}
              </p>
            </div>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                Chapter designation
              </span>
              <input
                value={meta.chapterDesignation}
                onChange={(e) => setMeta({ ...meta, chapterDesignation: e.target.value })}
                placeholder="e.g. Beta Chapter"
                className="mt-1 w-full rounded-sm border border-black/5 bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-accent/40"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                University
              </span>
              <input
                value={meta.university}
                onChange={(e) => setMeta({ ...meta, university: e.target.value })}
                placeholder="Campus name"
                className="mt-1 w-full rounded-sm border border-black/5 bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-accent/40"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={saveMeta}
            className="mt-4 rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold text-white"
          >
            {metaSaved ? 'Saved' : 'Save chapter profile'}
          </button>
        </Section>

        <Section
          title="Officer positions"
          subtitle="Add, edit, or remove seats. Matching titles also update app permissions."
        >
          <div className="mb-4 space-y-3 rounded-2xl border border-[var(--rule)] bg-neutral-50/80 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
              Add position
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
                placeholder="Title (e.g. Risk Manager)"
                className="input-editorial w-full"
              />
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
                placeholder="Description (optional)"
                className="input-editorial w-full"
              />
              <button
                type="button"
                onClick={add}
                disabled={!newTitle.trim()}
                className="btn-primary disabled:opacity-40"
              >
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          <div className="divide-y divide-black/5 rounded-2xl border border-black/5 bg-neutral-50/60">
            {positions.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-neutral-500">
                No positions yet — add one above.
              </p>
            ) : (
              positions.map((pos) => {
                const mapped = roleFromPositionTitle(pos.title)
                const isEditing = editingId === pos.id
                return (
                  <div
                    key={pos.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      {isEditing ? (
                        <>
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="input-editorial w-full max-w-md font-semibold"
                            autoFocus
                          />
                          <input
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Description (optional)"
                            className="input-editorial w-full max-w-md text-sm"
                          />
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-neutral-900">{pos.title}</p>
                          {pos.description && (
                            <p className="text-sm text-neutral-600">{pos.description}</p>
                          )}
                          <p className="text-xs text-neutral-500">
                            {pos.isCustom ? 'Custom' : 'Standard'}
                            {mapped
                              ? ` · Grants ${roleLabel(mapped)} access`
                              : ' · Display title only'}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {!isEditing && (
                        <select
                          value={pos.assignedMemberId ?? ''}
                          onChange={(e) => onAssignSeat(pos.id, pos.title, e.target.value)}
                          className="min-w-[160px] rounded-sm border border-black/5 bg-white px-3 py-2 text-sm outline-none focus:border-accent/40"
                        >
                          <option value="">Unassigned</option>
                          {activeMembers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.firstName} {m.lastName}
                            </option>
                          ))}
                        </select>
                      )}
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(pos.id)}
                            disabled={!editTitle.trim()}
                            className="inline-flex items-center gap-1 rounded-sm bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                          >
                            <Check size={14} /> Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1 rounded-sm border border-black/10 px-3 py-2 text-xs font-semibold text-neutral-600"
                          >
                            <X size={14} /> Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(pos.id, pos.title, pos.description)}
                            className="rounded-sm p-2 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900"
                            aria-label={`Edit ${pos.title}`}
                            title="Edit position"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePosition(pos.id, pos.title)}
                            className="rounded-sm p-2 text-neutral-400 hover:bg-neutral-200 hover:text-red-600"
                            aria-label={`Delete ${pos.title}`}
                            title="Delete position"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Section>

        <Section
          title="Chapter features"
          subtitle="Turn modules on or off for your chapter — disabled items hide from the sidebar"
        >
          <ul className="divide-y divide-black/5 rounded-2xl border border-black/5">
            {catalog.map((f) => {
              const on = isFeatureEnabled(f.id)
              return (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-4 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900">{f.label}</p>
                    <p className="text-xs text-neutral-500">{f.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => setFeatureEnabled(f.id, !on)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                      on ? 'bg-accent' : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                        on ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        </Section>

        <Section
          title="Who can edit"
          subtitle="President always can. Add members for each capability beyond their role."
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {editorCatalog.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setEditorCap(c.id)}
                className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition ${
                  editorCap === c.id
                    ? 'bg-accent text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          {(() => {
            const def = editorCatalog.find((c) => c.id === editorCap)
            const selected = getEditors(editorCap)
            return (
              <div className="rounded-2xl border border-black/5 bg-neutral-50/60 p-5">
                <p className="font-semibold text-neutral-900">{def?.label}</p>
                <p className="mt-1 text-xs text-neutral-500">{def?.description}</p>
                {def?.featureId && !isFeatureEnabled(def.featureId) && (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    Related feature is off — turn it on above for these editors to matter.
                  </p>
                )}
                <ul className="mt-4 max-h-64 space-y-1 overflow-y-auto">
                  {activeMembers.map((m) => {
                    const checked = selected.includes(m.id)
                    return (
                      <li key={m.id}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-sm px-2 py-2 hover:bg-white">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleEditor(editorCap, m.id)}
                            className="rounded border-neutral-300 text-accent"
                          />
                          <span className="text-sm font-medium text-neutral-900">
                            {m.firstName} {m.lastName}
                          </span>
                          <span className="font-mono text-[10px] uppercase text-neutral-400">
                            {roleLabel(roleForMember(m.id))}
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })()}
        </Section>

        <Section
          title="Permission roles"
          subtitle="Control who can open treasurer, recruitment, standards, and admin tools"
        >
          <div className="overflow-x-auto rounded-2xl border border-black/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">App role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {activeMembers.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-neutral-400" />
                        <span className="font-medium text-neutral-900">
                          {m.firstName} {m.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={roleForMember(m.id)}
                        onChange={(e) => applyRole(m.id, e.target.value as UserRole)}
                        className="w-full max-w-xs rounded-sm border border-black/5 bg-white px-3 py-2 text-sm outline-none focus:border-accent/40"
                      >
                        {ONBOARDING_ROLES.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Configure Standards terminology, fines, and appeals in the{' '}
            <Link to="/standards/setup" className="font-semibold text-accent">
              Standards setup wizard
            </Link>
            . Generate role invites in{' '}
            <Link to="/settings" className="font-semibold text-accent">
              Settings → Invites
            </Link>
            .
          </p>
        </Section>
      </PageShell>
    </>
  )
}
