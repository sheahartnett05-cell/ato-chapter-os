import { useState } from 'react'
import { Copy, Plus } from 'lucide-react'
import { useMembers } from '../../context/MembersContext'
import { ONBOARDING_ROLES, roleLabel, type UserRole } from '../../types/permissions'

function usageLabel(usedCount: number, maxUses: number | null) {
  if (maxUses == null) return `${usedCount} joined · unlimited`
  return `${usedCount}/${maxUses} used`
}

export function InviteCodesPanel() {
  const { inviteCodes, createInvite, toggleInvite } = useMembers()
  const [role, setRole] = useState<UserRole>('ActiveMember')
  const [label, setLabel] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  const handleCreate = () => {
    // Unlimited uses — uniqueness is one account per email
    const invite = createInvite(role, label.trim() || roleLabel(role), null)
    setLabel('')
    copyCode(invite.code)
  }

  const active = inviteCodes.filter((i) => i.active)
  const inactive = inviteCodes.filter((i) => !i.active)

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
          Generate invite
        </p>
        <div className="space-y-3 border border-[var(--rule)] p-4">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Role
            </span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="input-editorial mt-1"
            >
              {ONBOARDING_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Label (optional)
            </span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Fall 2025 pledge class"
              className="input-editorial mt-1"
            />
          </label>
          <p className="text-xs text-[var(--muted)]">
            Codes are unlimited. Each email can only create one account.
          </p>
          <button type="button" onClick={handleCreate} className="btn-primary">
            <Plus size={14} /> Create code
          </button>
        </div>
      </div>

      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
          Active codes ({active.length})
        </p>
        <ul className="divide-y divide-[var(--rule)] border border-[var(--rule)]">
          {active.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-semibold tracking-wide">{inv.code}</p>
                <p className="text-xs text-[var(--muted)]">
                  {inv.label} · {roleLabel(inv.role)} · {usageLabel(inv.usedCount, inv.maxUses)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyCode(inv.code)}
                className="btn-ghost text-xs"
              >
                <Copy size={12} />
                {copied === inv.code ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={() => toggleInvite(inv.id)}
                className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] underline-offset-2 hover:underline"
              >
                Deactivate
              </button>
            </li>
          ))}
          {active.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-[var(--muted)]">No active codes</li>
          )}
        </ul>
      </div>

      {inactive.length > 0 && (
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Inactive ({inactive.length})
          </p>
          <ul className="divide-y divide-[var(--rule)] border border-[var(--rule)] opacity-60">
            {inactive.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-mono text-sm">{inv.code}</p>
                  <p className="text-xs text-[var(--muted)]">{roleLabel(inv.role)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleInvite(inv.id)}
                  className="font-mono text-[10px] uppercase tracking-wider underline-offset-2 hover:underline"
                >
                  Reactivate
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
        Demo codes: CHAPTER-FOUNDER · CHAPTER-MEMBER · CHAPTER-TREASURER
      </p>
    </div>
  )
}
