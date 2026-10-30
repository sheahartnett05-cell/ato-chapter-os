/**
 * Join-code registry so invite codes resolve even when chapter blobs
 * are not yet on this device (and via Supabase for cross-device joins).
 */
import type { InviteCode } from '../types/memberAccount'
import type { UserRole } from '../types/permissions'
import { STORAGE_KEYS } from './demoSeed'
import { readJson, writeJson } from './persist'
import { getSupabase, isSupabaseConfigured } from './supabase'
import {
  canSyncToCloud,
  ensureCloudChapter,
  getCachedCloudChapterId,
  setCachedCloudChapterId,
} from './chapterCloud'

const REGISTRY_KEY = STORAGE_KEYS.joinRegistry
const INVITES_KEY = 'chapter-os-invite-codes'

export type JoinRegistryEntry = {
  inviteId: string
  code: string
  label: string
  role: UserRole
  active: boolean
  maxUses: number | null
  usedCount: number
  isPrimary?: boolean
  chapterDesignation?: string
  university?: string
  orgId?: string
  cloudChapterId?: string
}

type JoinRegistry = Record<string, JoinRegistryEntry>

function readRegistry(): JoinRegistry {
  const parsed = readJson<JoinRegistry | null>(REGISTRY_KEY, null)
  return parsed && typeof parsed === 'object' ? parsed : {}
}

function writeRegistry(reg: JoinRegistry) {
  writeJson(REGISTRY_KEY, reg)
}

export function publishJoinCode(
  invite: InviteCode,
  meta?: {
    chapterDesignation?: string
    university?: string
    orgId?: string
    cloudChapterId?: string
  }
) {
  const key = invite.code.trim().toUpperCase()
  if (!key || key === 'CHAPTER-FOUNDER') return
  const reg = readRegistry()
  const prev = reg[key]
  reg[key] = {
    inviteId: invite.id,
    code: invite.code.trim().toUpperCase(),
    label: invite.label,
    role: 'ActiveMember',
    active: invite.active,
    maxUses: invite.maxUses,
    usedCount: invite.usedCount,
    isPrimary: invite.isPrimary,
    chapterDesignation: meta?.chapterDesignation ?? prev?.chapterDesignation,
    university: meta?.university ?? prev?.university,
    orgId: meta?.orgId ?? prev?.orgId,
    cloudChapterId: meta?.cloudChapterId ?? getCachedCloudChapterId() ?? prev?.cloudChapterId,
  }
  writeRegistry(reg)
}

export function deactivateJoinCode(code: string) {
  const key = code.trim().toUpperCase()
  const reg = readRegistry()
  if (!reg[key]) return
  reg[key] = { ...reg[key], active: false }
  writeRegistry(reg)
}

export function bumpJoinCodeUse(code: string) {
  const key = code.trim().toUpperCase()
  const reg = readRegistry()
  if (!reg[key]) return
  reg[key] = { ...reg[key], usedCount: (reg[key].usedCount ?? 0) + 1 }
  writeRegistry(reg)
}

function entryToInvite(entry: JoinRegistryEntry): InviteCode {
  return {
    id: entry.inviteId,
    code: entry.code,
    label: entry.label,
    role: entry.role,
    createdBy: 'registry',
    createdAt: new Date().toISOString(),
    maxUses: entry.maxUses,
    usedCount: entry.usedCount,
    active: entry.active,
    isPrimary: entry.isPrimary,
  }
}

export type ResolvedJoinCode = {
  invite: InviteCode
  cloudChapterId?: string
  orgId?: string
  chapterDesignation?: string
  university?: string
  source: 'local' | 'registry' | 'cloud'
}

/** Look up a join/founder code locally then in Supabase. */
export async function resolveJoinCode(raw: string): Promise<ResolvedJoinCode | null> {
  const normalized = raw.trim().toUpperCase()
  if (!normalized) return null

  if (normalized === 'CHAPTER-FOUNDER') {
    return {
      invite: {
        id: 'inv-chapter-founder',
        code: 'CHAPTER-FOUNDER',
        label: 'Founding President (one-time)',
        role: 'President',
        createdBy: 'system',
        createdAt: '2025-08-01T00:00:00',
        maxUses: 1,
        usedCount: 0,
        active: true,
      },
      source: 'local',
    }
  }

  const reg = readRegistry()[normalized]
  if (reg?.active) {
    return {
      invite: entryToInvite(reg),
      cloudChapterId: reg.cloudChapterId,
      orgId: reg.orgId,
      chapterDesignation: reg.chapterDesignation,
      university: reg.university,
      source: 'registry',
    }
  }

  if (!isSupabaseConfigured()) return null
  const sb = getSupabase()
  if (!sb) return null

  const { data, error } = await sb.rpc('resolve_join_code', { p_code: normalized })
  if (error || !data) return null

  const payload = data as {
    code?: string
    role?: string
    label?: string
    chapter_id?: string
    org_id?: string
    chapter_designation?: string
    university?: string
    invite_id?: string
    used_count?: number
    max_uses?: number | null
  }

  if (!payload.code) return null
  if (payload.chapter_id) setCachedCloudChapterId(payload.chapter_id)

  const invite: InviteCode = {
    id: payload.invite_id ?? `inv-cloud-${payload.chapter_id ?? normalized}`,
    code: String(payload.code).toUpperCase(),
    label: payload.label ?? 'Chapter join code',
    role: (payload.role as InviteCode['role']) ?? 'ActiveMember',
    createdBy: 'cloud',
    createdAt: new Date().toISOString(),
    maxUses: payload.max_uses ?? null,
    usedCount: payload.used_count ?? 0,
    active: true,
    isPrimary: !payload.invite_id,
  }

  publishJoinCode(invite, {
    cloudChapterId: payload.chapter_id,
    chapterDesignation: payload.chapter_designation,
    university: payload.university,
    orgId: payload.org_id,
  })

  return {
    invite,
    cloudChapterId: payload.chapter_id,
    orgId: payload.org_id,
    chapterDesignation: payload.chapter_designation,
    university: payload.university,
    source: 'cloud',
  }
}

