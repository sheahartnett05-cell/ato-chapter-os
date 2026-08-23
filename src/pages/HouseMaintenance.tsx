import { useMemo, useState } from 'react'
import { Plus, Sparkles, Wrench, Check, Trash2 } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import { useChapterResources } from '../context/ChapterResourcesContext'
import { usePermissions } from '../context/AuthContext'
import { useMembers } from '../context/MembersContext'
import type { HouseTaskKind, HouseTaskStatus } from '../types/chapterResources'

type Tab = 'cleanup' | 'maintenance'

const STATUS_LABEL: Record<HouseTaskStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  done: 'Done',
}

const PRIORITY_CLASS: Record<string, string> = {
  high: 'text-red-700',
  medium: 'text-amber-700',
  low: 'text-[var(--muted)]',
}

export default function HouseMaintenancePage() {
  const { houseTasks, addHouseTask, updateHouseTask, deleteHouseTask } = useChapterResources()
  const { members } = useMembers()
  const { canAccessExecTools } = usePermissions()

  const [tab, setTab] = useState<Tab>('cleanup')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    kind: 'cleanup' as HouseTaskKind,
    title: '',
    area: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedMemberId: '',
    dueDate: '',
    notes: '',
  })

  const filtered = useMemo(
    () => houseTasks.filter((t) => t.kind === tab).sort((a, b) => a.status.localeCompare(b.status)),
    [houseTasks, tab]
  )

  const openCount = filtered.filter((t) => t.status !== 'done').length

  const memberName = (id?: string) => {
    if (!id) return 'Unassigned'
    const m = members.find((x) => x.id === id)
    return m ? `${m.firstName} ${m.lastName}` : id
  }

  const submit = () => {
    if (!form.title.trim() || !form.area.trim()) return
    addHouseTask({
      kind: form.kind,
      title: form.title.trim(),
      area: form.area.trim(),
      priority: form.priority,
      assignedMemberId: form.assignedMemberId || undefined,
      dueDate: form.dueDate || undefined,
      notes: form.notes.trim() || undefined,
    })
    setCreateOpen(false)
    setForm({
      kind: tab,
      title: '',
      area: '',
      priority: 'medium',
      assignedMemberId: '',
      dueDate: '',
      notes: '',
    })
  }

  const cycleStatus = (id: string, current: HouseTaskStatus) => {
    const order: HouseTaskStatus[] = ['open', 'in_progress', 'done']
    const next = order[(order.indexOf(current) + 1) % order.length]
    updateHouseTask(id, { status: next })
  }

  return (
    <>
      <TopBar
        title="House"
        subtitle={`Cleanup & maintenance · ${openCount} open`}
        actions={
          canAccessExecTools ? (
            <button
              type="button"
              onClick={() => {
                setForm((f) => ({ ...f, kind: tab }))
                setCreateOpen(true)
              }}
              className="btn-primary gap-1.5 text-xs"
            >
              <Plus size={14} /> Add task
            </button>
          ) : undefined
        }
      />

      <PageShell className="space-y-6">
        <div className="flex border border-[var(--rule)]">
          {(
            [
              { id: 'cleanup' as Tab, label: 'Cleanup', icon: Sparkles },
              { id: 'maintenance' as Tab, label: 'Maintenance', icon: Wrench },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 font-mono text-[10px] uppercase tracking-wider transition ${
                tab === id
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'text-[var(--muted)] hover:bg-black/[0.02]'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="py-10 text-center font-mono text-xs text-[var(--muted)]">
            No {tab} tasks yet.
            {canAccessExecTools && ' Add one to track house work.'}
          </p>
        ) : (
          <ul className="list-editorial border border-[var(--rule)]">
            {filtered.map((task) => (
              <li
                key={task.id}
                className="flex flex-wrap items-start gap-4 px-4 py-4"
              >
                <div
                  className="mt-1 h-10 w-1 shrink-0"
                  style={{
                    backgroundColor:
                      task.status === 'done'
                        ? 'var(--muted)'
                        : task.priority === 'high'
                          ? '#b91c1c'
                          : task.priority === 'medium'
                            ? '#b45309'
                            : 'var(--primary)',
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-[var(--ink)]">{task.title}</p>
                    <span
                      className={`font-mono text-[9px] uppercase tracking-wider ${PRIORITY_CLASS[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    {task.area}
                    {task.dueDate ? ` · Due ${task.dueDate}` : ''}
                    · {memberName(task.assignedMemberId)}
                  </p>
                  {task.notes && (
                    <p className="mt-2 text-sm text-[var(--muted)]">{task.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cycleStatus(task.id, task.status)}
                    className="btn-ghost gap-1 px-2 py-1 text-[10px]"
                    title="Cycle status"
                  >
                    {task.status === 'done' ? <Check size={12} /> : null}
                    {STATUS_LABEL[task.status]}
                  </button>
                  {canAccessExecTools && (
                    <button
                      type="button"
                      onClick={() => deleteHouseTask(task.id)}
                      className="btn-ghost px-2 py-1 text-[10px] text-red-700"
                      aria-label="Delete task"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageShell>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={`New ${tab} task`}>
        <div className="space-y-3">
          <input
            className="input-editorial"
            placeholder="Task title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className="input-editorial"
            placeholder="Area (Kitchen, porch, etc.)"
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className="input-editorial"
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value as 'low' | 'medium' | 'high' })
              }
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <input
              type="date"
              className="input-editorial font-mono"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <select
            className="input-editorial"
            value={form.assignedMemberId}
            onChange={(e) => setForm({ ...form, assignedMemberId: e.target.value })}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </select>
          <textarea
            className="input-editorial min-h-[72px] resize-none"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button type="button" onClick={submit} className="btn-primary w-full">
            Create task
          </button>
        </div>
      </Modal>
    </>
  )
}
