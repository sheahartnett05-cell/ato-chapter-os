import { isGuestPreviewActive, markGuestPreview } from './guestPreview'
import { DEMO_EVENTS as demoEvents, DEMO_MEMBERS as demoMembers } from '../data/mockData'
import {
  calendarExtraEvents,
  initialBillHighway,
  initialDuesCharges,
  initialDuesPayments,
  initialStudyLocations,
  initialStudyLogs,
  DEFAULT_STUDY_HOURS_RESET,
  DEFAULT_STUDY_HOURS_REQUIREMENTS,
  SEMESTER_STUDY_HOURS_REQUIRED,
} from '../data/chapterOpsData'
import {
  DEMO_BYLAWS,
  DEMO_EXEC_SLIDES,
  DEMO_HOUSE_TASKS,
} from '../data/chapterResourcesData'
import { DEMO_CHAPTER_TABLES } from '../data/chapterTablesData'
import { DEMO_PROSPECTS, DEMO_PNM_ACTIVITIES } from '../data/mockData'
import { DEMO_ANNOUNCEMENTS as demoPosts, DEMO_CHAPTER_POSITIONS } from '../data/featureData'
import { SEED_INVITE_CODES } from '../data/inviteData'
import {
  committeeTasks as demoTasks,
  committees as demoCommittees,
  committeeChatMessages as demoCommitteeChat,
  fineSchedule as demoFineSchedule,
  fines as demoFines,
  governanceConfig as demoGovConfig,
  groupAnnouncements as demoGroupPosts,
  jBoardCases as demoCases,
} from '../data/governanceData'

/** localStorage keys used by chapter providers */
export const STORAGE_KEYS = {
  events: 'chapter-os-events',
  posts: 'chapter-os-posts',
  invites: 'chapter-os-invite-codes',
  accounts: 'chapter-os-member-accounts',
  roster: 'chapter-os-roster-members',
  chapterLock: 'chapter-os-chapter-lock',
  studyLocations: 'chapter-os-study-locations',
  studyLogs: 'chapter-os-study-logs',
  studyRequired: 'chapter-os-study-required',
  studyHoursRequirements: 'chapter-os-study-hours-requirements',
  studyHoursReset: 'chapter-os-study-hours-reset',
  rsvps: 'chapter-os-rsvps',
  attendance: 'chapter-os-attendance',
  rsvpExcuses: 'chapter-os-rsvp-excuses',
  duesCharges: 'chapter-os-dues-charges',
  duesPayments: 'chapter-os-dues-payments',
  billHighway: 'chapter-os-bill-highway',
  governance: 'chapter-os-governance',
  execSlides: 'chapter-os-exec-slides',
  bylaws: 'chapter-os-bylaws',
  houseTasks: 'chapter-os-house-tasks',
  tableForms: 'chapter-os-table-forms',
  prospects: 'chapter-os-prospects',
  pnmActivities: 'chapter-os-pnm-activities',
  positions: 'chapter-os-chapter-positions',
  chapterMeta: 'chapter-os-chapter-meta',
  chapterFeatures: 'chapter-os-chapter-features',
  standardsConfig: 'chapter-os-standards-config',
  committees: 'chapter-os-committees',
  committeeChat: 'chapter-os-committee-chat',
  demoSeeded: 'chapter-os-demo-seeded',
} as const

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

function remove(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* storage unavailable */
  }
}

export function demoEventList() {
  const byId = new Map<string, (typeof demoEvents)[number]>()
  for (const e of [...demoEvents, ...calendarExtraEvents]) byId.set(e.id, e)
  return [...byId.values()]
}

