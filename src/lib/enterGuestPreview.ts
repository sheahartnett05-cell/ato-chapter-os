import { getOrCreateUserId } from '../context/MembersContext'
import type { OnboardingData } from '../types/permissions'
import { backupRealSession, clearDemoData, seedGuestDemo } from './demoSeed'
import {
  GUEST_CHAPTER,
  GUEST_PRESETS,
  markGuestPreview,
  type GuestExecFunctionPreset,
  type GuestPreviewMode,
} from './guestPreview'
import { writeJson } from './persist'
import { viewModeStorageKey } from './chapterViewMode'

/** Seed the sample chapter and open the chosen demo view. Reloads the app. */
export function enterGuestPreview(mode: GuestPreviewMode, execPreset?: GuestExecFunctionPreset) {
  const base = GUEST_PRESETS[mode]
  const userId = getOrCreateUserId()
  const { orgId, chapterDesignation, university } = GUEST_CHAPTER
  const memberId = execPreset?.memberId ?? (mode === 'exec' ? 'm1' : 'm5')
  const role = execPreset?.role ?? base.role
  const profile = {
    ...base.profile,
    ...(execPreset
      ? {
          firstName: 'Guest',
          lastName: execPreset.label.split('/')[0].trim().split(' ')[0] || 'Exec',
          avatar: execPreset.label
            .split(/\s+/)
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
        }
      : {}),
  }

  backupRealSession()
  clearDemoData()
  markGuestPreview(true)
  seedGuestDemo()

  try {
    const accounts = [
      {
        id: `acct-guest-${mode}${execPreset ? `-${execPreset.function}` : ''}`,
        userId,
        memberId,
        profile,
        role,
        email: `guest.${mode}@agora.preview`,
        inviteCodeId: `guest-${mode}`,
        joinedAt: new Date().toISOString(),
      },
    ]
    localStorage.setItem('chapter-os-member-accounts', JSON.stringify(accounts))
    if (mode === 'exec') {
      localStorage.setItem(
        'chapter-os-chapter-lock',
        JSON.stringify({
          orgId,
          chapterDesignation,
          university,
          lockedAt: new Date().toISOString(),
          lockedByUserId: userId,
        }),
      )
      localStorage.setItem(viewModeStorageKey(userId), 'operations')
      if (execPreset) {
        localStorage.setItem('chapter-os-dashboard-function', JSON.stringify(execPreset.function))
      }
    } else {
      localStorage.setItem(viewModeStorageKey(userId), 'chapter-room')
    }
  } catch {
    /* storage unavailable */
  }

  const onboarding: OnboardingData = {
    completed: true,
    profile,
    orgId,
    chapterDesignation,
    university,
    role,
    memberId,
    userId,
    inviteCodeId: `guest-${mode}`,
    isGuest: true,
  }
  writeJson('chapter-os-onboarding', onboarding)
  writeJson('chapter-os-selected-org', orgId)
  window.location.assign(mode === 'exec' ? '/home' : '/my-dashboard')
}
