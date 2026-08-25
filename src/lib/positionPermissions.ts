import type { ChapterPosition } from '../types/features'
import type { PermissionFlags } from '../types/permissions'

export interface PositionPermissionBoost {
  isVp: boolean
  isSecretary: boolean
  isSocial: boolean
  isPhilanthropy: boolean
  isHouse: boolean
  isChaplain: boolean
  isRisk: boolean
  isHistorian: boolean
  /** Any seat that should leave member-only chrome */
  isExecSeat: boolean
}

export function positionPermissionBoost(
  memberId: string,
  positions: ChapterPosition[]
): PositionPermissionBoost {
  const titles = positions
    .filter((p) => p.assignedMemberId === memberId)
    .map((p) => p.title.trim().toLowerCase())

  const has = (fn: (t: string) => boolean) => titles.some(fn)

  const isVp = has((t) => t.includes('vice president') || t === 'vp')
  const isSecretary = has((t) => t.includes('secretary'))
  const isSocial = has((t) => t.includes('social'))
  const isPhilanthropy = has((t) => t.includes('philanthropy'))
  const isHouse = has((t) => t.includes('house'))
  const isChaplain = has(
    (t) =>
      t.includes('chaplain') ||
      t.includes('spiritual') ||
      t.includes('religious') ||
      t.includes('faith')
  )
  const isRisk = has((t) => t.includes('risk'))
  const isHistorian = has((t) => t.includes('historian') || t.includes('slide'))
  const isPresidentSeat = has((t) => t.includes('president') && !t.includes('vice'))
  const isTreasurerSeat = has((t) => t.includes('treasurer'))
  const isStandardsSeat = has(
    (t) =>
      t.includes('standards') ||
      t.includes('judicial') ||
      t.includes('j-board') ||
      t.includes('jboard')
  )
  const isRecruitmentSeat = has((t) => t.includes('recruitment') || t.includes('rush'))
  const isScholarshipSeat = has((t) => t.includes('scholarship') || t.includes('academic'))

  const isExecSeat =
    isVp ||
    isSecretary ||
    isSocial ||
    isPhilanthropy ||
    isHouse ||
    isChaplain ||
    isRisk ||
    isHistorian ||
    isPresidentSeat ||
    isTreasurerSeat ||
    isStandardsSeat ||
    isRecruitmentSeat ||
    isScholarshipSeat

  return {
    isVp,
    isSecretary,
    isSocial,
    isPhilanthropy,
    isHouse,
    isChaplain,
    isRisk,
    isHistorian,
    isExecSeat,
  }
}

export function applyPositionBoost(
  perms: PermissionFlags,
  boost: PositionPermissionBoost
): PermissionFlags {
  return {
    ...perms,
    canAccessExecTools:
      perms.canAccessExecTools ||
      boost.isVp ||
      boost.isSecretary ||
      boost.isSocial ||
      boost.isPhilanthropy ||
      boost.isHouse ||
      boost.isRisk ||
      boost.isHistorian ||
      boost.isChaplain,
    canManageRoster: perms.canManageRoster || boost.isVp || boost.isSecretary,
    canManageInvites: perms.canManageInvites || boost.isVp || boost.isSecretary,
    canVerifyStudyHours: perms.canVerifyStudyHours || boost.isSecretary,
    canEditEventPoints:
      perms.canEditEventPoints ||
      boost.isSocial ||
      boost.isPhilanthropy ||
      boost.isChaplain ||
      boost.isRisk,
    canPostAnnouncements:
      perms.canPostAnnouncements || boost.isSocial || boost.isSecretary || boost.isHistorian,
    canViewJBoardCases: perms.canViewJBoardCases || boost.isVp,
    // Leave member-only chrome when holding an exec seat
    isMemberView: perms.isMemberView && !boost.isExecSeat,
  }
}
