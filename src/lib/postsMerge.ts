/** Union chapter posts by id so cloud LWW sync cannot drop another member's announcement. */

import type { Announcement } from '../types/features'

function engagementScore(p: Announcement): number {
  let s = 0
  if (p.pinned) s += 5
  if (p.poll?.voterIds) s += Object.keys(p.poll.voterIds).length * 10
  if (p.poll?.options) {
    s += p.poll.options.reduce((n, o) => n + (o.voteCount || 0), 0)
  }
  if (p.signup?.slots) {
    s += p.signup.slots.reduce((n, slot) => n + (slot.memberIds?.length ?? 0), 0)
  }
  s += Math.min(40, (p.body?.trim().length ?? 0) / 20)
  s += Math.min(20, (p.title?.trim().length ?? 0) / 10)
  return s
}

function preferPost(a: Announcement, b: Announcement): Announcement {
  const sa = engagementScore(a)
  const sb = engagementScore(b)
  if (sb !== sa) return sb > sa ? b : a
  // Same engagement — keep newer createdAt (edits usually rewrite the blob with same id).
  return (b.createdAt || '') >= (a.createdAt || '') ? b : a
}

export function mergePostsLists(a: Announcement[], b: Announcement[]): Announcement[] {
  const map = new Map<string, Announcement>()
  for (const post of [...a, ...b]) {
    if (!post?.id) continue
    const prev = map.get(post.id)
    if (!prev) {
      map.set(post.id, post)
      continue
    }
    map.set(post.id, preferPost(prev, post))
  }
  return [...map.values()].sort((x, y) => (y.createdAt || '').localeCompare(x.createdAt || ''))
}
