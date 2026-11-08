import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_CHAPTER_POSITIONS } from '../data/featureData'
import {
  cloudIdentityEnabled,
  fetchCloudMembership,
  fetchCloudOfficerSeats,
  rpcAssignOfficerSeat,
  rpcRemoveOfficerSeat,
} from '../lib/cloudIdentity'
import { getCachedCloudChapterId } from '../lib/cloudChapterId'
import { allowDemoData, STORAGE_KEYS } from '../lib/demoSeed'
import { inferFunctionFromTitle } from '../lib/officerFunctions'
import { writeLocalOnly } from '../lib/persist'
import { getSupabase } from '../lib/supabase'
import type { ChapterPosition } from '../types/features'
import type { OfficerFunction } from '../types/officerFunction'
import type { UserRole } from '../types/permissions'

const STORAGE_KEY = STORAGE_KEYS.positions

/** Map common position titles → app permission roles */
export function roleFromPositionTitle(title: string): UserRole | null {
  const t = title.trim().toLowerCase()
  if ((t === 'president' || t.includes('president')) && !t.includes('vice')) return 'President'
  if (t.includes('treasurer')) return 'Treasurer'
  if (t.includes('recruitment') || t.includes('rush')) return 'RecruitmentChair'
  if (t.includes('scholarship') || t.includes('academic')) return 'ScholarshipChair'
  if (t.includes('j-board') || t.includes('jboard') || t.includes('judicial') || t.includes('standards'))
    return 'JBoardChair'
  if (
    t.includes('chaplain') ||
    t.includes('spiritual') ||
    t.includes('religious') ||
    t.includes('faith advisor') ||
    t.includes('faith chair')
  )
    return 'Chaplain'
  return null
}

export const DEFAULT_POSITIONS: ChapterPosition[] = [
  { id: 'pos-pres', title: 'President', isCustom: false },
  { id: 'pos-vp', title: 'Vice President', isCustom: false },
  { id: 'pos-treas', title: 'Treasurer', isCustom: false },
  { id: 'pos-sec', title: 'Secretary', isCustom: false },
  { id: 'pos-rush', title: 'Recruitment Chair', isCustom: false },
  { id: 'pos-scholar', title: 'Scholarship Chair', isCustom: false },
  { id: 'pos-standards', title: 'Standards Chair', isCustom: false },
  { id: 'pos-chaplain', title: 'Chaplain', isCustom: false },
  { id: 'pos-social', title: 'Social Chair', isCustom: false },
  { id: 'pos-philanthropy', title: 'Philanthropy Chair', isCustom: false },
]

function withFunction(p: ChapterPosition): ChapterPosition {
  if (p.function) return p
  return { ...p, function: inferFunctionFromTitle(p.title) }
}

function readPositions(): ChapterPosition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ChapterPosition[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(withFunction)
    }
  } catch {
    /* ignore */
  }
  if (allowDemoData()) {
    return DEMO_CHAPTER_POSITIONS.map((p) => withFunction({ ...p }))
  }
  return DEFAULT_POSITIONS.map((p) => withFunction({ ...p }))
}

/** Positions are local + SQL seats — never chapter_kv (LWW was wiping assignments). */
function writePositions(positions: ChapterPosition[]) {
  writeLocalOnly(STORAGE_KEY, positions)
}

