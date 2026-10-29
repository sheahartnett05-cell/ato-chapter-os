/**
 * Supabase chapter cloud sync via chapter_kv (+ chapters row).
 * Requires Supabase Auth + chapter_memberships (RLS).
 */
import { getNationalOrgById } from '../data/nationalOrgs'
import type { UserRole } from '../types/permissions'
import { fetchUserChapterId } from './supabaseAuth'
import { getSupabaseUser } from './supabaseSession'
import { getSupabase, isSupabaseConfigured } from './supabase'
import { STORAGE_KEYS } from './demoSeed'
import type { ChapterLock } from '../types/memberAccount'
import { rpcCreateChapter, rpcJoinChapter } from './cloudIdentity'
import {
  CLOUD_CHAPTER_ID_KEY,
  getCachedCloudChapterId,
  setCachedCloudChapterId,
} from './cloudChapterId'

export { CLOUD_CHAPTER_ID_KEY, getCachedCloudChapterId, setCachedCloudChapterId }

export const CLOUD_SYNC_KEYS: string[] = [
  ...Object.values(STORAGE_KEYS).filter((k) => k !== STORAGE_KEYS.demoSeeded),
  'chapter-os-onboarding',
  'chapter-os-selected-org',
  'chapter-os-chapter-lock',
  'chapter-os-invite-codes',
  'chapter-os-member-accounts',
  'chapter-os-roster-members',
]

const pending = new Map<string, unknown>()
let flushTimer: ReturnType<typeof setTimeout> | null = null
let flushing = false

function readLock(): ChapterLock | null {
  try {
    const raw = localStorage.getItem('chapter-os-chapter-lock')
    if (!raw) return null
    return JSON.parse(raw) as ChapterLock
  } catch {
    return null
  }
}

function readMeta(): { chapterDesignation?: string; university?: string; semester?: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.chapterMeta)
    if (!raw) return {}
    return JSON.parse(raw) as { chapterDesignation?: string; university?: string; semester?: string }
  } catch {
    return {}
  }
}

function readOrgId(): string | null {
  try {
    return localStorage.getItem('chapter-os-selected-org')
  } catch {
    return null
  }
}

function chapterIdentity(): {
  orgId: string | null
  designation: string
  university: string
} {
  const lock = readLock()
  const meta = readMeta()
  return {
    orgId: lock?.orgId ?? readOrgId(),
    designation: lock?.chapterDesignation ?? meta.chapterDesignation ?? '',
    university: lock?.university ?? meta.university ?? '',
  }
}

/** True when user is signed in and can sync to cloud. */
export function canSyncToCloud(): boolean {
  return isSupabaseConfigured() && Boolean(getSupabaseUser())
}

/**
 * Resolve the caller's existing cloud chapter only.
 * Does not create chapters or insert memberships (Phase A: RPC-only).
 */
export async function ensureCloudChapter(_options?: {
  appMemberId?: string
  role?: UserRole
  isFounder?: boolean
  allowCreate?: boolean
}): Promise<string | null> {
  if (!canSyncToCloud()) return null
  const sb = getSupabase()
  if (!sb) return null

  const membershipChapter = await fetchUserChapterId()
  if (membershipChapter) {
    setCachedCloudChapterId(membershipChapter)
    return membershipChapter
  }

  const cached = getCachedCloudChapterId()
  if (cached) {
    const { data } = await sb.from('chapters').select('id').eq('id', cached).maybeSingle()
    if (data?.id) return data.id
    setCachedCloudChapterId(null)
  }

  return null
}

/** Founder onboarding: create_chapter RPC then push local blobs. */
export async function bootstrapChapterCloud(input: {
  appMemberId: string
  role: UserRole
  isFounder: boolean
  joinCode?: string
  profile?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
  }
}): Promise<{ ok: boolean; error?: string; chapterId?: string }> {
  if (!canSyncToCloud()) return { ok: false, error: 'Not signed in' }

  const existing = await fetchUserChapterId()
  if (existing) {
    setCachedCloudChapterId(existing)
    if (input.isFounder) {
      await pushLocalChapterToCloud()
      const { publishInviteCodesToCloud } = await import('./joinCodes')
      await publishInviteCodesToCloud()
    } else {
      await hydrateFromCloud()
    }
    return { ok: true, chapterId: existing }
  }

  if (input.isFounder) {
    const { orgId, designation, university } = chapterIdentity()
    if (!orgId || !designation || !university) {
      return { ok: false, error: 'Chapter identity incomplete' }
    }
    const org = getNationalOrgById(orgId)
    const meta = readMeta()
    const created = await rpcCreateChapter({
      orgId,
      designation,
      university,
      orgName: org?.orgName,
      nickname: org?.nickname,
      letters: org?.letters,
      semester: meta.semester,
      primaryColor: org?.primaryColor,
      secondaryColor: org?.secondaryColor,
      accentColor: org?.accentColor,
      appMemberId: input.appMemberId,
      firstName: input.profile?.firstName,
      lastName: input.profile?.lastName,
      email: input.profile?.email,
      phone: input.profile?.phone,
    })
    if (!created.ok) return { ok: false, error: created.error }
    await pushLocalChapterToCloud()
    const { publishInviteCodesToCloud } = await import('./joinCodes')
    const published = await publishInviteCodesToCloud()
    if (!published.ok) {
      console.warn('[agora cloud] publish join codes after bootstrap', published.error)
    }
    return { ok: true, chapterId: created.chapterId }
  }

  if (!input.joinCode) {
    return { ok: false, error: 'Join code required' }
  }
  const joined = await rpcJoinChapter({
    code: input.joinCode,
    appMemberId: input.appMemberId,
    firstName: input.profile?.firstName,
    lastName: input.profile?.lastName,
    email: input.profile?.email,
    phone: input.profile?.phone,
  })
  if (!joined.ok) return { ok: false, error: joined.error }
  await hydrateFromCloud()
  return { ok: true, chapterId: joined.chapterId }
}

