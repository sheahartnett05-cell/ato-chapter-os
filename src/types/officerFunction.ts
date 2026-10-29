/** Canonical officer responsibility — titles map to one of these per chapter. */
export type OfficerFunction =
  | 'president'
  | 'treasurer'
  | 'secretary'
  | 'internal_vp_standards'
  | 'recruitment'
  | 'new_member_educator'
  | 'scholarship'
  | 'risk_management'
  | 'social'
  | 'philanthropy_service'
  | 'house'
  | 'alumni'
  | 'brotherhood'
  | 'ritual'
  | 'athletics'
  | 'communications'
  | 'other'

export const OFFICER_FUNCTIONS: OfficerFunction[] = [
  'president',
  'treasurer',
  'secretary',
  'internal_vp_standards',
  'recruitment',
  'new_member_educator',
  'scholarship',
  'risk_management',
  'social',
  'philanthropy_service',
  'house',
  'alumni',
  'brotherhood',
  'ritual',
  'athletics',
  'communications',
  'other',
]

/** Lower index = higher precedence when picking a primary dashboard. */
export const FUNCTION_PRECEDENCE: OfficerFunction[] = [
  'president',
  'treasurer',
  'secretary',
  'internal_vp_standards',
  'recruitment',
  'new_member_educator',
  'scholarship',
  'risk_management',
  'philanthropy_service',
  'house',
  'social',
  'alumni',
  'brotherhood',
  'communications',
  'athletics',
  'ritual',
  'other',
]

export function officerFunctionLabel(fn: OfficerFunction): string {
  const labels: Record<OfficerFunction, string> = {
    president: 'President',
    treasurer: 'Treasurer',
    secretary: 'Secretary',
    internal_vp_standards: 'Standards / VP',
    recruitment: 'Recruitment',
    new_member_educator: 'New Member Educator',
    scholarship: 'Scholarship',
    risk_management: 'Risk Management',
    social: 'Social',
    philanthropy_service: 'Philanthropy & Service',
    house: 'House Manager',
    alumni: 'Alumni',
    brotherhood: 'Brotherhood',
    ritual: 'Ritual',
    athletics: 'Athletics',
    communications: 'Communications',
    other: 'Officer',
  }
  return labels[fn]
}
