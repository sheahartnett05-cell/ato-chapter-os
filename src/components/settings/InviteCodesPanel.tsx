import { useEffect, useState } from 'react'
import { Copy, Link2, Plus } from 'lucide-react'
import { useMembers } from '../../context/MembersContext'
import { buildJoinLink } from '../../lib/joinLinks'

function usageLabel(usedCount: number, maxUses: number | null) {
  if (maxUses == null) return `${usedCount} joined · unlimited`
  return `${usedCount}/${maxUses} used`
}

export function InviteCodesPanel() {
  const {
    inviteCodes,
    createInvite,
    toggleInvite,
    primaryJoinCode,
    ensurePrimaryJoinCode,
    chapterLock,
  } = useMembers()
  const [label, setLabel] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (chapterLock) ensurePrimaryJoinCode()
  }, [chapterLock, ensurePrimaryJoinCode])

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  const copyCode = (code: string) => copyText(code, code)
  const copyLink = (code: string) => copyText(buildJoinLink(code), `link:${code}`)

  const handleCreate = () => {
    const invite = createInvite(label.trim() || 'Extra join code')
    setLabel('')
    copyLink(invite.code)
  }

  const active = inviteCodes.filter(
    (i) => i.active && i.id !== primaryJoinCode?.id && i.code.toUpperCase() !== 'CHAPTER-FOUNDER'
  )
  const inactive = inviteCodes.filter((i) => !i.active)

  return (
    <div className="space-y-6">
      {chapterLock && (
        <div className="space-y-3 border border-[var(--rule)] bg-[var(--primary-subtle)] p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Chapter join code
          </p>
          {primaryJoinCode ? (
            <>
              <p className="font-mono text-xl font-semibold tracking-wider text-[var(--ink)]">
                {primaryJoinCode.code}
              </p>
              <p className="break-all font-mono text-xs text-[var(--muted)]">
                {buildJoinLink(primaryJoinCode.code)}
              </p>
              <p className="text-xs text-[var(--muted)]">
                Share the link or code with members — they join as Active Member; assign officer
                roles in Chapter Setup.
              </p>
              <p className="text-xs text-[var(--muted)]">
                {usageLabel(primaryJoinCode.usedCount, primaryJoinCode.maxUses)}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyLink(primaryJoinCode.code)}
                  className="btn-primary"
                >
                  <Link2 size={14} />
                  {copied === `link:${primaryJoinCode.code}` ? 'Copied link' : 'Copy invite link'}
                </button>
                <button
                  type="button"
                  onClick={() => copyCode(primaryJoinCode.code)}
                  className="btn-ghost"
                >
                  <Copy size={14} />
                  {copied === primaryJoinCode.code ? 'Copied code' : 'Copy code only'}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">Generating join code…</p>
          )}
        </div>
      )}

      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
          Extra codes (optional)
        </p>
        <div className="space-y-3 border border-[var(--rule)] p-4">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Label (optional)
            </span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Recruitment weekend"
              className="input-editorial mt-1"
            />
          </label>
          <button type="button" onClick={handleCreate} className="btn-ghost text-xs">
            <Plus size={14} /> Create extra code
          </button>
        </div>
      </div>

      {active.length > 0 && (
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Other active ({active.length})
          </p>
          <ul className="divide-y divide-[var(--rule)] border border-[var(--rule)]">
            {active.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold tracking-wide">{inv.code}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {inv.label} · {usageLabel(inv.usedCount, inv.maxUses)}
                  </p>
                  <p className="mt-1 break-all font-mono text-[10px] text-[var(--muted)]">
                    {buildJoinLink(inv.code)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyLink(inv.code)}
                  className="btn-ghost text-xs"
                >
                  <Link2 size={12} />
                  {copied === `link:${inv.code}` ? 'Copied' : 'Link'}
                </button>
                <button
                  type="button"
                  onClick={() => copyCode(inv.code)}
                  className="btn-ghost text-xs"
                >
                  <Copy size={12} />
                  {copied === inv.code ? 'Copied' : 'Code'}
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
          </ul>
        </div>
      )}

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
                  <p className="text-xs text-[var(--muted)]">{inv.label}</p>
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

      {!chapterLock && (
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
          Found a chapter with CHAPTER-FOUNDER — your join code is created automatically.
        </p>
      )}
    </div>
  )
}
