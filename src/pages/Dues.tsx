import { useMemo, useState } from 'react'
import { ExternalLink, Plus } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import { useChapterOps } from '../context/ChapterOpsContext'
import { usePermissions } from '../context/AuthContext'
import { useMembers } from '../context/MembersContext'
import { parsePositiveAmount } from '../lib/formUtils'

export default function DuesPage() {
  const {
    duesCharges,
    duesPayments,
    billHighway,
    updateBillHighway,
    addDuesCharge,
    recordDuesPayment,
    memberDuesBalance,
  } = useChapterOps()
  const permissions = usePermissions()
  const { members, getMemberById } = useMembers()
  const isTreasurer = permissions.canAccessTreasurerSettings

  const [chargeOpen, setChargeOpen] = useState(false)
  const [payOpen, setPayOpen] = useState<{ chargeId: string; memberId: string } | null>(null)
  const [payAmount, setPayAmount] = useState(0)
  const [payError, setPayError] = useState('')
  const [chargeError, setChargeError] = useState('')
  const [draft, setDraft] = useState({
    label: '',
    amount: 100,
    dueDate: '2025-09-30',
    semester: 'Fall 2025',
  })

  const roster = useMemo(
    () =>
      members
        .filter((m) => m.status === 'Active' || m.status === 'New Member')
        .map((m) => ({
          member: m,
          balance: memberDuesBalance(m.id),
        }))
        .sort((a, b) => b.balance - a.balance),
    [memberDuesBalance, members]
  )

  const totals = useMemo(() => {
    const billed = duesCharges.reduce((s, c) => s + c.amount * (c.assignedMemberIds.length || roster.length), 0)
    const collected = duesPayments.reduce((s, p) => s + p.amountPaid, 0)
    const outstanding = roster.reduce((s, r) => s + r.balance, 0)
    return { billed, collected, outstanding }
  }, [duesCharges, duesPayments, roster])

  const createCharge = () => {
    setChargeError('')
    const label = draft.label.trim()
    const amount = parsePositiveAmount(draft.amount)
    if (!label) {
      setChargeError('Enter a label for this charge.')
      return
    }
    if (amount == null) {
      setChargeError('Enter an amount greater than zero.')
      return
    }
    addDuesCharge({
      label,
      amount,
      dueDate: draft.dueDate,
      semester: draft.semester.trim() || 'Current',
      assignedMemberIds: [],
    })
    setChargeOpen(false)
    setDraft({ label: '', amount: 100, dueDate: '2025-09-30', semester: 'Fall 2025' })
  }

  const applyPayment = () => {
    setPayError('')
    if (!payOpen) return
    const amount = parsePositiveAmount(payAmount)
    if (amount == null) {
      setPayError('Enter an amount greater than zero.')
      return
    }
    const balance = memberDuesBalance(payOpen.memberId)
    if (amount > balance) {
      setPayError(`Payment exceeds outstanding balance ($${balance.toLocaleString()}).`)
      return
    }
    recordDuesPayment(payOpen.chargeId, payOpen.memberId, amount, 'BillHighway')
    setPayOpen(null)
    setPayAmount(0)
  }

  const payHref = billHighway.enabled
    ? `${billHighway.payUrl}?chapter=${encodeURIComponent(billHighway.chapterCode)}`
    : null

  return (
    <>
      <TopBar
        title="Dues & BillHighway"
        subtitle="Assessments · balances · pay link"
        actions={
          isTreasurer ? (
            <button type="button" onClick={() => setChargeOpen(true)} className="btn-primary gap-1.5 text-xs">
              <Plus size={14} /> Add dues
            </button>
          ) : undefined
        }
      />

      <PageShell className="space-y-8">
        <div className="ledger-bar grid-cols-2 lg:grid-cols-4">
          <div className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight">${totals.collected.toLocaleString()}</p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Collected
            </p>
          </div>
          <div className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight">${totals.outstanding.toLocaleString()}</p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Outstanding
            </p>
          </div>
          <div className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight">{duesCharges.length}</p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Active charges
            </p>
          </div>
          <div className="ledger-cell">
            <p className="font-serif text-xl tracking-tight">
              {billHighway.enabled ? 'Live' : 'Off'}
            </p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              BillHighway
            </p>
          </div>
        </div>

        {/* BillHighway panel */}
        <section className="border border-[var(--rule)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl tracking-tight">BillHighway</h2>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Chapter code {billHighway.chapterCode}
                {billHighway.lastSyncedAt
                  ? ` · Synced ${new Date(billHighway.lastSyncedAt).toLocaleString()}`
                  : ''}
              </p>
            </div>
            {payHref && (
              <a
                href={payHref}
                target="_blank"
                rel="noreferrer"
                className="btn-primary gap-1.5 text-xs"
              >
                Pay dues <ExternalLink size={12} />
              </a>
            )}
          </div>

          {isTreasurer && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Pay URL</span>
                <input
                  className="input-editorial mt-1 font-mono text-xs"
                  value={billHighway.payUrl}
                  onChange={(e) => updateBillHighway({ payUrl: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Chapter code</span>
                <input
                  className="input-editorial mt-1 font-mono text-xs"
                  value={billHighway.chapterCode}
                  onChange={(e) => updateBillHighway({ chapterCode: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={billHighway.enabled}
                  onChange={(e) => updateBillHighway({ enabled: e.target.checked })}
                />
                Enable member pay link
              </label>
            </div>
          )}
        </section>

        {/* Charges */}
        <section>
          <div className="mb-3 border-b border-[var(--rule)] pb-2">
            <h2 className="font-serif text-xl tracking-tight">Charges</h2>
          </div>
          <ul className="list-editorial">
            {duesCharges.length === 0 ? (
              <li className="py-6 text-sm text-[var(--muted)]">
                No charges yet. Use the form above to create your first semester charge.
              </li>
            ) : (
              duesCharges.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{c.label}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      {c.semester} · Due {c.dueDate}
                    </p>
                  </div>
                  <span className="metric text-sm">${c.amount}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Member balances */}
        <section>
          <div className="mb-3 border-b border-[var(--rule)] pb-2">
            <h2 className="font-serif text-xl tracking-tight">Member balances</h2>
          </div>
          <div className="border border-[var(--rule)]">
            <div className="grid grid-cols-[1fr_80px_100px] border-b border-[var(--rule)] bg-[var(--primary)] px-3 py-2 text-[var(--primary-foreground)]">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Member</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Owed</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Action</span>
            </div>
            <ul>
              {roster.map(({ member, balance }) => (
                <li
                  key={member.id}
                  className="grid grid-cols-[1fr_80px_100px] items-center border-b border-[var(--rule)] px-3 py-2.5 last:border-0"
                >
                  <span className="truncate text-sm">
                    {member.firstName} {member.lastName}
                  </span>
                  <span className={`metric text-sm ${balance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                    ${balance}
                  </span>
                  <div className="flex gap-1">
                    {payHref && balance > 0 && (
                      <a
                        href={payHref}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[9px] uppercase tracking-wider text-[var(--primary)] underline"
                      >
                        Pay
                      </a>
                    )}
                    {isTreasurer && balance > 0 && (
                      <button
                        type="button"
                        className="font-mono text-[9px] uppercase tracking-wider text-[var(--muted)]"
                        onClick={() => {
                          const openCharge = duesCharges[0]
                          if (!openCharge) return
                          setPayOpen({ chargeId: openCharge.id, memberId: member.id })
                          setPayAmount(Math.min(balance, openCharge.amount))
                        }}
                      >
                        Record
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </PageShell>

      <Modal open={chargeOpen} onClose={() => setChargeOpen(false)} title="Add dues charge">
        <div className="space-y-3">
          <label className="block">
            <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Label *</span>
            <input
              className="input-editorial mt-1"
              placeholder="e.g. Spring 2026 Dues"
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Amount *</span>
              <input
                type="number"
                min={0.01}
                step={0.01}
                className="input-editorial mt-1 font-mono"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Due date</span>
              <input
                type="date"
                className="input-editorial mt-1 font-mono"
                value={draft.dueDate}
                onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
              />
            </label>
          </div>
          <label className="block">
            <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Semester</span>
            <input
              className="input-editorial mt-1"
              placeholder="Fall 2025"
              value={draft.semester}
              onChange={(e) => setDraft({ ...draft, semester: e.target.value })}
            />
          </label>
          {chargeError && <p className="text-xs text-red-600">{chargeError}</p>}
          <button type="button" onClick={createCharge} className="btn-primary w-full">
            Create charge
          </button>
        </div>
      </Modal>

      <Modal
        open={payOpen != null}
        onClose={() => {
          setPayOpen(null)
          setPayError('')
        }}
        title="Record payment"
      >
        <p className="mb-3 text-sm text-[var(--muted)]">
          {payOpen
            ? (() => {
                const m = getMemberById(payOpen.memberId)
                const bal = memberDuesBalance(payOpen.memberId)
                return m
                  ? `${m.firstName} ${m.lastName} · $${bal.toLocaleString()} outstanding`
                  : ''
              })()
            : ''}
        </p>
        <label className="block">
          <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Amount *</span>
          <input
            type="number"
            min={0.01}
            step={0.01}
            className="input-editorial mt-1 font-mono"
            value={payAmount}
            onChange={(e) => setPayAmount(Number(e.target.value))}
          />
        </label>
        {payError && <p className="mt-2 text-xs text-red-600">{payError}</p>}
        <button type="button" onClick={applyPayment} className="btn-primary mt-4 w-full">
          Apply payment
        </button>
      </Modal>
    </>
  )
}