/** Persist full demo chapter — call when entering guest preview. */
export function seedGuestDemo() {
  write(STORAGE_KEYS.roster, demoMembers)
  write(STORAGE_KEYS.invites, SEED_INVITE_CODES)
  write(STORAGE_KEYS.events, demoEventList())
  write(STORAGE_KEYS.posts, demoPosts)
  write(STORAGE_KEYS.execSlides, DEMO_EXEC_SLIDES)
  write(STORAGE_KEYS.bylaws, DEMO_BYLAWS)
  write(STORAGE_KEYS.houseTasks, DEMO_HOUSE_TASKS)
  write(STORAGE_KEYS.tableForms, DEMO_CHAPTER_TABLES)
  write(STORAGE_KEYS.prospects, DEMO_PROSPECTS)
  write(STORAGE_KEYS.pnmActivities, DEMO_PNM_ACTIVITIES)
  write(STORAGE_KEYS.positions, DEMO_CHAPTER_POSITIONS)
  write(STORAGE_KEYS.studyLocations, initialStudyLocations)
  write(STORAGE_KEYS.studyLogs, initialStudyLogs)
  write(STORAGE_KEYS.studyRequired, SEMESTER_STUDY_HOURS_REQUIRED)
  write(STORAGE_KEYS.studyHoursRequirements, DEFAULT_STUDY_HOURS_REQUIREMENTS)
  write(STORAGE_KEYS.duesCharges, initialDuesCharges)
  write(STORAGE_KEYS.duesPayments, initialDuesPayments)
  write(STORAGE_KEYS.billHighway, initialBillHighway)
  write(STORAGE_KEYS.studyHoursReset, DEFAULT_STUDY_HOURS_RESET)
  write(STORAGE_KEYS.committees, demoCommittees)
  write(STORAGE_KEYS.committeeChat, demoCommitteeChat)
  write(STORAGE_KEYS.governance, {
    cases: demoCases,
    fines: demoFines,
    committees: demoCommittees,
    groupAnnouncements: demoGroupPosts,
    committeeTasks: demoTasks,
    fineSchedule: demoFineSchedule,
    config: demoGovConfig,
  })
  write(STORAGE_KEYS.demoSeeded, true)
}

export const SESSION_BACKUP_KEY = 'chapter-os-session-backup'

const EXTRA_SESSION_KEYS = [
  'chapter-os-onboarding',
  'chapter-os-selected-org',
  'chapter-os-budgets',
  'chapter-os-user-id',
] as const

/** Snapshot real chapter data before guest preview wipes storage. */
export function backupRealSession() {
  try {
    if (isGuestPreviewActive()) return
    const bag: Record<string, string> = {}
    for (const key of Object.values(STORAGE_KEYS)) {
      const v = localStorage.getItem(key)
      if (v != null) bag[key] = v
    }
    for (const key of EXTRA_SESSION_KEYS) {
      const v = localStorage.getItem(key)
      if (v != null) bag[key] = v
    }
    if (Object.keys(bag).length === 0) return
    localStorage.setItem(SESSION_BACKUP_KEY, JSON.stringify(bag))
  } catch {
    /* storage unavailable */
  }
}

/** Restore chapter data after leaving guest preview. */
export function restoreRealSession(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_BACKUP_KEY)
    if (!raw) return false
    const bag = JSON.parse(raw) as Record<string, string>
    clearDemoData()
    for (const [k, v] of Object.entries(bag)) {
      localStorage.setItem(k, v)
    }
    localStorage.removeItem(SESSION_BACKUP_KEY)
    markGuestPreview(false)
    return true
  } catch {
    return false
  }
}

/** Clear demo / chapter operational storage — call when exiting guest. */
export function clearDemoData() {
  Object.values(STORAGE_KEYS).forEach(remove)
  for (const key of EXTRA_SESSION_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }
}

export function allowDemoData() {
  return isGuestPreviewActive()
}

/** Empty BillHighway config for real (non-preview) chapters */
export const EMPTY_BILL_HIGHWAY = {
  enabled: false,
  payUrl: '',
  chapterCode: '',
  lastSyncedAt: undefined as string | undefined,
}
