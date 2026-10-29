import type { PipelineStage, Prospect, ProspectBid } from '../../types'
import { addDays, localTodayIso } from '../demoRelativeDates'
import {
  ensureProspectOnRoster,
  type PromoteProspectFn,
  type RosterMemberLookup,
} from './promotion'

export type StageTransitionDeps = {
  roster: RosterMemberLookup[]
  promote: PromoteProspectFn
  /** Pledge class label for new roster rows (cycle label). */
  pledgeClass?: string
  /** Default bid deadline when moving to Bid (cycle.bidDay or today+3). */
  bidDeadline?: string
  today?: string
}

export type StageTransitionResult =
  | { ok: true; patch: Partial<Prospect> }
  | { ok: false; error: string }

function defaultBid(today: string, deadline?: string): ProspectBid {
  return {
    extendedAt: today,
    deadline: deadline ?? addDays(today, 3),
    response: 'pending',
  }
}

/**
 * Single stage-transition helper used by drag, card "Move to…", and profile stage select.
 * Batches status + bid + rosterMemberId into one patch (avoids stale-closure double writes).
 */
export function transitionProspectStage(
  prospect: Prospect,
  newStage: PipelineStage,
  deps: StageTransitionDeps
): StageTransitionResult {
  if (prospect.status === newStage) {
    return { ok: true, patch: {} }
  }

  const today = deps.today ?? localTodayIso()
  const patch: Partial<Prospect> = { status: newStage }

  if (newStage === 'Bid') {
    if (!prospect.bid) {
      patch.bid = defaultBid(today, deps.bidDeadline)
    } else if (prospect.bid.response === 'declined' || prospect.bid.response === 'accepted') {
      patch.bid = {
        ...prospect.bid,
        extendedAt: today,
        deadline: deps.bidDeadline ?? prospect.bid.deadline ?? addDays(today, 3),
        response: 'pending',
        respondedAt: undefined,
      }
    }
  }

  if (newStage === 'Accepted' || newStage === 'New Member') {
    const linked = ensureProspectOnRoster(prospect, deps.roster, deps.promote, deps.pledgeClass)
    if (!linked.ok) return linked
    patch.rosterMemberId = linked.rosterMemberId
    if (prospect.bid) {
      patch.bid = {
        ...prospect.bid,
        response: 'accepted',
        respondedAt: prospect.bid.respondedAt ?? today,
      }
    } else if (newStage === 'Accepted') {
      patch.bid = {
        extendedAt: today,
        deadline: deps.bidDeadline,
        response: 'accepted',
        respondedAt: today,
      }
    }
  }

  return { ok: true, patch }
}

/** Set bid response; accepting runs the same Accepted promotion path. */
export function applyBidResponse(
  prospect: Prospect,
  response: 'accepted' | 'declined',
  deps: StageTransitionDeps
): StageTransitionResult {
  const today = deps.today ?? localTodayIso()
  const baseBid: ProspectBid = prospect.bid ?? defaultBid(today, deps.bidDeadline)

  if (response === 'declined') {
    return {
      ok: true,
      patch: {
        bid: { ...baseBid, response: 'declined', respondedAt: today },
        // Keep stage as Bid (or prior) so they remain visible with a Declined badge
        status: prospect.status === 'Accepted' || prospect.status === 'New Member' ? 'Bid' : prospect.status,
      },
    }
  }

  return transitionProspectStage(prospect, 'Accepted', deps)
}
