import { useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { SearchField } from '../components/ui/SearchField'
import { useAuth } from '../context/AuthContext'
import { useChapter } from '../context/ChapterContext'
import { getOrCreateUserId, useMembers } from '../context/MembersContext'
import { getAuthUserId } from '../lib/supabaseAuth'
import {
  ORG_CATEGORIES,
  orgsInCategory,
  type NationalOrg,
  type OrgCategory,
} from '../data/nationalOrgs'
import type { InviteCode } from '../types/memberAccount'
import { roleLabel, type UserProfile, type UserRole } from '../types/permissions'
import { isLikelyEmail } from '../lib/formUtils'
import { parseJoinCodeFromSearch } from '../lib/joinLinks'
import { PhotoUpload } from '../components/ui/PhotoUpload'
import { OrgCrest } from '../components/ui/OrgCrest'
import { BrandHeroPanel } from '../components/onboarding/BrandHeroPanel'
function OrgSelectCard({
  org,
  selected,
  onSelect,
}: {
  org: NationalOrg
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3.5 rounded-md border px-3.5 py-3 text-left transition ${
        selected
          ? 'border-[var(--primary)] bg-[var(--primary-subtle)] shadow-[inset_0_0_0_1px_var(--primary)]'
          : 'border-[var(--rule)] bg-[var(--surface-card)] hover:border-[var(--ink)]/40'
      }`}
    >
      <OrgCrest org={org} size={42} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--ink)]">{org.orgName}</p>
        <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
          {org.letters}
          <span className="mx-1.5 opacity-40">·</span>
          {org.nickname}
        </p>
      </div>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
          selected
            ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
            : 'border-[var(--rule)] text-transparent'
        }`}
      >
        <Check size={12} strokeWidth={2.5} />
      </span>
    </button>
  )
}
export default function Onboarding() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlJoinCode = useMemo(
    () => parseJoinCodeFromSearch(searchParams.toString()),
    [searchParams]
  )
  const intent = searchParams.get('intent')
  const {
    completeOnboarding,
    requiresSupabaseAuth: needsAuth,
    emailVerified,
    sendEmailOtp,
    verifyEmailOtp,
    signInWithPassword,
    signUpWithPassword,
    updatePassword,
    sendPasswordChangeEmailCode,
  } = useAuth()
  const { orgDirectory, setSelectedOrg, setChapterMeta } = useChapter()
  const { chapterLock, validateInvite, redeemInvite, registerMember } = useMembers()
  const [resolvedCloudChapterId, setResolvedCloudChapterId] = useState<string | undefined>()
  const [inviteChapterMeta, setInviteChapterMeta] = useState<{
    orgId: string
    chapterDesignation: string
    university: string
  } | null>(null)
  const [inviteBusy, setInviteBusy] = useState(false)
  const [finishBusy, setFinishBusy] = useState(false)
  const chapterKnown = Boolean(chapterLock || inviteChapterMeta)
  const skipStart = intent === 'create'
  const steps = useMemo(() => {
    const tail = chapterKnown
      ? ['Profile', 'About']
      : ['Profile', 'About', 'Organization', 'Chapter']
    return skipStart ? tail : ['Start', ...tail]
  }, [chapterKnown, skipStart])
  const [step, setStep] = useState(0)
  const [entryPath, setEntryPath] = useState<'invite' | 'create' | null>(
    intent === 'create' ? 'create' : intent === 'join' || urlJoinCode ? 'invite' : null,
  )
  const [createRole, setCreateRole] = useState<UserRole>('President')
  const [inviteInput, setInviteInput] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [validatedInvite, setValidatedInvite] = useState<InviteCode | null>(null)

  useEffect(() => {
    if (intent === 'create' || intent === 'join' || urlJoinCode) return
    navigate('/', { replace: true })
  }, [intent, urlJoinCode, navigate])

  useEffect(() => {
    if (!urlJoinCode) return
    setEntryPath('invite')
    setInviteInput(urlJoinCode)
    setInviteError('')
  }, [urlJoinCode])

  useEffect(() => {
    if (chapterLock && createRole === 'President') setCreateRole('ActiveMember')
  }, [chapterLock, createRole])
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    graduationYear: new Date().getFullYear() + 1,
    avatar: '',
    photoUrl: undefined,
    major: '',
    birthday: '',
    shirtSize: 'M',
    emergencyContact: '',
    emergencyPhone: '',
  })
  const [orgId, setOrgId] = useState('')
  const [chapterDesignation, setChapterDesignation] = useState('')
  const [university, setUniversity] = useState('')
  const [orgQuery, setOrgQuery] = useState('')
  const [category, setCategory] = useState<OrgCategory>('fraternity')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [otpBusy, setOtpBusy] = useState(false)
  const [accountPassword, setAccountPassword] = useState('')
  const [accountPassword2, setAccountPassword2] = useState('')
  const [passwordChangeCode, setPasswordChangeCode] = useState('')
  const [passwordChangeCodeSent, setPasswordChangeCodeSent] = useState(false)
  /** True once this device created/signed in with a password, or saved one after OTP. */
  const [passwordReady, setPasswordReady] = useState(() => {
    try {
      return sessionStorage.getItem('chapter-os-onboarding-password-ready') === '1'
    } catch {
      return false
    }
  })
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password')
  const markPasswordReady = () => {
    try {
      sessionStorage.setItem('chapter-os-onboarding-password-ready', '1')
    } catch {
      /* ignore */
    }
    setPasswordReady(true)
  }
  const stepKey = steps[step]
  const selectedOrg = orgDirectory.find((o) => o.id === orgId) ?? null
  useEffect(() => {
    if (chapterLock) {
      setOrgId(chapterLock.orgId)
      setChapterDesignation(chapterLock.chapterDesignation)
      setUniversity(chapterLock.university)
      setSelectedOrg(chapterLock.orgId)
      return
    }
    if (inviteChapterMeta) {
      setOrgId(inviteChapterMeta.orgId)
      setChapterDesignation(inviteChapterMeta.chapterDesignation)
      setUniversity(inviteChapterMeta.university)
      setSelectedOrg(inviteChapterMeta.orgId)
    }
  }, [chapterLock, inviteChapterMeta, setSelectedOrg])
  const filteredOrgs = useMemo(() => {
    const q = orgQuery.trim().toLowerCase()
    return orgsInCategory(category).filter((o) => {
      if (!q) return true
      return (
        o.orgName.toLowerCase().includes(q) ||
        o.nickname.toLowerCase().includes(q) ||
        o.letters.toLowerCase().includes(q)
      )
    })
  }, [category, orgQuery])
  const initials =
    profile.avatar.trim() ||
    `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() ||
    '?'
  const profileReady =
    Boolean(profile.firstName.trim()) &&
    Boolean(profile.lastName.trim()) &&
    Boolean(profile.phone.trim()) &&
    Boolean(profile.email?.trim()) &&
    isLikelyEmail(profile.email ?? '') &&
    // Join/create must finish with a real password credential — OTP alone is not enough.
    (!needsAuth || (emailVerified && passwordReady))

  const canNext =
    stepKey === 'Start'
      ? entryPath === 'create' || (entryPath === 'invite' && inviteInput.trim().length >= 4)
      : stepKey === 'Profile'
        ? profileReady
        : stepKey === 'About'
          ? profile.major?.trim() && profile.birthday?.trim()
          : stepKey === 'Organization'
          ? !!orgId
          : stepKey === 'Chapter'
            ? chapterDesignation.trim() && university.trim()
            : false
  const selectOrg = (id: string) => {
    setOrgId(id)
    setSelectedOrg(id)
  }
  const advanceFromStart = async () => {
    if (entryPath === 'create') {
      setValidatedInvite(null)
      setResolvedCloudChapterId(undefined)
      setInviteChapterMeta(null)
      setInviteError('')
      setStep((s) => s + 1)
      return
    }
    if (entryPath !== 'invite') return
    setInviteBusy(true)
    setInviteError('')
    try {
      const result = await validateInvite(inviteInput)
      if (!result.valid || !result.invite) {
        setInviteError(result.error ?? 'Invalid code')
        return
      }
      setValidatedInvite(result.invite)
      setResolvedCloudChapterId(result.cloudChapterId)
      if (result.orgId && result.chapterDesignation != null && result.university != null) {
        setInviteChapterMeta({
          orgId: result.orgId,
          chapterDesignation: result.chapterDesignation,
          university: result.university,
        })
      } else {
        setInviteChapterMeta(null)
      }
      setStep((s) => s + 1)
    } finally {
      setInviteBusy(false)
    }
  }
  const finish = async () => {
    const resolvedOrgId = chapterLock?.orgId ?? inviteChapterMeta?.orgId ?? orgId
    if (!resolvedOrgId) return
    if (needsAuth && (!emailVerified || !getAuthUserId())) {
      setInviteError('Sign in with your email code or password before finishing.')
      setStep(steps.indexOf('Profile') >= 0 ? steps.indexOf('Profile') : 0)
      return
    }
    const chapter =
      chapterLock?.chapterDesignation ??
      inviteChapterMeta?.chapterDesignation ??
      chapterDesignation.trim()
    const school =
      chapterLock?.university ?? inviteChapterMeta?.university ?? university.trim()
    const selfRegistered = entryPath === 'create'
    // Join codes → ActiveMember; only founder invite → President; create path uses createRole
    const role: UserRole =
      entryPath === 'invite'
        ? validatedInvite?.code.toUpperCase() === 'CHAPTER-FOUNDER'
          ? 'President'
          : 'ActiveMember'
        : createRole
    const home = role === 'ActiveMember' || role === 'NewMember' ? '/my-dashboard' : '/home'
    const userId = getAuthUserId() ?? getOrCreateUserId()
    const avatar = initials
    let inviteCodeId = 'self-register'
    const normalizedInviteCode = inviteInput.trim().toUpperCase()
    setFinishBusy(true)
    setInviteError('')
    try {
      if (!selfRegistered) {
        if (!validatedInvite) return
        // Cloud joiners increment usage after hydrate (mergeJoinerAfterHydrate)
        if (!resolvedCloudChapterId) {
          const redeemed = await redeemInvite(inviteInput)
          if (!redeemed) {
            setInviteError('Invite code could not be redeemed')
            setStep(0)
            return
          }
          inviteCodeId = redeemed.id
        } else {
          inviteCodeId = validatedInvite.id
        }
      }
      const { memberId } = await registerMember({
        userId,
        profile: { ...profile, avatar },
        role,
        inviteCodeId,
        inviteCode: selfRegistered ? undefined : normalizedInviteCode,
        orgId: resolvedOrgId,
        chapterDesignation: chapter,
        university: school,
        email: profile.email,
        cloudChapterId: resolvedCloudChapterId,
      })
      flushSync(() => {
        setSelectedOrg(resolvedOrgId)
        setChapterMeta({ chapterDesignation: chapter, university: school })
        completeOnboarding({
          profile: { ...profile, avatar },
          orgId: resolvedOrgId,
          chapterDesignation: chapter,
          university: school,
          role,
          memberId,
          userId,
          inviteCodeId,
          selfRegistered,
        })
      })
      navigate(home, { replace: true })
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Could not create account'
      const { humanizeChapterMembershipError } = await import('../lib/cloudIdentity')
      setInviteError(humanizeChapterMembershipError(raw))
    } finally {
      setFinishBusy(false)
    }
  }
  const goNext = () => {
    if (stepKey === 'Start') {
      void advanceFromStart()
      return
    }
    if (step < steps.length - 1) {
      setStep((s) => s + 1)
      return
    }
    void finish()
  }
  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-[var(--surface-tint)] text-[var(--ink)]">
      <BrandHeroPanel org={selectedOrg} variant="onboarding" />
      <div className="flex min-h-screen min-h-[100dvh] w-full flex-col lg:w-1/2">
        <div className="theme-stripe" />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-6 sm:px-10 sm:py-8">
          <div className="mb-6 flex items-center justify-between sm:mb-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              Step {step + 1} / {steps.length}
            </p>
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <span
                  key={steps[i]}
                  className={`h-0.5 w-6 ${i <= step ? 'bg-[var(--primary)]' : 'bg-[var(--rule)]'}`}
                />
              ))}
            </div>
          </div>
          <div className="flex-1">
            {stepKey === 'Start' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-3xl tracking-tight">Join your chapter</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    Paste the code your officers sent you. Starting a chapter instead? Go back and choose Create a chapter.
                  </p>
                </div>
                <label className="block">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    Join code
                  </span>
                  <input
                    value={inviteInput}
                    onChange={(e) => {
                      setInviteInput(e.target.value.toUpperCase())
                      setInviteError('')
                    }}
                    placeholder="CHAPTER-JOIN-…"
                    className="input-editorial mt-1 font-mono uppercase tracking-wider"
                    autoFocus
                  />
                </label>
                {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
                {urlJoinCode && (
                  <p className="text-sm text-[var(--ink)]">
                    This link already includes a code. Confirm it and continue.
                  </p>
                )}
              </div>
            )}
            {stepKey === 'Profile' && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-serif text-3xl tracking-tight">Your profile</h2>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                    {validatedInvite
                      ? validatedInvite.code.toUpperCase() === 'CHAPTER-FOUNDER'
                        ? 'Founding as President'
                        : 'Joining as member — president assigns roles later'
                      : entryPath === 'create'
                        ? `Creating profile · ${roleLabel(createRole)}`
                        : 'Identity for the chapter roster'}
                  </p>
                </div>
                <div className="flex items-center gap-4 border border-[var(--rule)] p-4">
                  <PhotoUpload
                    value={profile.photoUrl}
                    initials={initials}
                    onChange={(url) => setProfile({ ...profile, photoUrl: url })}
                    size="lg"
                  />
                  <label className="block flex-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      Initials (fallback)
                    </span>
                    <input
                      value={profile.avatar}
                      onChange={(e) => setProfile({ ...profile, avatar: e.target.value.slice(0, 3) })}
                      placeholder={initials}
                      className="input-editorial mt-1"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      First
                    </span>
                    <input
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      className="input-editorial mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      Last
                    </span>
                    <input
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      className="input-editorial mt-1"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    Phone
                  </span>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="(555) 555-0100"
                    className="input-editorial mt-1"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    Email
                  </span>
                  <input
                    type="email"
                    value={profile.email ?? ''}
                    onChange={(e) => {
                      setProfile({ ...profile, email: e.target.value })
                      setOtpSent(false)
                      setOtpError('')
                    }}
                    placeholder="you@university.edu"
                    className="input-editorial mt-1"
                  />
                </label>
                {needsAuth && (
                  <div className="space-y-3 rounded-md border border-[var(--rule)] bg-[var(--surface-card)] p-4">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      Account
                      {emailVerified ? ' · signed in' : ''}
                      {passwordReady ? ' · password ready' : ''}
                    </p>
                    {emailVerified && passwordReady ? (
                      <p className="text-xs text-emerald-800">
                        Account ready — you can continue. Sign in later with this email and
                        password.
                      </p>
                    ) : (
                      <p className="text-xs leading-relaxed text-[var(--muted)]">
                        {emailVerified
                          ? 'You signed in with an email code. Set a password now before continuing — otherwise Login with password will fail.'
                          : 'Choose a password first. That creates your account and signs you in with the password already saved (no separate “set password” step).'}
                      </p>
                    )}

                    {!(emailVerified && passwordReady) && (
                      <>
                        {!emailVerified && (
                          <div className="flex gap-1 rounded-sm border border-[var(--rule)] p-0.5">
                            <button
                              type="button"
                              className={`min-h-10 flex-1 font-mono text-[10px] uppercase tracking-wider ${
                                authMethod === 'password' ? 'theme-pill-active' : 'theme-pill-muted'
                              }`}
                              onClick={() => setAuthMethod('password')}
                            >
                              Password
                            </button>
                            <button
                              type="button"
                              className={`min-h-10 flex-1 font-mono text-[10px] uppercase tracking-wider ${
                                authMethod === 'otp' ? 'theme-pill-active' : 'theme-pill-muted'
                              }`}
                              onClick={() => setAuthMethod('otp')}
                            >
                              Email code
                            </button>
                          </div>
                        )}

                        {(emailVerified || authMethod === 'password') && (
                          <>
                            <label className="block">
                              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                                Password
                              </span>
                              <input
                                type="password"
                                autoComplete={emailVerified ? 'new-password' : 'new-password'}
                                className="input-editorial mt-1 min-h-11"
                                value={accountPassword}
                                onChange={(e) => setAccountPassword(e.target.value)}
                                placeholder="At least 8 characters"
                              />
                            </label>
                            <label className="block">
                              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                                {emailVerified ? 'Confirm new password' : 'Confirm password'}
                              </span>
                              <input
                                type="password"
                                autoComplete="new-password"
                                className="input-editorial mt-1 min-h-11"
                                value={accountPassword2}
                                onChange={(e) => setAccountPassword2(e.target.value)}
                              />
                            </label>

                            {emailVerified ? (
                              <>
                                <p className="text-xs text-[var(--muted)]">
                                  We email a 6-digit code, then save the password on your account.
                                </p>
                                <button
                                  type="button"
                                  disabled={
                                    otpBusy ||
                                    !profile.email?.trim() ||
                                    accountPassword.length < 8 ||
                                    accountPassword !== accountPassword2
                                  }
                                  onClick={async () => {
                                    setOtpBusy(true)
                                    setOtpError('')
                                    if (accountPassword !== accountPassword2) {
                                      setOtpError('Passwords do not match')
                                      setOtpBusy(false)
                                      return
                                    }
                                    const sent = await sendPasswordChangeEmailCode()
                                    setOtpBusy(false)
                                    if (!sent.ok) {
                                      setOtpError(sent.error ?? 'Could not send verification code')
                                      return
                                    }
                                    setPasswordChangeCodeSent(true)
                                    setOtpError('')
                                  }}
                                  className="btn-secondary w-full disabled:opacity-40"
                                >
                                  {passwordChangeCodeSent
                                    ? 'Resend verification code'
                                    : 'Email code to save password'}
                                </button>
                                {passwordChangeCodeSent ? (
                                  <>
                                    <label className="block">
                                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                                        6-digit code
                                      </span>
                                      <input
                                        value={passwordChangeCode}
                                        onChange={(e) =>
                                          setPasswordChangeCode(
                                            e.target.value.replace(/\D/g, '').slice(0, 6)
                                          )
                                        }
                                        placeholder="123456"
                                        className="input-editorial mt-1 tracking-[0.3em]"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      disabled={
                                        otpBusy ||
                                        passwordChangeCode.length < 6 ||
                                        accountPassword.length < 8 ||
                                        accountPassword !== accountPassword2
                                      }
                                      onClick={async () => {
                                        setOtpBusy(true)
                                        setOtpError('')
                                        const res = await updatePassword(accountPassword, {
                                          emailCode: passwordChangeCode,
                                        })
                                        setOtpBusy(false)
                                        if (!res.ok) {
                                          setOtpError(res.error ?? 'Could not save password')
                                          return
                                        }
                                        setOtpError('')
                                        setAccountPassword('')
                                        setAccountPassword2('')
                                        setPasswordChangeCode('')
                                        setPasswordChangeCodeSent(false)
                                        markPasswordReady()
                                      }}
                                      className="btn-primary w-full disabled:opacity-40"
                                    >
                                      Save password
                                    </button>
                                  </>
                                ) : null}
                                <button
                                  type="button"
                                  className="min-h-11 w-full text-left font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]"
                                  onClick={() => markPasswordReady()}
                                >
                                  I already have a password on this email — continue
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                disabled={
                                  otpBusy ||
                                  !profile.email?.trim() ||
                                  accountPassword.length < 8 ||
                                  accountPassword !== accountPassword2
                                }
                                onClick={async () => {
                                  setOtpBusy(true)
                                  setOtpError('')
                                  if (accountPassword !== accountPassword2) {
                                    setOtpError('Passwords do not match')
                                    setOtpBusy(false)
                                    return
                                  }
                                  const email = profile.email ?? ''
                                  let res = await signUpWithPassword(email, accountPassword)
                                  // Existing account → sign in with the password they just entered
                                  if (
                                    !res.ok &&
                                    /already/i.test(res.error ?? '')
                                  ) {
                                    res = await signInWithPassword(email, accountPassword)
                                  }
                                  setOtpBusy(false)
                                  if (!res.ok) {
                                    setOtpError(res.error ?? 'Could not create account')
                                    return
                                  }
                                  if ('needsEmailConfirm' in res && res.needsEmailConfirm) {
                                    setOtpError(
                                      'Check your email to confirm the account, then sign in from Login.'
                                    )
                                    return
                                  }
                                  setOtpError('')
                                  setAccountPassword('')
                                  setAccountPassword2('')
                                  markPasswordReady()
                                }}
                                className="btn-primary w-full disabled:opacity-40"
                              >
                                Create account & sign in
                              </button>
                            )}
                          </>
                        )}

                        {!emailVerified && authMethod === 'otp' && (
                          <>
                            <p className="text-xs text-[var(--muted)]">
                              Email code signs you in without a password. You will be asked to set
                              one before you can continue.
                            </p>
                            <button
                              type="button"
                              disabled={otpBusy || !profile.email?.trim()}
                              onClick={async () => {
                                setOtpBusy(true)
                                setOtpError('')
                                const res = await sendEmailOtp(profile.email ?? '')
                                setOtpBusy(false)
                                if (res.ok) setOtpSent(true)
                                else setOtpError(res.error ?? 'Could not send code')
                              }}
                              className="btn-secondary w-full disabled:opacity-40"
                            >
                              {otpSent ? 'Resend login code' : 'Send login code'}
                            </button>
                            {otpSent && (
                              <label className="block">
                                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                                  6-digit code
                                </span>
                                <input
                                  value={otpCode}
                                  onChange={(e) =>
                                    setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                                  }
                                  placeholder="123456"
                                  className="input-editorial mt-1 tracking-[0.3em]"
                                  inputMode="numeric"
                                  autoComplete="one-time-code"
                                />
                              </label>
                            )}
                            {otpSent && (
                              <button
                                type="button"
                                disabled={otpBusy || otpCode.length < 6}
                                onClick={async () => {
                                  setOtpBusy(true)
                                  setOtpError('')
                                  const res = await verifyEmailOtp(profile.email ?? '', otpCode)
                                  setOtpBusy(false)
                                  if (!res.ok) setOtpError(res.error ?? 'Invalid code')
                                }}
                                className="btn-primary w-full disabled:opacity-40"
                              >
                                Verify & sign in
                              </button>
                            )}
                          </>
                        )}
                      </>
                    )}
                    {otpError && <p className="text-xs text-red-600">{otpError}</p>}
                  </div>
                )}
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    Grad year
                  </span>
                  <input
                    type="number"
                    value={profile.graduationYear}
                    onChange={(e) =>
                      setProfile({ ...profile, graduationYear: Number(e.target.value) })
                    }
                    className="input-editorial mt-1 font-mono"
                  />
                </label>
              </div>
            )}
            {stepKey === 'About' && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-serif text-3xl tracking-tight">About you</h2>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                    Chapter roster details — editable later in your profile
                  </p>
                </div>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    Major
                  </span>
                  <input
                    value={profile.major ?? ''}
                    onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                    placeholder="e.g. Finance"
                    className="input-editorial mt-1"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    Birthday
                  </span>
                  <input
                    type="date"
                    value={profile.birthday ?? ''}
                    onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                    className="input-editorial mt-1"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    Shirt size
                  </span>
                  <select
                    value={profile.shirtSize ?? 'M'}
                    onChange={(e) => setProfile({ ...profile, shirtSize: e.target.value })}
                    className="input-editorial mt-1 w-full"
                  >
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    Emergency contact name
                  </span>
                  <input
                    value={profile.emergencyContact ?? ''}
                    onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                    className="input-editorial mt-1"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    Emergency contact phone
                  </span>
                  <input
                    type="tel"
                    value={profile.emergencyPhone ?? ''}
                    onChange={(e) => setProfile({ ...profile, emergencyPhone: e.target.value })}
                    className="input-editorial mt-1"
                  />
                </label>
              </div>
            )}
            {stepKey === 'Organization' && (
              <div className="flex h-full flex-col space-y-4">
                <div>
                  <h2 className="font-serif text-3xl tracking-tight">Select your org</h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Sets chapter colors, language, and branding across Chaptera.
                  </p>
                </div>

                <div
                  className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  role="tablist"
                  aria-label="Organization category"
                >
                  {ORG_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="tab"
                      aria-selected={category === c.id}
                      onClick={() => {
                        setCategory(c.id)
                        setOrgId('')
                        setOrgQuery('')
                      }}
                      className={`shrink-0 rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition ${
                        category === c.id
                          ? 'bg-[var(--ink)] text-white'
                          : 'bg-[var(--surface-card)] text-[var(--muted)] ring-1 ring-[var(--rule)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <SearchField
                  value={orgQuery}
                  onChange={setOrgQuery}
                  placeholder="Search by name or letters…"
                  aria-label="Search organizations by name or letters"
                  className="sm:max-w-none"
                />

                {selectedOrg && (
                  <div className="flex items-center gap-3 rounded-md border border-[var(--primary)]/30 bg-[var(--primary-subtle)] px-3 py-2.5">
                    <OrgCrest org={selectedOrg} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--ink)]">
                        {selectedOrg.orgName}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        Selected
                      </p>
                    </div>
                    <Check size={16} className="shrink-0 text-[var(--primary)]" />
                  </div>
                )}

                <ul className="max-h-[min(42vh,22rem)] space-y-2 overflow-y-auto overscroll-contain pr-0.5">
                  {filteredOrgs.map((org) => (
                    <li key={org.id}>
                      <OrgSelectCard
                        org={org}
                        selected={orgId === org.id}
                        onSelect={() => selectOrg(org.id)}
                      />
                    </li>
                  ))}
                  {filteredOrgs.length === 0 && (
                    <li className="rounded-md border border-dashed border-[var(--rule)] py-10 text-center">
                      <p className="text-sm text-[var(--muted)]">No organizations match</p>
                      <button
                        type="button"
                        onClick={() => setOrgQuery('')}
                        className="mt-2 text-xs font-semibold text-[var(--primary)]"
                      >
                        Clear search
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}
            {stepKey === 'Chapter' && selectedOrg && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-serif text-3xl tracking-tight">Your chapter</h2>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                    Local designation
                  </p>
                </div>
                <div className="flex items-center gap-3.5 rounded-md border border-[var(--rule)] bg-[var(--surface-card)] p-3.5">
                  <OrgCrest org={selectedOrg} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">
                      {selectedOrg.orgName}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                      {selectedOrg.letters}
                      <span className="mx-1.5 opacity-40">·</span>
                      {selectedOrg.orgType}
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(steps.findIndex((s) => s === 'Organization'))}
                      className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] underline-offset-2 hover:text-[var(--ink)] hover:underline"
                    >
                      Change organization
                    </button>
                  </div>
                </div>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    Chapter name
                  </span>
                  <input
                    value={chapterDesignation}
                    onChange={(e) => setChapterDesignation(e.target.value)}
                    placeholder="e.g. Beta Chapter"
                    className="input-editorial mt-1"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    University
                  </span>
                  <input
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="e.g. University of Florida"
                    className="input-editorial mt-1"
                  />
                </label>
              </div>
            )}
          </div>
          {inviteError && stepKey !== 'Start' && (
            <p className="mt-6 text-sm text-red-600">{inviteError}</p>
          )}
          <div className="sticky bottom-0 z-10 -mx-5 mt-8 flex items-center gap-2 border-t border-[var(--rule)] bg-[var(--surface-tint)] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-6">
            {step > 0 ? (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-ghost min-w-[5.5rem]">
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <button type="button" onClick={() => navigate('/')} className="btn-ghost min-w-[5.5rem]">
                <ArrowLeft size={14} /> Home
              </button>
            )}
            <button
              type="button"
              disabled={!canNext || inviteBusy || finishBusy}
              onClick={goNext}
              className="btn-primary ml-auto min-w-[8rem] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {inviteBusy || finishBusy ? (
                'Checking…'
              ) : step < steps.length - 1 ? (
                <>
                  Continue <ArrowRight size={14} />
                </>
              ) : (
                'Finish'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

