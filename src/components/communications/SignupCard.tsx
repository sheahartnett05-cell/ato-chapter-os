import { ClipboardList } from 'lucide-react'
import { useCommunications } from '../../context/CommunicationsContext'
import { getMember } from '../../data/mockData'
import type { Announcement } from '../../types/features'

export function SignupCard({
  post,
  memberId,
  compact = false,
}: {
  post: Announcement
  memberId: string
  compact?: boolean
}) {
  const { joinSignup, leaveSignup } = useCommunications()
  const signup = post.signup!

  return (
    <div className={compact ? '' : 'border border-[var(--rule)] bg-[var(--surface-card)] p-4'}>
      {!compact && (
        <div className="mb-3 flex items-center gap-2">
          <ClipboardList size={14} className="text-[var(--primary)]" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Sign-up
          </span>
        </div>
      )}
      <ul className={`space-y-2 ${compact ? 'mt-2' : 'mt-3'}`}>
        {signup.slots.map((slot) => {
          const joined = slot.memberIds.includes(memberId)
          const full = slot.memberIds.length >= slot.capacity
          return (
            <li
              key={slot.id}
              className="flex flex-wrap items-center justify-between gap-2 border border-[var(--rule)] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--ink)]">{slot.label}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  {slot.memberIds.length}/{slot.capacity} filled
                </p>
              </div>
              <button
                type="button"
                disabled={!joined && full}
                onClick={() =>
                  joined
                    ? leaveSignup(post.id, slot.id, memberId)
                    : joinSignup(post.id, slot.id, memberId)
                }
                className={`shrink-0 px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${
                  joined ? 'btn-ghost' : full ? 'opacity-40' : 'btn-primary'
                }`}
              >
                {joined ? 'Leave' : full ? 'Full' : 'Join'}
              </button>
            </li>
          )
        })}
      </ul>
      {!compact && signup.slots.some((s) => s.memberIds.length > 0) && (
        <div className="mt-3 border-t border-[var(--rule)] pt-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Signed up
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {signup.slots.flatMap((s) =>
              s.memberIds.map((mid) => {
                const m = getMember(mid)
                return (
                  <li
                    key={`${s.id}-${mid}`}
                    className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink)]"
                  >
                    {m ? `${m.firstName} ${m.lastName[0]}.` : mid}
                    <span className="text-[var(--muted)]"> · {s.label.split(' ')[0]}</span>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
