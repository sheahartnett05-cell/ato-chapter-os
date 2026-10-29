import { FUNCTION_PRECEDENCE, type OfficerFunction } from '../types/officerFunction'

const GENERIC_TITLE_MAP: Array<{ test: RegExp; fn: OfficerFunction }> = [
  { test: /^president$|^(chapter )?president$/i, fn: 'president' },
  { test: /vice president|internal vp|vp of standards|standards chair|judicial|j-?board/i, fn: 'internal_vp_standards' },
  { test: /treasurer|exchequer|finance chair|keeper of exchequer/i, fn: 'treasurer' },
  { test: /secretary|recorder|corresponding secretary/i, fn: 'secretary' },
  { test: /recruitment|rush|intake chair/i, fn: 'recruitment' },
  { test: /new member educ|pledge educ|nm educ/i, fn: 'new_member_educator' },
  { test: /scholarship|academic chair|library/i, fn: 'scholarship' },
  { test: /risk|safety|sober monitor/i, fn: 'risk_management' },
  { test: /social chair|social/i, fn: 'social' },
  { test: /philanthropy|service chair|community service/i, fn: 'philanthropy_service' },
  { test: /house manager|house chair|facilities|maintenance chair/i, fn: 'house' },
  { test: /alumni/i, fn: 'alumni' },
  { test: /brotherhood|sisterhood/i, fn: 'brotherhood' },
  { test: /ritual|chaplain|spiritual/i, fn: 'ritual' },
  { test: /athletic|sports/i, fn: 'athletics' },
  { test: /communication|pr chair|marketing/i, fn: 'communications' },
]

/** Org-specific title → function (extend per crest). */
const ORG_TITLE_OVERRIDES: Record<string, Record<string, OfficerFunction>> = {
  ato: {
    'worthy keeper of exchequer': 'treasurer',
    'worthy recorder': 'secretary',
    'worthy herald': 'communications',
  },
}

export function inferFunctionFromTitle(title: string, orgId?: string): OfficerFunction {
  const t = title.trim()
  const lower = t.toLowerCase()
  if (orgId && ORG_TITLE_OVERRIDES[orgId]?.[lower]) {
    return ORG_TITLE_OVERRIDES[orgId][lower]
  }
  if ((lower === 'president' || lower.includes('president')) && !lower.includes('vice')) {
    return 'president'
  }
  for (const { test, fn } of GENERIC_TITLE_MAP) {
    if (test.test(t)) return fn
  }
  return 'other'
}

export function compareFunctionPrecedence(a: OfficerFunction, b: OfficerFunction): number {
  const ia = FUNCTION_PRECEDENCE.indexOf(a)
  const ib = FUNCTION_PRECEDENCE.indexOf(b)
  return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
}
