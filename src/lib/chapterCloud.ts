/**
 * Supabase chapter cloud sync via chapter_kv (+ chapters row).
 * Requires Supabase Auth + chapter_memberships (RLS).
 */
import { getNationalOrgById } from '../data/nationalOrgs'
import type { UserRole } from '../types/permissions'
import {
  fetchUserChapterId,
  getAuthUserId,
  linkChapterMembership,
} from './supabaseAuth'
import { getSupabaseUser } from './supabaseSession'
import { getSupabase, isSupabaseConfigured } from './supabase'
import { STORAGE_KEYS } from './demoSeed'
import type { ChapterLock } from '../types/memberAccount'

export const CLOUD_CHAPTER_ID_KEY = 'chapter-os-supabase-chapter-id'

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
let chapterIdCache: string | null = null
let flushing = false

export function getCachedCloudChapterId(): string | null {
  if (chapterIdCache) return chapterIdCache
  try {
    chapterIdCache = localStorage.getItem(CLOUD_CHAPTER_ID_KEY)
  } catch {
    chapterIdCache = null
  }
  return chapterIdCache
}

export function setCachedCloudChapterId(id: string | null) {
  chapterIdCache = id
  try {
    if (id) localStorage.setItem(CLOUD_CHAPTER_ID_KEY, id)
    else localStorage.removeItem(CLOUD_CHAPTER_ID_KEY)
  } catch {
    /* ignore */
  }
}

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

async function findChapterByIdentity(
  orgId: string,
  designation: string,
  university: string
): Promise<string | null> {
  const sb = getSupabase()
  if (!sb) return null

  let q = sb.from('chapters').select('id').eq('org_id', orgId)
  if (designation) q = q.eq('chapter_designation', designation)
  if (university) q = q.eq('university', university)
  const { data } = await q.limit(1).maybeSingle()
  return data?.id ?? null
}

async function createChapterRow(
  orgId: string,
  designation: string,
  university: string
): Promise<string | null> {
  const sb = getSupabase()
  const userId = getAuthUserId()
  if (!sb || !userId) return null

  const org = getNationalOrgById(orgId)
  const meta = readMeta()

  const { data, error } = await sb
    .from('chapters')
    .insert({
      org_id: orgId,
      org_name: org?.orgName ?? orgId,
      nickname: org?.nickname ?? null,
      letters: org?.letters ?? null,
      chapter_designation: designation,
      university,
      semester: meta.semester ?? '',
      primary_color: org?.primaryColor ?? null,
      secondary_color: org?.secondaryColor ?? null,
      accent_color: org?.accentColor ?? null,
      founded_by: userId,
    })
    .select('id')
    .single()

  if (error) {
    // Unique org+campus+designation — re-find (may be visible via founded_by policy)
    const existing = await findChapterByIdentity(orgId, designation, university)
    if (existing) return existing
    console.warn('[agora cloud] create chapter failed', error.message)
    return null
  }
  return data?.id ?? null
}

/** Prefer RPC that claims/creates under security definer (avoids RLS + unique races). */
async function claimOrCreateChapterRpc(input: {
  orgId: string
  designation: string
  university: string
  appMemberId?: string
  role?: UserRole
  isFounder?: boolean
}): Promise<string | null> {
  const sb = getSupabase()
  if (!sb) return null
  const org = getNationalOrgById(input.orgId)
  const meta = readMeta()

  const { data, error } = await sb.rpc('claim_or_create_chapter', {
    p_org_id: input.orgId,
    p_designation: input.designation,
    p_university: input.university,
    p_org_name: org?.orgName ?? input.orgId,
    p_nickname: org?.nickname ?? null,
    p_letters: org?.letters ?? null,
    p_semester: meta.semester ?? '',
    p_primary_color: org?.primaryColor ?? null,
    p_secondary_color: org?.secondaryColor ?? null,
    p_accent_color: org?.accentColor ?? null,
    p_app_member_id: input.appMemberId ?? null,
    p_role: input.role ?? 'President',
    p_is_founder: input.isFounder ?? true,
  })

  if (error) {
    console.warn('[agora cloud] claim_or_create_chapter failed', error.message)
    return null
  }
  return typeof data === 'string' ? data : null
}

/**
 * Resolve or create cloud chapter. Optionally link membership (onboarding).
 */
export async function ensureCloudChapter(options?: {
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
    if (options?.appMemberId && options.role) {
      await linkChapterMembership({
        chapterId: membershipChapter,
        appMemberId: options.appMemberId,
        role: options.role,
        isFounder: options.isFounder,
      })
    }
    return membershipChapter
  }

  const cached = getCachedCloudChapterId()
  if (cached) {
    const { data } = await sb.from('chapters').select('id').eq('id', cached).maybeSingle()
    if (data?.id) {
      if (options?.appMemberId && options.role) {
        await linkChapterMembership({
          chapterId: data.id,
          appMemberId: options.appMemberId,
          role: options.role,
          isFounder: options.isFounder,
        })
      }
      return data.id
    }
    setCachedCloudChapterId(null)
  }

  const { orgId, designation, university } = chapterIdentity()
  if (!orgId) return null

  if (designation && university) {
    const claimed = await claimOrCreateChapterRpc({
      orgId,
      designation,
      university,
      appMemberId: options?.appMemberId,
      role: options?.role,
      isFounder: options?.isFounder ?? false,
    })
    if (claimed) {
      setCachedCloudChapterId(claimed)
      return claimed
    }
  }

  let chapterId = await findChapterByIdentity(orgId, designation, university)

  if (!chapterId && options?.allowCreate && designation && university) {
    chapterId = await createChapterRow(orgId, designation, university)
  }

  if (!chapterId) return null

  if (options?.appMemberId && options.role) {
    const linked = await linkChapterMembership({
      chapterId,
      appMemberId: options.appMemberId,
      role: options.role,
      isFounder: options.isFounder,
    })
    if (!linked.ok) {
      console.warn('[agora cloud] membership link failed', linked.error)
      return null
    }
  }

  setCachedCloudChapterId(chapterId)
  return chapterId
}

/** After onboarding / chapter lock — link user and push all local keys. */
export async function bootstrapChapterCloud(input: {
  appMemberId: string
  role: UserRole
  isFounder: boolean
}): Promise<{ ok: boolean; error?: string }> {
  const chapterId = await ensureCloudChapter({
    appMemberId: input.appMemberId,
    role: input.role,
    isFounder: input.isFounder,
    allowCreate: input.isFounder,
  })
  if (!chapterId) {
    return { ok: false, error: 'Could not link chapter to cloud' }
  }
  if (input.isFounder) {
    await pushLocalChapterToCloud()
    const { publishInviteCodesToCloud } = await import('./joinCodes')
    const published = await publishInviteCodesToCloud()
    if (!published.ok) {
      console.warn('[agora cloud] publish join codes after bootstrap', published.error)
    }
  } else {
    await hydrateFromCloud()
  }
  return { ok: true }
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
