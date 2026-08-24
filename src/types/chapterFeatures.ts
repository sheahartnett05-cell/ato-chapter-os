/** Chapter feature flags + editor assignments (president-configurable) */

export type ChapterFeatureId =
  | 'announcements'
  | 'roster'
  | 'calendar'
  | 'recruitment'
  | 'standards'
  | 'dues'
  | 'budgets'
  | 'studyHours'
  | 'house'
  | 'tables'
  | 'committees'
  | 'bylaws'
  | 'execSlides'

export type EditorCapabilityId =
  | 'editAnnouncements'
  | 'editRoster'
  | 'editCalendar'
  | 'editRecruitment'
  | 'editStandards'
  | 'editDues'
  | 'editBudgets'
  | 'editStudyHours'
  | 'editHouse'
  | 'editTables'
  | 'editBylaws'
  | 'editChapterSetup'
  | 'manageInvites'

export interface ChapterFeatureDef {
  id: ChapterFeatureId
  label: string
  description: string
  /** Default on for new chapters */
  defaultEnabled: boolean
}

export interface EditorCapabilityDef {
  id: EditorCapabilityId
  label: string
  description: string
  /** Related feature — editors only matter if feature is on */
  featureId?: ChapterFeatureId
}

export const CHAPTER_FEATURES: ChapterFeatureDef[] = [
  {
    id: 'announcements',
    label: 'Announcements',
    description: 'Chapter posts, polls, and signups',
    defaultEnabled: true,
  },
  {
    id: 'roster',
    label: 'Roster',
    description: 'Member directory and profiles',
    defaultEnabled: true,
  },
  {
    id: 'calendar',
    label: 'Calendar & events',
    description: 'Events, RSVPs, and excuses',
    defaultEnabled: true,
  },
  {
    id: 'recruitment',
    label: 'Recruitment',
    description: 'Pipeline and PNM profiles',
    defaultEnabled: true,
  },
  {
    id: 'standards',
    label: 'Standards & Accountability',
    description: 'Cases, fines, and hearings',
    defaultEnabled: true,
  },
  {
    id: 'dues',
    label: 'Dues & finances',
    description: 'Charges, payments, and ledgers',
    defaultEnabled: true,
  },
  {
    id: 'budgets',
    label: 'Budgets',
    description: 'Custom chapter budgets and spending breakdowns',
    defaultEnabled: true,
  },
  {
    id: 'studyHours',
    label: 'Study / library hours',
    description: 'Academic hour tracking',
    defaultEnabled: true,
  },
  {
    id: 'house',
    label: 'House',
    description: 'Cleanup and maintenance tasks',
    defaultEnabled: true,
  },
  {
    id: 'tables',
    label: 'Forms',
    description: 'Event forms, guest lists, and custom spreadsheets',
    defaultEnabled: true,
  },
  {
    id: 'committees',
    label: 'Committees',
    description: 'Standing and ad-hoc committees',
    defaultEnabled: true,
  },
  {
    id: 'bylaws',
    label: 'Bylaws',
    description: 'Chapter governing documents',
    defaultEnabled: true,
  },
  {
    id: 'execSlides',
    label: 'Exec slides',
    description: 'Officer meeting decks',
    defaultEnabled: true,
  },
]

export const EDITOR_CAPABILITIES: EditorCapabilityDef[] = [
  {
    id: 'editAnnouncements',
    label: 'Edit announcements',
    description: 'Create and manage posts, polls, signups',
    featureId: 'announcements',
  },
  {
    id: 'editRoster',
    label: 'Edit roster',
    description: 'Add/update members and profile fields',
    featureId: 'roster',
  },
  {
    id: 'editCalendar',
    label: 'Edit calendar',
    description: 'Create events and manage RSVPs/excuses',
    featureId: 'calendar',
  },
  {
    id: 'editRecruitment',
    label: 'Edit recruitment',
    description: 'Manage pipeline and PNMs',
    featureId: 'recruitment',
  },
  {
    id: 'editStandards',
    label: 'Edit standards',
    description: 'File cases, issue fines, run hearings',
    featureId: 'standards',
  },
  {
    id: 'editDues',
    label: 'Edit dues',
    description: 'Manage charges and payment records',
    featureId: 'dues',
  },
  {
    id: 'editBudgets',
    label: 'Edit budgets',
    description: 'Create budgets and update line items',
    featureId: 'budgets',
  },
  {
    id: 'editStudyHours',
    label: 'Edit study hours',
    description: 'Verify hours and manage locations',
    featureId: 'studyHours',
  },
  {
    id: 'editHouse',
    label: 'Edit house tasks',
    description: 'Assign cleanup and maintenance',
    featureId: 'house',
  },
  {
    id: 'editTables',
    label: 'Edit forms',
    description: 'Build forms and edit spreadsheet rows',
    featureId: 'tables',
  },
  {
    id: 'editBylaws',
    label: 'Edit bylaws',
    description: 'Import and update governing docs',
    featureId: 'bylaws',
  },
  {
    id: 'editChapterSetup',
    label: 'Edit chapter setup',
    description: 'Positions, features, and editors (with President)',
  },
  {
    id: 'manageInvites',
    label: 'Manage invites',
    description: 'Create and toggle invite codes',
  },
]

export interface ChapterFeaturesState {
  /** featureId → enabled */
  enabled: Record<ChapterFeatureId, boolean>
  /** capabilityId → memberIds who may edit */
  editors: Record<EditorCapabilityId, string[]>
}

export function defaultChapterFeaturesState(): ChapterFeaturesState {
  const enabled = {} as Record<ChapterFeatureId, boolean>
  for (const f of CHAPTER_FEATURES) enabled[f.id] = f.defaultEnabled
  const editors = {} as Record<EditorCapabilityId, string[]>
  for (const c of EDITOR_CAPABILITIES) editors[c.id] = []
  return { enabled, editors }
}
