import { useMemo, useState } from 'react'
import { BarChart3, Check } from 'lucide-react'
import { useCommunications } from '../../context/CommunicationsContext'
import type { Announcement } from '../../types/features'

export function PollCard({
  post,
  memberId,
  compact = false,
}: {
  post: Announcement
  memberId: string
  compact?: boolean
}) {
  const { votePoll, getMemberPollVotes, pollOpen } = useCommunications()
  const poll = post.poll!
  const myVotes = getMemberPollVotes(post.id, memberId)
  const [pending, setPending] = useState<string[]>(myVotes)
  const open = pollOpen(post)

  const totalVotes = useMemo(
    () => poll.options.reduce((s, o) => s + o.voteCount, 0),
    [poll.options]
  )

  const submit = () => {
    if (!pending.length || !open) return
    votePoll(post.id, memberId, pending)
  }

  const toggle = (optionId: string) => {
    if (!open) return
    if (poll.allowMultiple) {
      setPending((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      )
    } else {
      setPending([optionId])
      votePoll(post.id, memberId, [optionId])
    }
  }

  return (
    <div className={compact ? '' : 'border border-[var(--rule)] bg-[var(--surface-card)] p-4'}>
      {!compact && (
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 size={14} className="text-[var(--primary)]" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Poll {open ? '· Open' : '· Closed'}
          </span>
        </div>
      )}
      <p className={`font-medium text-[var(--ink)] ${compact ? 'text-sm' : 'text-base'}`}>
        {poll.question}
      </p>
      <ul className={`space-y-2 ${compact ? 'mt-2' : 'mt-4'}`}>
        {poll.options.map((opt) => {
          const pct = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0
          const selected = (myVotes.length ? myVotes : pending).includes(opt.id)
          return (
            <li key={opt.id}>
              <button
                type="button"
                disabled={!open}
                onClick={() => toggle(opt.id)}
                className={`relative w-full overflow-hidden border px-3 py-2.5 text-left transition ${
                  selected
                    ? 'border-[var(--primary)] bg-[var(--primary-subtle)]'
                    : 'border-[var(--rule)] hover:border-[var(--ink)]'
                } ${!open ? 'cursor-default opacity-80' : ''}`}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-[var(--primary)] opacity-[0.08]"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--ink)]">{opt.label}</span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--muted)]">
                    {selected && <Check size={12} className="text-[var(--primary)]" />}
                    {pct}% · {opt.voteCount}
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
      {poll.allowMultiple && open && (
        <button type="button" onClick={submit} className="btn-primary mt-3 w-full text-xs">
          Submit vote
        </button>
      )}
      {poll.closesAt && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
          Closes {new Date(poll.closesAt + 'T12:00:00').toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
