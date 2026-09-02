import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Scale, DollarSign, Calendar, Plus, Settings2 } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import { useGovernance } from '../context/GovernanceContext'
import { usePermissions } from '../context/AuthContext'
import { useStandardsModuleConfig } from '../hooks/useStandardsModuleConfig'
import { useMembers } from '../context/MembersContext'
import type { JBoardCategory } from '../types/governance'

type Tab = 'overview' | 'cases' | 'fines'
type FineFilter = 'All' | 'Unpaid' | 'Appealed' | 'Paid'

const categories: JBoardCategory[] = [
  'Unexcused Absence',
  'Conduct',
  'Property Damage',
  'Risk Violation',
]

function statusPill(status: string) {
  const map: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-700',
    'Hearing Scheduled': 'bg-blue-100 text-blue-700',
    Resolved: 'bg-emerald-100 text-emerald-700',
    Dismissed: 'bg-neutral-200 text-neutral-600',
    Unpaid: 'bg-red-100 text-red-700',
    Paid: 'bg-emerald-100 text-emerald-700',
    Waived: 'bg-neutral-200 text-neutral-600',
    Appealed: 'bg-purple-100 text-purple-700',
  }
  return map[status] ?? 'bg-neutral-100 text-neutral-600'
}

export default function JudicialBoard() {
  const { cases, fines, fineSchedule, fileCase, issueFine, updateFineStatus } = useGovernance()
  const permissions = usePermissions()
  const { members, getMemberById } = useMembers()
  const { moduleName, configured } = useStandardsModuleConfig()
  const [tab, setTab] = useState<Tab>('overview')
  const [fineFilter, setFineFilter] = useState<FineFilter>('All')
  const [showFile, setShowFile] = useState(false)
  const [showFine, setShowFine] = useState(false)
  const [form, setForm] = useState({
    memberId: '',
    category: 'Unexcused Absence' as JBoardCategory,
    description: '',
    fineAmount: 25,
  })

  const pending = cases.filter((c) => c.status === 'Pending').length
  const unpaidTotal = fines
    .filter((f) => f.status === 'Unpaid')
    .reduce((s, f) => s + f.amount, 0)
  const hearings = cases.filter((c) => c.status === 'Hearing Scheduled')

  const canConfigure =
    permissions.canAccessAdminSettings || permissions.canAccessJBoardSettings

  const filteredFines = fines.filter((f) => {
    if (fineFilter === 'All') return true
    if (fineFilter === 'Unpaid') return f.status === 'Unpaid'
    if (fineFilter === 'Appealed') return f.status === 'Appealed'
    return f.status === 'Paid'
  })

  const handleFileCase = () => {
    if (!form.memberId) return
    const rule = fineSchedule.find((r) => r.category === form.category)
    const amount = form.fineAmount || rule?.amount || 25
    fileCase({
      memberId: form.memberId,
      incidentDate: new Date().toISOString().slice(0, 10),
      category: form.category,
      description: form.description || rule?.label || form.category,
      status: 'Pending',
      sanctionType: 'Fine',
      fineAmount: amount,
      evidenceUrls: [],
    })
    setShowFile(false)
    setForm({ memberId: '', category: 'Unexcused Absence', description: '', fineAmount: 25 })
  }

  const handleDirectFine = () => {
    if (!form.memberId) return
    issueFine({
      memberId: form.memberId,
      amount: form.fineAmount,
      reason: form.description || form.category,
      dateIssued: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: 'Unpaid',
    })
    setShowFine(false)
    setForm({ memberId: '', category: 'Unexcused Absence', description: '', fineAmount: 25 })
  }

  return (
    <>
      <TopBar
        title={moduleName || 'Standards & Accountability'}
        subtitle="Cases · Fines · Hearings"
        actions={
          <div className="flex gap-1.5">
            {canConfigure && (
              <Link
                to="/standards/setup"
                className="flex items-center gap-1 rounded-sm border border-[var(--rule)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-black/[0.02]"
              >
                <Settings2 size={12} />
                {configured ? 'Reconfigure' : 'Configure'}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setShowFile(true)}
              className="flex items-center gap-1 rounded-sm bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Plus size={12} /> Case
            </button>
            <button
              type="button"
              onClick={() => setShowFine(true)}
              className="flex items-center gap-1 rounded-sm bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Plus size={12} /> Fine
            </button>
          </div>
        }
      />

      <PageShell className="space-y-4">
        {canConfigure && !configured && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[var(--rule)] bg-neutral-50 px-4 py-3">
            <p className="text-sm text-[var(--ink)]">
              Set up terminology, fine matrix, and excuse policy for this module.
            </p>
            <Link
              to="/standards/setup"
              className="rounded-sm bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-white"
            >
              Start setup wizard
            </Link>
          </div>
        )}
        <div className="flex gap-1">
          {(['overview', 'cases', 'fines'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-sm px-3 py-1.5 text-xs font-semibold capitalize ${
                tab === t
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Scale size={14} className="text-[var(--accent)]" />
                <div>
                  <p className="text-lg font-semibold tabular-nums">{pending}</p>
                  <p className="text-[10px] font-semibold uppercase text-neutral-400">Pending</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={14} className="text-[var(--accent)]" />
                <div>
                  <p className="text-lg font-semibold tabular-nums">${unpaidTotal}</p>
                  <p className="text-[10px] font-semibold uppercase text-neutral-400">Unpaid</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[var(--accent)]" />
                <div>
                  <p className="text-lg font-semibold tabular-nums">{hearings.length}</p>
                  <p className="text-[10px] font-semibold uppercase text-neutral-400">Hearings</p>
                </div>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase text-neutral-400">
                Hearings
              </p>
              <ul className="space-y-1">
                {hearings.length === 0 ? (
                  <li className="text-xs text-neutral-500">None scheduled</li>
                ) : (
                  hearings.map((c) => {
                    const m = getMemberById(c.memberId)
                    return (
                      <li
                        key={c.id}
                        className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-neutral-50"
                      >
                        <span className="truncate text-sm font-medium">
                          {m?.firstName} {m?.lastName}
                        </span>
                        <span className="text-[10px] tabular-nums text-neutral-400">
                          {c.hearingDate
                            ? new Date(c.hearingDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </span>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          </>
        )}

        {tab === 'cases' && (
          <ul className="space-y-1.5">
            {cases.length === 0 ? (
              <li className="rounded-xl bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
                No cases filed yet.
              </li>
            ) : (
              cases.map((c) => {
              const m = getMemberById(c.memberId)
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2.5"
                >
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${statusPill(c.status)}`}>
                    {c.status.split(' ')[0]}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {m?.firstName} · {c.category}
                  </span>
                  {c.fineAmount > 0 && (
                    <span className="shrink-0 text-xs font-semibold text-[var(--accent)]">
                      ${c.fineAmount}
                    </span>
                  )}
                  {c.appealSubmitted && (
                    <span className="shrink-0 rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-700">
                      Appeal
                    </span>
                  )}
                </li>
              )
            })
            )}
          </ul>
        )}

        {tab === 'fines' && (
          <>
            <div className="flex gap-1">
              {(['All', 'Unpaid', 'Appealed', 'Paid'] as FineFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFineFilter(f)}
                  className={`rounded-sm px-2.5 py-1 text-[11px] font-semibold ${
                    fineFilter === f
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <ul className="space-y-1">
              {filteredFines.length === 0 ? (
                <li className="rounded-xl bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
                  No fines on record.
                </li>
              ) : (
              filteredFines.map((f) => {
                const m = getMemberById(f.memberId)
                return (
                  <li
                    key={f.id}
                    className="flex flex-wrap items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2"
                  >
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${statusPill(f.status)}`}>
                      {f.status}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {m?.firstName} · {f.reason.split('—')[0]?.trim() ?? f.reason}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">${f.amount}</span>
                    {f.status === 'Unpaid' && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => updateFineStatus(f.id, 'Waived')}
                          className="rounded-sm bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold"
                        >
                          Waive
                        </button>
                        <button
                          type="button"
                          onClick={() => updateFineStatus(f.id, 'Paid')}
                          className="rounded-sm bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white"
                        >
                          Paid
                        </button>
                        <button
                          type="button"
                          className="rounded-sm bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white"
                        >
                          Remind
                        </button>
                      </div>
                    )}
                  </li>
                )
              })
              )}
            </ul>
          </>
        )}
      </PageShell>

      <Modal open={showFile} onClose={() => setShowFile(false)} title="File violation">
        <div className="space-y-3">
          <select
            value={form.memberId}
            onChange={(e) => setForm({ ...form, memberId: e.target.value })}
            className="w-full rounded-xl border border-black/5 bg-neutral-50 px-3 py-2 text-sm"
          >
            <option value="">Select member…</option>
            {members.filter((m) => m.status === 'Active').map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </select>
          <select
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value as JBoardCategory })
            }
            className="w-full rounded-xl border border-black/5 bg-neutral-50 px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={form.fineAmount}
            onChange={(e) => setForm({ ...form, fineAmount: Number(e.target.value) })}
            placeholder="Fine $"
            className="w-full rounded-xl border border-black/5 bg-neutral-50 px-3 py-2 text-sm"
          />
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Note (optional)"
            className="w-full rounded-xl border border-black/5 bg-neutral-50 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleFileCase}
            disabled={!form.memberId}
            className="w-full rounded-sm bg-[var(--primary)] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Issue violation + fine
          </button>
        </div>
      </Modal>

      <Modal open={showFine} onClose={() => setShowFine(false)} title="Direct fine">
        <div className="space-y-3">
          <select
            value={form.memberId}
            onChange={(e) => setForm({ ...form, memberId: e.target.value })}
            className="w-full rounded-xl border border-black/5 bg-neutral-50 px-3 py-2 text-sm"
          >
            <option value="">Select member…</option>
            {members.filter((m) => m.status === 'Active').map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={form.fineAmount}
            onChange={(e) => setForm({ ...form, fineAmount: Number(e.target.value) })}
            className="w-full rounded-xl border border-black/5 bg-neutral-50 px-3 py-2 text-sm"
          />
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Reason"
            className="w-full rounded-xl border border-black/5 bg-neutral-50 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleDirectFine}
            disabled={!form.memberId}
            className="w-full rounded-sm bg-[var(--primary)] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Issue fine
          </button>
        </div>
      </Modal>
    </>
  )
}
