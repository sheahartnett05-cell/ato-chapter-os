import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_ANNOUNCEMENTS as seedPosts } from '../data/featureData'
import { allowDemoData } from '../lib/demoSeed'
import { writeJson } from '../lib/persist'
import { ANNOUNCEMENT_TEMPLATES } from '../data/templateData'
import type {
  Announcement,
  AnnouncementTemplate,
  PostKind,
} from '../types/features'

const STORAGE_KEY = 'chapter-os-posts'

function normalizePost(p: Announcement): Announcement {
  const post = { ...p, kind: p.kind ?? 'announcement' }
  if (post.signup?.slots?.length) {
    post.signup = {
      ...post.signup,
      slots: post.signup.slots.map((slot) => ({
        ...slot,
        memberIds: slot.memberIds.slice(0, Math.max(0, slot.capacity)),
      })),
    }
  }
  return post
}

function readPosts(): Announcement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = (JSON.parse(raw) as Announcement[]).map(normalizePost)
      // Persist capacity repairs so over-subscribed slots don't linger in storage
      try {
        const needsRepair = (JSON.parse(raw) as Announcement[]).some((p) =>
          p.signup?.slots?.some((s) => s.memberIds.length > s.capacity)
        )
        if (needsRepair) writePosts(parsed)
      } catch {
        /* ignore */
      }
      return parsed
    }
  } catch {
    /* ignore */
  }
  return allowDemoData() ? seedPosts.map(normalizePost) : []
}

function writePosts(posts: Announcement[]) {
  writeJson(STORAGE_KEY, posts)
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

interface CreatePostInput {
  kind: PostKind
  title: string
  body: string
  author: string
  authorRole: string
  pinned?: boolean
  poll?: {
    question: string
    optionLabels: string[]
    closesAt?: string
    allowMultiple?: boolean
  }
  signup?: { slotLabels: string[]; closesAt?: string }
}

interface CommunicationsContextValue {
  posts: Announcement[]
  templates: AnnouncementTemplate[]
  addPost: (input: CreatePostInput) => Announcement
  togglePin: (id: string) => void
  votePoll: (postId: string, memberId: string, optionIds: string[]) => boolean
  joinSignup: (postId: string, slotId: string, memberId: string) => boolean
  leaveSignup: (postId: string, slotId: string, memberId: string) => void
  getMemberPollVotes: (postId: string, memberId: string) => string[]
  pollOpen: (post: Announcement) => boolean
}

const CommunicationsContext = createContext<CommunicationsContextValue | null>(null)

export function CommunicationsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Announcement[]>(readPosts)

  const persist = useCallback((next: Announcement[]) => {
    setPosts(next)
    writePosts(next)
  }, [])

  const addPost = useCallback(
    (input: CreatePostInput): Announcement => {
      const post: Announcement = {
        id: uid('post'),
        kind: input.kind,
        title: input.title.trim(),
        body: input.body.trim(),
        author: input.author,
        authorRole: input.authorRole,
        createdAt: new Date().toISOString(),
        pinned: input.pinned,
      }

      if (input.kind === 'poll' && input.poll) {
        post.poll = {
          question: input.poll.question,
          options: input.poll.optionLabels.map((label) => ({
            id: uid('opt'),
            label,
            voteCount: 0,
          })),
          closesAt: input.poll.closesAt,
          allowMultiple: input.poll.allowMultiple ?? false,
          voterIds: {},
        }
      }

      if (input.kind === 'signup' && input.signup) {
        post.signup = {
          closesAt: input.signup.closesAt,
          slots: input.signup.slotLabels.map((label) => ({
            id: uid('slot'),
            label,
            capacity: 10,
            memberIds: [],
          })),
        }
      }

      persist([post, ...posts])
      return post
    },
    [posts, persist]
  )

  const togglePin = useCallback(
    (id: string) => {
      persist(
        posts.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : { ...p, pinned: false }))
      )
    },
    [posts, persist]
  )

  const pollOpen = useCallback((post: Announcement) => {
    if (!post.poll?.closesAt) return true
    return new Date(post.poll.closesAt + 'T23:59:59') >= new Date()
  }, [])

  const votePoll = useCallback(
    (postId: string, memberId: string, optionIds: string[]): boolean => {
      const post = posts.find((p) => p.id === postId)
      if (!post?.poll || !pollOpen(post)) return false

      const valid = optionIds.every((oid) => post.poll!.options.some((o) => o.id === oid))
      if (!valid) return false
      if (!post.poll.allowMultiple && optionIds.length > 1) return false

      const prevVotes = post.poll.voterIds[memberId] ?? []
      const nextPosts = posts.map((p) => {
        if (p.id !== postId || !p.poll) return p
        const options = p.poll.options.map((o) => ({
          ...o,
          voteCount: o.voteCount - (prevVotes.includes(o.id) ? 1 : 0),
        }))
        for (const oid of optionIds) {
          const opt = options.find((o) => o.id === oid)
          if (opt) opt.voteCount += 1
        }
        return {
          ...p,
          poll: {
            ...p.poll,
            options,
            voterIds: { ...p.poll.voterIds, [memberId]: optionIds },
          },
        }
      })
      persist(nextPosts)
      return true
    },
    [posts, persist, pollOpen]
  )

  const joinSignup = useCallback(
    (postId: string, slotId: string, memberId: string): boolean => {
      const post = posts.find((p) => p.id === postId)
      if (!post?.signup) return false
      const slot = post.signup.slots.find((s) => s.id === slotId)
      if (!slot || slot.memberIds.includes(memberId)) return false
      if (slot.memberIds.length >= slot.capacity) return false

      persist(
        posts.map((p) => {
          if (p.id !== postId || !p.signup) return p
          return {
            ...p,
            signup: {
              ...p.signup,
              slots: p.signup.slots.map((s) =>
                s.id === slotId ? { ...s, memberIds: [...s.memberIds, memberId] } : s
              ),
            },
          }
        })
      )
      return true
    },
    [posts, persist]
  )

  const leaveSignup = useCallback(
    (postId: string, slotId: string, memberId: string) => {
      persist(
        posts.map((p) => {
          if (p.id !== postId || !p.signup) return p
          return {
            ...p,
            signup: {
              ...p.signup,
              slots: p.signup.slots.map((s) =>
                s.id === slotId
                  ? { ...s, memberIds: s.memberIds.filter((id) => id !== memberId) }
                  : s
              ),
            },
          }
        })
      )
    },
    [posts, persist]
  )

  const getMemberPollVotes = useCallback(
    (postId: string, memberId: string) => {
      const post = posts.find((p) => p.id === postId)
      return post?.poll?.voterIds[memberId] ?? []
    },
    [posts]
  )

  const value = useMemo<CommunicationsContextValue>(
    () => ({
      posts,
      templates: ANNOUNCEMENT_TEMPLATES,
      addPost,
      togglePin,
      votePoll,
      joinSignup,
      leaveSignup,
      getMemberPollVotes,
      pollOpen,
    }),
    [
      posts,
      addPost,
      togglePin,
      votePoll,
      joinSignup,
      leaveSignup,
      getMemberPollVotes,
      pollOpen,
    ]
  )

  return (
    <CommunicationsContext.Provider value={value}>{children}</CommunicationsContext.Provider>
  )
}

export function useCommunications(): CommunicationsContextValue {
  const ctx = useContext(CommunicationsContext)
  if (!ctx) throw new Error('useCommunications must be used within CommunicationsProvider')
  return ctx
}