function uid() {
  return `pos-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
}

function readLocalAccounts(): { userId: string; memberId: string }[] {
  try {
    const raw = localStorage.getItem('chapter-os-member-accounts')
    if (!raw) return []
    return JSON.parse(raw) as { userId: string; memberId: string }[]
  } catch {
    return []
  }
}

async function resolveUserIdForAppMember(
  chapterId: string,
  memberId: string
): Promise<string | null> {
  const local = readLocalAccounts().find((a) => a.memberId === memberId)?.userId
  if (local) return local

  const sb = getSupabase()
  if (!sb) return null
  const { data } = await sb
    .from('chapter_memberships')
    .select('user_id')
    .eq('chapter_id', chapterId)
    .eq('app_member_id', memberId)
    .maybeSingle()
  return data?.user_id ?? null
}

async function membershipMaps(chapterId: string): Promise<{
  userToMember: Map<string, string>
  memberToUser: Map<string, string>
}> {
  const userToMember = new Map<string, string>()
  const memberToUser = new Map<string, string>()
  for (const a of readLocalAccounts()) {
    if (a.userId && a.memberId) {
      userToMember.set(a.userId, a.memberId)
      memberToUser.set(a.memberId, a.userId)
    }
  }
  const sb = getSupabase()
  if (!sb) return { userToMember, memberToUser }
  const { data } = await sb
    .from('chapter_memberships')
    .select('user_id, app_member_id')
    .eq('chapter_id', chapterId)
  for (const row of data ?? []) {
    if (row.user_id && row.app_member_id) {
      userToMember.set(row.user_id, row.app_member_id)
      memberToUser.set(row.app_member_id, row.user_id)
    }
  }
  return { userToMember, memberToUser }
}

interface ChapterPositionsContextValue {
  positions: ChapterPosition[]
  addPosition: (title: string, description?: string) => Promise<{ ok: boolean; error?: string }>
  removePosition: (id: string) => Promise<{ ok: boolean; error?: string }>
  assignPosition: (
    positionId: string,
    memberId: string | undefined
  ) => Promise<{ ok: boolean; error?: string }>
  updatePosition: (
    id: string,
    patch: Partial<ChapterPosition>
  ) => Promise<{ ok: boolean; error?: string }>
}

const ChapterPositionsContext = createContext<ChapterPositionsContextValue | null>(null)

export function ChapterPositionsProvider({ children }: { children: ReactNode }) {
  const [positions, setPositions] = useState<ChapterPosition[]>(readPositions)
  const [cloudChapterId, setCloudChapterId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function hydrateSeats() {
      if (!cloudIdentityEnabled()) {
        if (!cancelled) setCloudChapterId(null)
        return
      }
      const membership = await fetchCloudMembership()
      const chapterId = membership?.chapterId ?? getCachedCloudChapterId()
      if (!chapterId || cancelled) return
      setCloudChapterId(chapterId)

      const [seats, maps] = await Promise.all([
        fetchCloudOfficerSeats(chapterId),
        membershipMaps(chapterId),
      ])
      if (cancelled) return
      if (seats.length === 0) return

      setPositions((prev) => {
        const prevById = new Map(prev.map((p) => [p.id, p]))
        const serverIds = new Set(seats.map((s) => s.seatId))

        const fromServer = seats.map((s) => {
          const local = prevById.get(s.seatId)
          const fromCloud = s.memberUserId
            ? maps.userToMember.get(s.memberUserId)
            : undefined
          return withFunction({
            id: s.seatId,
            title: s.title,
            isCustom: !s.seatId.startsWith('pos-'),
            function: (s.function as OfficerFunction) || inferFunctionFromTitle(s.title),
            // Prefer SQL assignment; keep local only when cloud seat is empty.
            assignedMemberId: fromCloud ?? (s.memberUserId ? undefined : local?.assignedMemberId),
            description: local?.description,
          })
        })

        // Keep local-only seats not yet on the server (e.g. add in flight).
        const localOnly = prev.filter((p) => !serverIds.has(p.id))
        const next = [...fromServer, ...localOnly]
        writePositions(next)
        return next
      })
    }
    void hydrateSeats()
    return () => {
      cancelled = true
    }
  }, [])

  const persist = useCallback((next: ChapterPosition[]) => {
    setPositions(next)
    writePositions(next)
  }, [])

  const resolveChapterId = useCallback(async (): Promise<string | null> => {
    if (cloudChapterId) return cloudChapterId
    if (!cloudIdentityEnabled()) return null
    const membership = await fetchCloudMembership()
    const chapterId = membership?.chapterId ?? getCachedCloudChapterId()
    if (chapterId) setCloudChapterId(chapterId)
    return chapterId
  }, [cloudChapterId])

  const pushSeat = useCallback(
    async (input: {
      seatId: string
      title: string
      function: OfficerFunction | string
      memberId?: string
    }): Promise<{ ok: boolean; error?: string }> => {
      // Resolve at call time — don't treat "hydrate still loading" as local-only success.
      const chapterId = await resolveChapterId()
      if (!chapterId) {
        if (!cloudIdentityEnabled()) return { ok: true }
        return {
          ok: false,
          error: 'Chapter cloud link is not ready yet. Wait a moment and try again.',
        }
      }
      let memberUserId: string | null = null
      if (input.memberId) {
        memberUserId = await resolveUserIdForAppMember(chapterId, input.memberId)
        if (!memberUserId) {
          return {
            ok: false,
            error:
              'That member has no cloud login linked yet. They need to finish join/sign-in before a seat can sync.',
          }
        }
      }
      const res = await rpcAssignOfficerSeat({
        chapterId,
        seatId: input.seatId,
        memberUserId,
        title: input.title,
        function: input.function,
      })
      if (!res.ok) {
        const msg = res.error ?? 'Could not save officer seat'
        // President-only RPC — make the failure obvious
        if (/president|founder/i.test(msg)) {
          return {
            ok: false,
            error: 'Only the President (or chapter founder) can save officer seats to the cloud.',
          }
        }
        return { ok: false, error: msg }
      }
      return { ok: true }
    },
    [resolveChapterId]
  )

  const addPosition = useCallback(
    async (title: string, description?: string) => {
      const trimmed = title.trim()
      if (!trimmed) return { ok: false, error: 'Title required' }
      const id = uid()
      const fn = inferFunctionFromTitle(trimmed)
      const next = [
        ...positions,
        {
          id,
          title: trimmed,
          description,
          isCustom: true,
          function: fn,
        },
      ]
      persist(next)
      const cloud = await pushSeat({ seatId: id, title: trimmed, function: fn })
      if (!cloud.ok) {
        // Keep local so the UI isn't empty, but report failure to sync
        return cloud
      }
      return { ok: true }
    },
    [positions, persist, pushSeat]
  )

  const removePosition = useCallback(
    async (id: string) => {
      const prev = positions
      persist(positions.filter((p) => p.id !== id))
      const chapterId = await resolveChapterId()
      if (!chapterId) {
        if (!cloudIdentityEnabled()) return { ok: true }
        persist(prev)
        return {
          ok: false,
          error: 'Chapter cloud link is not ready yet. Wait a moment and try again.',
        }
      }
      const res = await rpcRemoveOfficerSeat(chapterId, id)
      if (!res.ok) {
        persist(prev)
        return {
          ok: false,
          error: res.error ?? 'Could not remove seat',
        }
      }
      return { ok: true }
    },
    [positions, persist, resolveChapterId]
  )

  const assignPosition = useCallback(
    async (positionId: string, memberId: string | undefined) => {
      const pos = positions.find((p) => p.id === positionId)
      if (!pos) return { ok: false, error: 'Position not found' }
      const prev = positions
      const next = positions.map((p) =>
        p.id === positionId ? { ...p, assignedMemberId: memberId || undefined } : p
      )
      persist(next)
      const cloud = await pushSeat({
        seatId: positionId,
        title: pos.title,
        function: pos.function ?? inferFunctionFromTitle(pos.title),
        memberId,
      })
      if (!cloud.ok) {
        persist(prev)
        return cloud
      }
      return { ok: true }
    },
    [positions, persist, pushSeat]
  )

  const updatePosition = useCallback(
    async (id: string, patch: Partial<ChapterPosition>) => {
      const prev = positions
      const next = positions.map((p) => (p.id === id ? { ...p, ...patch } : p))
      persist(next)
      const pos = next.find((p) => p.id === id)
      if (!pos) return { ok: false, error: 'Position not found' }
      const cloud = await pushSeat({
        seatId: id,
        title: pos.title,
        function: pos.function ?? inferFunctionFromTitle(pos.title),
        memberId: pos.assignedMemberId,
      })
      if (!cloud.ok) {
        persist(prev)
        return cloud
      }
      return { ok: true }
    },
    [positions, persist, pushSeat]
  )

  const value = useMemo(
    () => ({
      positions,
      addPosition,
      removePosition,
      assignPosition,
      updatePosition,
    }),
    [positions, addPosition, removePosition, assignPosition, updatePosition]
  )

  return (
    <ChapterPositionsContext.Provider value={value}>{children}</ChapterPositionsContext.Provider>
  )
}

export function useChapterPositions(): ChapterPositionsContextValue {
  const ctx = useContext(ChapterPositionsContext)
  if (!ctx) throw new Error('useChapterPositions must be used within ChapterPositionsProvider')
  return ctx
}
