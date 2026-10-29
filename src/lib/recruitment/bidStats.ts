import type { Prospect } from '../../types'
import { localTodayIso } from '../demoRelativeDates'

export type BidStats = {
  extended: number
  pending: number
  accepted: number
  declined: number
  overduePending: number
}

/** Summarize bid tracker for active-cycle (non-archived) prospects. */
export function computeBidStats(prospects: Prospect[], today = localTodayIso()): BidStats {
  const withBid = prospects.filter((p) => p.bid && !p.archived)
  let pending = 0
  let accepted = 0
  let declined = 0
  let overduePending = 0

  for (const p of withBid) {
    const response = p.bid!.response
    if (response === 'pending') {
      pending++
      if (p.bid!.deadline && p.bid!.deadline < today) overduePending++
    } else if (response === 'accepted') {
      accepted++
    } else if (response === 'declined') {
      declined++
    }
  }

  return {
    extended: withBid.length,
    pending,
    accepted,
    declined,
    overduePending,
  }
}
