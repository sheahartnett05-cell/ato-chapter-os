import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import { BudgetDonutChart } from '../components/budget/BudgetDonutChart'
import { usePermissions } from '../context/AuthContext'
import { useChapter } from '../context/ChapterContext'
import { useBudgets } from '../context/BudgetContext'
import { budgetTotals } from '../types/budget'

const emptyLineDraft = () => ({ label: '', allocated: 500, spent: 0 })

export default function BudgetDetail() {
  const { id } = useParams<{ id: string }>()
  const { chapter } = useChapter()
  const permissions = usePermissions()
  const { getBudget, addLineItem, updateLineItem, removeLineItem } = useBudgets()
  const budget = getBudget(id ?? '')
  const canManage = permissions.canManageBudgets

  const [lineOpen, setLineOpen] = useState(false)
  const [lineDraft, setLineDraft] = useState(emptyLineDraft())
  const [inlineDraft, setInlineDraft] = useState(emptyLineDraft())

  if (!budget) {
    return (
      <PageShell>
        <p className="text-[var(--ink)]">Budget not found.</p>
        <Link to="/budgets" className="mt-2 inline-block text-sm text-[var(--accent)]">
          ← All budgets
        </Link>
      </PageShell>
    )
  }

  const { allocated, spent, remaining } = budgetTotals(budget)

  const addLine = (label: string, allocatedAmount: number, spentAmount: number) => {
    if (!label.trim() || allocatedAmount <= 0) return false
    addLineItem(budget.id, {
      label: label.trim(),
      allocated: allocatedAmount,
      spent: spentAmount >= 0 ? spentAmount : 0,
    })
    return true
  }

  const saveLineItem = () => {
    if (addLine(lineDraft.label, lineDraft.allocated, lineDraft.spent)) {
      setLineOpen(false)
      setLineDraft(emptyLineDraft())
    }
  }

  const saveInlineLineItem = () => {
    if (addLine(inlineDraft.label, inlineDraft.allocated, inlineDraft.spent)) {
      setInlineDraft(emptyLineDraft())
    }
  }

  return (
    <>
      <TopBar
        title={budget.name}
        subtitle={`${budget.semester} · ${chapter.nickname}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canManage && (
              <button
                type="button"
                onClick={() => setLineOpen(true)}
                className="btn-primary gap-1.5 text-xs"
              >
                <Plus size={14} />
                Add line item
              </button>
            )}
            <Link
              to="/budgets"
              className="flex items-center gap-2 rounded-sm border border-[var(--rule)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-card)]"
            >
              <ArrowLeft size={16} />
              All budgets
            </Link>
          </div>
        }
      />

      <PageShell className="space-y-8">
        <section className="border border-[var(--rule)] p-5">
          <p className="text-sm leading-relaxed text-[var(--muted)]">{budget.description}</p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Created by {budget.createdBy} ·{' '}
            {new Date(budget.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </section>

        <div className="ledger-bar grid-cols-2 lg:grid-cols-3">
          <div className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight">${allocated.toLocaleString()}</p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Allocated
            </p>
          </div>
          <div className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight">${spent.toLocaleString()}</p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Spent
            </p>
          </div>
          <div className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight">${remaining.toLocaleString()}</p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Remaining
            </p>
          </div>
        </div>

        <section className="border border-[var(--rule)] bg-[var(--surface-card)] p-5">
          <div className="mb-4 border-b border-[var(--rule)] pb-2">
            <h2 className="font-serif text-xl tracking-tight">Allocation breakdown</h2>
          </div>
          <BudgetDonutChart lineItems={budget.lineItems} />
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--rule)] pb-2">
            <h2 className="font-serif text-xl tracking-tight">Line items</h2>
            {canManage && (
              <button type="button" onClick={() => setLineOpen(true)} className="btn-ghost text-xs">
                <Plus size={12} /> Add line
              </button>
            )}
          </div>

          <div className="border border-[var(--rule)]">
            <div className="grid grid-cols-[1fr_90px_90px_90px] border-b border-[var(--rule)] bg-[var(--primary)] px-3 py-2 text-[var(--primary-foreground)]">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Category</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Allocated</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Spent</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Left</span>
            </div>
            <ul>
              {budget.lineItems.length === 0 && (
                <li className="border-b border-[var(--rule)] px-4 py-8 text-center">
                  <p className="text-sm text-[var(--muted)]">No line items yet.</p>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setLineOpen(true)}
                      className="btn-primary mt-3 text-xs"
                    >
                      <Plus size={12} /> Add first line item
                    </button>
                  )}
                </li>
              )}
              {budget.lineItems.map((item) => {
                const left = item.allocated - item.spent
                return (
                  <li
                    key={item.id}
                    className="grid grid-cols-[1fr_90px_90px_90px] items-center border-b border-[var(--rule)] px-3 py-2.5 last:border-0"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm">{item.label}</span>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(budget.id, item.id)}
                          className="shrink-0 text-[var(--muted)] hover:text-red-600"
                          aria-label="Remove line item"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    {canManage ? (
                      <>
                        <input
                          type="number"
                          className="input-editorial w-full font-mono text-xs"
                          value={item.allocated}
                          onChange={(e) =>
                            updateLineItem(budget.id, item.id, {
                              allocated: Number(e.target.value),
                            })
                          }
                        />
                        <input
                          type="number"
                          className="input-editorial w-full font-mono text-xs"
                          value={item.spent}
                          onChange={(e) =>
                            updateLineItem(budget.id, item.id, { spent: Number(e.target.value) })
                          }
                        />
                      </>
                    ) : (
                      <>
                        <span className="metric text-sm">${item.allocated.toLocaleString()}</span>
                        <span className="metric text-sm">${item.spent.toLocaleString()}</span>
                      </>
                    )}
                    <span
                      className={`metric text-sm ${left < 0 ? 'text-red-700' : 'text-emerald-700'}`}
                    >
                      ${left.toLocaleString()}
                    </span>
                  </li>
                )
              })}
            </ul>
            {canManage && (
              <div className="grid grid-cols-[1fr_90px_90px_90px] items-center gap-2 border-t border-[var(--rule)] bg-[var(--surface-card)] px-3 py-3">
                <input
                  className="input-editorial text-sm"
                  placeholder="New category"
                  value={inlineDraft.label}
                  onChange={(e) => setInlineDraft({ ...inlineDraft, label: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && saveInlineLineItem()}
                />
                <input
                  type="number"
                  min={1}
                  className="input-editorial font-mono text-xs"
                  placeholder="Allocated"
                  value={inlineDraft.allocated}
                  onChange={(e) =>
                    setInlineDraft({ ...inlineDraft, allocated: Number(e.target.value) })
                  }
                  onKeyDown={(e) => e.key === 'Enter' && saveInlineLineItem()}
                />
                <input
                  type="number"
                  min={0}
                  className="input-editorial font-mono text-xs"
                  placeholder="Spent"
                  value={inlineDraft.spent}
                  onChange={(e) =>
                    setInlineDraft({ ...inlineDraft, spent: Number(e.target.value) })
                  }
                  onKeyDown={(e) => e.key === 'Enter' && saveInlineLineItem()}
                />
                <button
                  type="button"
                  onClick={saveInlineLineItem}
                  disabled={!inlineDraft.label.trim() || inlineDraft.allocated <= 0}
                  className="btn-primary text-[10px] disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </section>
      </PageShell>

      <Modal open={lineOpen} onClose={() => setLineOpen(false)} title="Add line item">
        <div className="space-y-3">
          <input
            className="input-editorial"
            placeholder="Category name"
            value={lineDraft.label}
            onChange={(e) => setLineDraft({ ...lineDraft, label: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Allocated</span>
              <input
                type="number"
                min={1}
                className="input-editorial mt-1 font-mono"
                value={lineDraft.allocated}
                onChange={(e) => setLineDraft({ ...lineDraft, allocated: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Spent</span>
              <input
                type="number"
                min={0}
                className="input-editorial mt-1 font-mono"
                value={lineDraft.spent}
                onChange={(e) => setLineDraft({ ...lineDraft, spent: Number(e.target.value) })}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={saveLineItem}
            disabled={!lineDraft.label.trim() || lineDraft.allocated <= 0}
            className="btn-primary w-full disabled:opacity-40"
          >
            Add line item
          </button>
        </div>
      </Modal>
    </>
  )
}
