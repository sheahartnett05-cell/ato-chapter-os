import { GUEST_CHAPTER, isGuestPreviewActive, markGuestPreview } from './guestPreview'
import { DEMO_EVENTS as demoEvents, DEMO_MEMBERS as demoMembers } from '../data/demoFixtures'
import { expandDemoRoster } from '../data/demoRosterExpansion'
import { DEMO_BUDGETS } from '../data/budgetData'
import { SEED_RSVPS, SEED_RSVP_EXCUSES } from '../data/eventParticipationData'
import {
  approvedExcuseMemberIdsForEvent,
  buildAttendanceForMeeting,
} from '../data/demoAttendanceSeed'
import { buildDashboardStubSeed } from '../data/dashboardStubSeed'
import { inferFunctionFromTitle } from './officerFunctions'
import {
  addDays,
  buildRelativeDemoEvents,
  currentTermLabel,
  DEMO_SEED_VERSION,
  localTodayIso,
  relativizeDemo,
  shiftDuesChargesRelative,
  shiftExcusesRelative,
  shiftPostsRelative,
  shiftStudyLogsRelative,
} from './demoRelativeDates'
import { makeCycleId } from './recruitment/types'
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
import { DEMO_PROSPECTS, DEMO_PNM_ACTIVITIES } from '../data/demoFixtures'
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
  joinRegistry: 'chapter-os-join-registry',
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
  demoSeedVersion: 'chapter-os-demo-seed-version',
  dashboardStubs: 'chapter-os-dashboard-stubs',
  chapterMeeting: 'chapter-os-chapter-meeting',
  dashboardFunction: 'chapter-os-dashboard-function',
  rushCycles: 'chapter-os-rush-cycles',
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

/** Persist full demo chapter ? call when entering guest preview. */
export function seedGuestDemo() {
  const roster = expandDemoRoster([...demoMembers])
  const events = buildRelativeDemoEvents(demoEventList())
  const upcomingIds = events.filter((e) => e.date >= new Date().toISOString().slice(0, 10)).map((e) => e.id)

  const positions = [
    ...DEMO_CHAPTER_POSITIONS.map((p) => ({
      ...p,
      function: inferFunctionFromTitle(p.title),
      assignedMemberId:
        p.id === 'p6' ? 'm5' : p.id === 'p5' ? 'm9' : p.id === 'p6b' ? 'm7' : p.assignedMemberId,
    })),
    {
      id: 'p-house',
      title: 'House Manager',
      assignedMemberId: 'm2',
      isCustom: false,
      function: 'house' as const,
    },
    {
      id: 'p-nme',
      title: 'New Member Educator',
      assignedMemberId: 'm10',
      isCustom: false,
      function: 'new_member_educator' as const,
    },
  ]

  write(STORAGE_KEYS.roster, roster)
  write(STORAGE_KEYS.invites, SEED_INVITE_CODES)
  write(STORAGE_KEYS.events, events)
  write(STORAGE_KEYS.posts, shiftPostsRelative([...demoPosts]))
  write(STORAGE_KEYS.rsvps, SEED_RSVPS)
  // Demo-only seed: reconcile approved excuses + use each event's points.
  // Never rewrite live chapter attendance outside seedGuestDemo.
  {
    const excuses = [...SEED_RSVP_EXCUSES]
    const pointsFor = (id: string) => events.find((e) => e.id === id)?.points ?? 0
    write(STORAGE_KEYS.attendance, {
      e1: buildAttendanceForMeeting(roster, 0.86, {
        eventPoints: pointsFor('e1'),
        approvedExcuseMemberIds: approvedExcuseMemberIdsForEvent(excuses, 'e1'),
      }),
      e2: buildAttendanceForMeeting(roster, 0.79, {
        eventPoints: pointsFor('e2'),
        approvedExcuseMemberIds: approvedExcuseMemberIdsForEvent(excuses, 'e2'),
      }),
    })
  }
  write(STORAGE_KEYS.rsvpExcuses, shiftExcusesRelative([...SEED_RSVP_EXCUSES]))
  write(STORAGE_KEYS.studyLogs, shiftStudyLogsRelative(initialStudyLogs))
  write(STORAGE_KEYS.duesCharges, shiftDuesChargesRelative(initialDuesCharges))
  write('chapter-os-budgets', DEMO_BUDGETS)
  write(
    STORAGE_KEYS.dashboardStubs,
    buildDashboardStubSeed({ pastMeetingId: 'e1', upcomingIds: upcomingIds.slice(0, 3) })
  )
  write(STORAGE_KEYS.positions, positions)
  write(STORAGE_KEYS.chapterMeta, {
    chapterDesignation: GUEST_CHAPTER.chapterDesignation,
    university: GUEST_CHAPTER.university,
    semester: currentTermLabel(),
  })
  write(STORAGE_KEYS.execSlides, DEMO_EXEC_SLIDES)
  write(STORAGE_KEYS.bylaws, DEMO_BYLAWS)
  write(STORAGE_KEYS.houseTasks, DEMO_HOUSE_TASKS)
  write(STORAGE_KEYS.tableForms, DEMO_CHAPTER_TABLES)
  const term = currentTermLabel()
  const cycleId = makeCycleId(term)
  const today = localTodayIso()
  write(STORAGE_KEYS.rushCycles, [
    {
      id: cycleId,
      label: term,
      startedAt: today,
      bidDay: addDays(today, 5),
    },
  ])
  write(
    STORAGE_KEYS.prospects,
    relativizeDemo(DEMO_PROSPECTS).map((p) => ({ ...p, cycleId }))
  )
  write(STORAGE_KEYS.pnmActivities, relativizeDemo(DEMO_PNM_ACTIVITIES))
  write(STORAGE_KEYS.studyLocations, initialStudyLocations)
  write(STORAGE_KEYS.studyRequired, SEMESTER_STUDY_HOURS_REQUIRED)
  write(STORAGE_KEYS.studyHoursRequirements, DEFAULT_STUDY_HOURS_REQUIREMENTS)
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
  try {
    localStorage.setItem(STORAGE_KEYS.demoSeedVersion, JSON.stringify(DEMO_SEED_VERSION))
  } catch {
    /* storage unavailable */
  }
}

export const SESSION_BACKUP_KEY = 'chapter-os-session-backup'

/** Session keys cleared with demo data ? never include the backup key itself. */
const EXTRA_SESSION_KEYS = [
  'chapter-os-onboarding',
  'chapter-os-selected-org',
  'chapter-os-budgets',
  'chapter-os-user-id',
  'chapter-os-supabase-chapter-id',
  'chapter-os-view-mode',
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

/** Restore chapter data after leaving guest preview. Atomic: write restored keys, then drop backup + guest flag. */
export function restoreRealSession(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_BACKUP_KEY)
    if (!raw) return false
    const bag = JSON.parse(raw) as Record<string, string>
    clearDemoData()
    for (const [k, v] of Object.entries(bag)) {
      if (k === SESSION_BACKUP_KEY) continue
      localStorage.setItem(k, v)
    }
    localStorage.removeItem(SESSION_BACKUP_KEY)
    markGuestPreview(false)
    return true
  } catch {
    return false
  }
}

/** Clear demo / chapter operational storage. Does not remove the real-session backup. */
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

/** Re-seed guest preview when stored demo dates are from an older anchor. */
export function ensureGuestDemoFresh() {
  if (!isGuestPreviewActive()) return
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.demoSeedVersion)
    const version = raw ? (JSON.parse(raw) as string) : null
    if (version === DEMO_SEED_VERSION) return
    seedGuestDemo()
  } catch {
    seedGuestDemo()
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
