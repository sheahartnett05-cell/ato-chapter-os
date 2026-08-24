import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, PieChart } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import { useAuth, usePermissions } from '../context/AuthContext'
import { useChapter } from '../context/ChapterContext'
import { useBudgets } from '../context/BudgetContext'
import { budgetTotals } from '../types/budget'
import { roleLabel } from '../types/permissions'

export default function BudgetsIndex() {
  const navigate = useNavigate()
  const { chapter } = useChapter()
  const { profile, role } = useAuth()
  const permissions = usePermissions()
  const { budgets, addBudget } = useBudgets()
  const canManage = permissions.canManageBudgets

  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState({
    name: '',
    description: '',
    semester: chapter.semester,
  })

  const sorted = useMemo(
    () => [...budgets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [budgets]
  )

  const chapterTotals = useMemo(() => {
    let allocated = 0
    let spent = 0
    for (const b of budgets) {
      const t = budgetTotals(b)
      allocated += t.allocated
      spent += t.spent
    }
    return { allocated, spent, remaining: allocated - spent }
  }, [budgets])

  const createBudget = () => {
    if (!draft.name.trim()) return
    const author = `${profile.firstName} ${profile.lastName}`.trim() || 'Officer'
    const budget = addBudget({
      name: draft.name.trim(),
      description: draft.description.trim(),
      semester: draft.semester.trim(),
      createdBy: author,
      lineItems: [],
    })
    setCreateOpen(false)
    setDraft({ name: '', description: '', semester: chapter.semester })
    navigate(`/budgets/${budget.id}`)
  }

  return (
    <>
      <TopBar
        title="Budgets"
        subtitle={`${chapter.nickname} · ${chapter.semester}`}
        actions={
          canManage ? (
            <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary gap-1.5 text-xs">
              <Plus size={14} /> New budget
            </button>
          ) : undefined
        }
      />

      <PageShell className="space-y-8">
        <div className="ledger-bar grid-cols-2 lg:grid-cols-3">
          <div className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight">${chapterTotals.allocated.toLocaleString()}</p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Total allocated
            </p>
          </div>
          <div className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight">${chapterTotals.spent.toLocaleString()}</p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Total spent
            </p>
          </div>
          <div className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight">${chapterTotals.remaining.toLocaleString()}</p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Remaining
            </p>
          </div>
        </div>

        <section>
          <div className="mb-3 border-b border-[var(--rule)] pb-2">
            <h2 className="font-serif text-xl tracking-tight">All budgets</h2>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              {role ? roleLabel(role) : 'Officer'} view · click a budget for breakdown
            </p>
          </div>

          {sorted.length === 0 ? (
            <div className="border border-[var(--rule)] px-6 py-12 text-center">
              <PieChart size={28} className="mx-auto text-[var(--muted)]" />
              <p className="mt-4 text-sm text-[var(--muted)]">No budgets yet.</p>
              {canManage && (
                <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary mt-4 text-xs">
                  Create first budget
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-[var(--rule)] border border-[var(--rule)]">
              {sorted.map((budget) => {
                const { allocated, spent, remaining } = budgetTotals(budget)
                const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0
                return (
                  <li key={budget.id}>
                    <Link
                      to={`/budgets/${budget.id}`}
                      className="flex flex-wrap items-center gap-4 px-4 py-4 transition hover:bg-[var(--primary-subtle)]"
                    >
                      <PieChart size={18} className="shrink-0 text-[var(--primary)]" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[var(--ink)]">{budget.name}</p>
                        <p className="mt-0.5 line-clamp-1 text-sm text-[var(--muted)]">{budget.description}</p>
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                          {budget.semester} · {budget.lineItems.length} line items · {budget.createdBy}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="metric text-sm">${allocated.toLocaleString()}</p>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                          {pct}% spent · ${remaining.toLocaleString()} left
                        </p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </PageShell>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New budget">
        <div className="space-y-3">
          <input
            className="input-editorial"
            placeholder="Budget name (e.g. Spring Formal 2026)"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <textarea
            className="input-editorial min-h-[72px] resize-none"
            placeholder="Description"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={2}
          />
          <input
            className="input-editorial"
            placeholder="Term (e.g. Fall 2025)"
            value={draft.semester}
            onChange={(e) => setDraft({ ...draft, semester: e.target.value })}
          />
          <button type="button" onClick={createBudget} className="btn-primary w-full">
            Create budget
          </button>
        </div>
      </Modal>
    </>
  )
}