/** Leave cloud memberships + clear local chapter data (dev / recovery). */
export async function wipeLocalAndLeaveCloudChapters(): Promise<void> {
  const sb = getSupabase()
  if (sb && getSupabaseUser()) {
    const { error } = await sb.rpc('leave_all_chapters')
    if (error) console.warn('[agora cloud] leave_all_chapters', error.message)
  }
  setCachedCloudChapterId(null)
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith('chapter-os-') || k.startsWith('sb-'))) keys.push(k)
    }
    for (const k of keys) {
      // Keep supabase auth session so user can re-onboard without re-OTP if desired
      if (k.startsWith('sb-')) continue
      localStorage.removeItem(k)
    }
  } catch {
    /* ignore */
  }
}

export function queueChapterKvWrite(key: string, value: unknown) {
  if (!canSyncToCloud()) return
  if (!CLOUD_SYNC_KEYS.includes(key) && !key.startsWith('chapter-os-')) return
  if (key === STORAGE_KEYS.demoSeeded || key === 'chapter-os-guest-preview') return
  if (key === 'chapter-os-user-id') return
  if (key === CLOUD_CHAPTER_ID_KEY) return

  pending.set(key, value)
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => {
    void flushChapterKvQueue()
  }, 400)
}

export async function flushChapterKvQueue(): Promise<void> {
  if (flushing || pending.size === 0) return
  if (!canSyncToCloud()) return
  const sb = getSupabase()
  if (!sb) return

  flushing = true
  try {
    const chapterId = (await ensureCloudChapter()) ?? getCachedCloudChapterId()
    if (!chapterId) return

    const batch = [...pending.entries()]
    pending.clear()

    const rows = batch.map(([key, value]) => ({
      chapter_id: chapterId,
      key,
      value: (value === undefined ? null : value) as import('./database.types').Json,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await sb.from('chapter_kv').upsert(rows, { onConflict: 'chapter_id,key' })
    if (error) {
      console.warn('[agora cloud] kv upsert failed', error.message)
      for (const [k, v] of batch) pending.set(k, v)
    }
  } finally {
    flushing = false
    if (pending.size > 0) {
      flushTimer = setTimeout(() => {
        void flushChapterKvQueue()
      }, 800)
    }
  }
}

export async function hydrateFromCloud(): Promise<{ ok: boolean; keys: number; error?: string }> {
  if (!canSyncToCloud()) return { ok: true, keys: 0 }
  const sb = getSupabase()
  if (!sb) return { ok: false, keys: 0, error: 'no client' }

  const chapterId = await fetchUserChapterId()
  if (!chapterId) {
    return { ok: true, keys: 0 }
  }
  setCachedCloudChapterId(chapterId)

  const { data, error } = await sb.from('chapter_kv').select('key, value').eq('chapter_id', chapterId)
  if (error) return { ok: false, keys: 0, error: error.message }

  let n = 0
  for (const row of data ?? []) {
    if (!row.key || row.key === STORAGE_KEYS.demoSeeded) continue
    try {
      if (row.value === null) {
        localStorage.removeItem(row.key)
      } else {
        localStorage.setItem(row.key, JSON.stringify(row.value))
      }
      n++
    } catch {
      /* ignore */
    }
  }
  return { ok: true, keys: n }
}

export async function pushLocalChapterToCloud(): Promise<void> {
  if (!canSyncToCloud()) return
  const chapterId = await ensureCloudChapter()
  if (!chapterId) return

  for (const key of CLOUD_SYNC_KEYS) {
    try {
      const raw = localStorage.getItem(key)
      if (raw == null) continue
      pending.set(key, JSON.parse(raw))
    } catch {
      /* ignore */
    }
  }
  await flushChapterKvQueue()
}

export function cloudSyncEnabled(): boolean {
  return isSupabaseConfigured()
}