type CloudInvitePayload = {
  id: string
  code: string
  label: string
  role: string
  active: boolean
  maxUses: number | null
  usedCount: number
  isPrimary: boolean
}

function toCloudInvitePayload(invites: InviteCode[]): CloudInvitePayload[] {
  return invites
    .filter((i) => i.code.toUpperCase() !== 'CHAPTER-FOUNDER')
    .map((i) => ({
      id: i.id,
      code: i.code.trim().toUpperCase(),
      label: i.label,
      role: i.role,
      active: i.active,
      maxUses: i.maxUses,
      usedCount: i.usedCount,
      isPrimary: !!i.isPrimary,
    }))
}

function primaryFromInvites(invites: InviteCode[]): InviteCode | undefined {
  return (
    invites.find((i) => i.isPrimary && i.active) ??
    invites.find((i) => i.active && i.code.toUpperCase().startsWith('CHAPTER-JOIN-'))
  )
}

/** Resolve cloud chapter id then publish join_code + invite_codes. */
export async function publishInviteCodesToCloud(
  invites?: InviteCode[]
): Promise<{ ok: boolean; chapterId?: string; error?: string }> {
  if (!isSupabaseConfigured() || !canSyncToCloud()) {
    return { ok: false, error: 'cloud sync unavailable' }
  }

  const list = invites ?? readJson<InviteCode[]>(INVITES_KEY, [])
  const primary = primaryFromInvites(list)
  if (!primary) return { ok: false, error: 'no primary join code' }

  let chapterId: string | null = getCachedCloudChapterId()
  if (!chapterId) {
    chapterId = await ensureCloudChapter()
  }
  if (!chapterId) return { ok: false, error: 'no cloud chapter id' }

  const ok = await syncInviteCodesToCloud(list, chapterId)
  if (ok) {
    publishJoinCode(primary, { cloudChapterId: chapterId })
  }
  return ok ? { ok: true, chapterId } : { ok: false, chapterId, error: 'sync failed' }
}

/** Persist primary join_code + full invite list on the cloud chapter row. */
export async function syncInviteCodesToCloud(
  invites: InviteCode[],
  chapterIdOverride?: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  const sb = getSupabase()
  if (!sb) return false

  const chapterId = chapterIdOverride ?? getCachedCloudChapterId()
  if (!chapterId) return false

  const primary = primaryFromInvites(invites)
  const joinCode = primary?.active ? primary.code.trim().toUpperCase() : null
  const invitePayload = toCloudInvitePayload(invites)

  const { error: rpcErr } = await sb.rpc('sync_chapter_join_codes', {
    p_chapter_id: chapterId,
    p_join_code: joinCode,
    p_invite_codes: invitePayload,
  })

  if (!rpcErr) return true

  if (!/sync_chapter_join_codes|42883|does not exist/i.test(rpcErr.message)) {
    console.warn('[agora] sync_chapter_join_codes RPC failed', rpcErr.message)
  }

  const { error } = await sb
    .from('chapters')
    .update({
      join_code: joinCode,
      invite_codes: invitePayload,
    })
    .eq('id', chapterId)

  if (error) {
    console.warn('[agora] sync invite_codes failed', error.message)
    return false
  }
  return true
}

/** Persist join_code on the cloud chapter row (founder device). */
export async function syncJoinCodeToCloud(code: string): Promise<void> {
  const invites = readJson<InviteCode[]>(INVITES_KEY, [])
  await syncInviteCodesToCloud(invites)
  void code
}

/** Clear primary join_code when deactivated (extras remain in invite_codes jsonb). */
export async function clearJoinCodeFromCloud(): Promise<void> {
  const invites = readJson<InviteCode[]>(INVITES_KEY, [])
  const withoutPrimary = invites.map((i) =>
    i.isPrimary || i.code.toUpperCase().startsWith('CHAPTER-JOIN-')
      ? { ...i, active: false, isPrimary: false }
      : i
  )
  await syncInviteCodesToCloud(withoutPrimary)
}
