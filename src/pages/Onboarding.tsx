import { useEffect, useMemo, useState } from 'react'

import { flushSync } from 'react-dom'

import { useNavigate } from 'react-router-dom'

import { ArrowLeft, ArrowRight, Check, Search } from 'lucide-react'

import { useAuth } from '../context/AuthContext'

import { useChapter } from '../context/ChapterContext'

import { getOrCreateUserId, useMembers } from '../context/MembersContext'

import {

  ORG_CATEGORIES,

  orgsInCategory,

  type NationalOrg,

  type OrgCategory,

} from '../data/nationalOrgs'

import type { InviteCode } from '../types/memberAccount'

import { roleLabel, type UserProfile } from '../types/permissions'

import { contrastText } from '../lib/themeUtils'



const ORG_MOTTOS: Record<string, string> = {

  ato: 'Established 1865 · Friendship · Truth',

  'sigma-chi': 'In Hoc Signo Vinces',

  'kappa-sigma': 'Bononia Docet',

  'zeta-tau-alpha': 'Seek the Noblest',

  'delta-gamma': 'Do Good',

  aka: 'By Culture and By Merit',

}



function BrandPanel({ org }: { org: NationalOrg | null }) {

  const primary = org?.primaryColor ?? '#1a1a1a'

  const accent = org?.accentColor ?? '#c4a35a'

  const secondary = org?.secondaryColor ?? '#333'

  const fg = contrastText(primary)

  const motto = org ? ORG_MOTTOS[org.id] ?? `${org.orgType} · National Organization` : 'Select your chapter'



  return (

    <aside

      className="relative hidden min-h-screen overflow-hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between"

      style={{ backgroundColor: primary, color: fg }}

    >

      <div

        className="pointer-events-none absolute inset-0 opacity-[0.07]"

        style={{

          backgroundImage: `linear-gradient(135deg, ${accent} 0%, transparent 45%), linear-gradient(225deg, ${secondary} 0%, transparent 50%)`,

        }}

      />

      <p

        className="pointer-events-none absolute -right-8 top-1/2 -translate-y-1/2 select-none font-serif text-[18vw] leading-none opacity-[0.12]"

        aria-hidden

      >

        {org?.letters ?? 'ΑΩ'}

      </p>



      <div className="relative z-10 p-10 xl:p-14">

        <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-70">Chapter OS</p>

        <h1 className="mt-6 max-w-sm font-serif text-4xl tracking-tight xl:text-5xl">

          {org ? org.orgName : 'Your chapter, branded.'}

        </h1>

        <p className="mt-4 max-w-xs font-mono text-[11px] uppercase tracking-[0.14em] opacity-65">

          {motto}

        </p>

      </div>



      <div className="relative z-10 space-y-4 p-10 xl:p-14">

        {org && (

          <div className="flex gap-1">

            {[primary, accent, secondary].map((c) => (

              <span

                key={c}

                className="h-1.5 flex-1 border border-white/20"

                style={{ backgroundColor: c }}

              />

            ))}

          </div>

        )}

        <p className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-55">

          {org ? `${org.nickname} · ${org.letters}` : 'Live brand preview'}

        </p>

      </div>

    </aside>

  )

}



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

      className={`flex w-full items-center gap-3 border px-3 py-2.5 text-left transition ${

        selected

          ? 'border-[var(--primary)] bg-[var(--primary-subtle)]'

          : 'border-[var(--rule)] hover:border-[var(--ink)]'

      }`}

    >

      <span

        className="flex h-9 w-9 shrink-0 items-center justify-center font-serif text-xs text-white"

        style={{ backgroundColor: org.primaryColor }}

      >

        {org.letters}

      </span>

      <div className="min-w-0 flex-1">

        <p className="truncate text-sm font-semibold text-[var(--ink)]">{org.orgName}</p>

        <p className="truncate font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">

          {org.nickname}

        </p>

      </div>

      {selected && <Check size={14} className="shrink-0 text-[var(--primary)]" />}

    </button>

  )

}



export default function Onboarding() {

  const navigate = useNavigate()

  const { completeOnboarding } = useAuth()

  const { orgDirectory, setSelectedOrg, setChapterMeta } = useChapter()

  const { chapterLock, validateInvite, redeemInvite, registerMember } = useMembers()



  const steps = useMemo(() => {

    if (chapterLock) return ['Invite', 'Profile'] as const

    return ['Invite', 'Profile', 'Organization', 'Chapter'] as const

  }, [chapterLock])



  const [step, setStep] = useState(0)

  const [inviteInput, setInviteInput] = useState('')

  const [inviteError, setInviteError] = useState('')

  const [validatedInvite, setValidatedInvite] = useState<InviteCode | null>(null)

  const [profile, setProfile] = useState<UserProfile>({

    firstName: '',

    lastName: '',

    phone: '',

    graduationYear: new Date().getFullYear() + 1,

    avatar: '',

  })

  const [orgId, setOrgId] = useState('')

  const [chapterDesignation, setChapterDesignation] = useState('')

  const [university, setUniversity] = useState('')

  const [orgQuery, setOrgQuery] = useState('')

  const [category, setCategory] = useState<OrgCategory>('fraternity')



  const stepKey = steps[step]

  const selectedOrg = orgDirectory.find((o) => o.id === orgId) ?? null



  useEffect(() => {

    if (chapterLock) {

      setOrgId(chapterLock.orgId)

      setChapterDesignation(chapterLock.chapterDesignation)

      setUniversity(chapterLock.university)

      setSelectedOrg(chapterLock.orgId)

    }

  }, [chapterLock, setSelectedOrg])



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



  const canNext =

    stepKey === 'Invite'

      ? inviteInput.trim().length >= 4

      : stepKey === 'Profile'

        ? profile.firstName.trim() && profile.lastName.trim() && profile.phone.trim()

        : stepKey === 'Organization'

          ? !!orgId

          : stepKey === 'Chapter'

            ? chapterDesignation.trim() && university.trim()

            : false



  const selectOrg = (id: string) => {

    setOrgId(id)

    setSelectedOrg(id)

  }



  const advanceFromInvite = () => {

    const result = validateInvite(inviteInput)

    if (!result.valid || !result.invite) {

      setInviteError(result.error ?? 'Invalid code')

      return

    }

    setInviteError('')

    setValidatedInvite(result.invite)

    setStep((s) => s + 1)

  }



  const finish = () => {
    if (!validatedInvite) return
    const resolvedOrgId = chapterLock?.orgId ?? orgId
    if (!resolvedOrgId) return
    const chapter = chapterLock?.chapterDesignation ?? chapterDesignation.trim()
    const school = chapterLock?.university ?? university.trim()
    const role = validatedInvite.role
    const home = role === 'ActiveMember' || role === 'NewMember' ? '/my-dashboard' : '/home'
    const userId = getOrCreateUserId()
    const avatar = initials

    const redeemed = redeemInvite(inviteInput)
    if (!redeemed) {
      setInviteError('Invite code could not be redeemed')
      setStep(0)
      return
    }

    const { memberId } = registerMember({
      userId,
      profile: { ...profile, avatar },
      role,
      inviteCodeId: redeemed.id,
      orgId: resolvedOrgId,
      chapterDesignation: chapter,
      university: school,
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
        inviteCodeId: redeemed.id,
      })
    })

    navigate(home, { replace: true })
  }



  const goNext = () => {

    if (stepKey === 'Invite') {

      advanceFromInvite()

      return

    }

    if (step < steps.length - 1) {

      setStep((s) => s + 1)

      return

    }

    finish()

  }



  return (

    <div className="flex min-h-screen bg-[var(--surface-tint)] text-[var(--ink)]">

      <BrandPanel org={selectedOrg} />



      <div className="flex min-h-screen w-full flex-col lg:w-1/2">

        <div className="theme-stripe" />



        <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8 sm:px-10">

          <div className="mb-8 flex items-center justify-between">

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

            {stepKey === 'Invite' && (

              <div className="space-y-5">

                <div>

                  <h2 className="font-serif text-3xl tracking-tight">Chapter invite</h2>

                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">

                    Enter the code from your exec board

                  </p>

                </div>



                <label className="block">

                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">

                    Invite code

                  </span>

                  <input

                    value={inviteInput}

                    onChange={(e) => {

                      setInviteInput(e.target.value.toUpperCase())

                      setInviteError('')

                    }}

                    placeholder="ATO-MEMBER"

                    className="input-editorial mt-1 font-mono uppercase tracking-wider"

                  />

                </label>



                {inviteError && (

                  <p className="text-sm text-red-600">{inviteError}</p>

                )}



                <p className="font-mono text-[10px] leading-relaxed uppercase tracking-wider text-[var(--muted)]">

                  First chapter? Use <span className="text-[var(--ink)]">CHAPTER-FOUNDER</span> to

                  set up as President.

                </p>

                <p className="pt-3">

                  <a

                    href="/preview"

                    className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)] underline-offset-2 hover:underline"

                  >

                    Or continue as guest preview →

                  </a>

                </p>

              </div>

            )}



            {stepKey === 'Profile' && (

              <div className="space-y-5">

                <div>

                  <h2 className="font-serif text-3xl tracking-tight">Your profile</h2>

                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">

                    {validatedInvite

                      ? `Joining as ${roleLabel(validatedInvite.role)}`

                      : 'Identity for the chapter roster'}

                  </p>

                </div>



                <div className="flex items-center gap-4 border border-[var(--rule)] p-4">

                  <div

                    className="flex h-14 w-14 items-center justify-center font-serif text-lg text-white"

                    style={{ backgroundColor: 'var(--primary)' }}

                  >

                    {initials}

                  </div>

                  <label className="block flex-1">

                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">

                      Initials

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



            {stepKey === 'Organization' && (

              <div className="space-y-4">

                <div>

                  <h2 className="font-serif text-3xl tracking-tight">Select organization</h2>

                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">

                    Locks theme & vocabulary

                  </p>

                </div>



                <div className="flex flex-wrap gap-1.5">

                  {ORG_CATEGORIES.map((c) => (

                    <button

                      key={c.id}

                      type="button"

                      onClick={() => {

                        setCategory(c.id)

                        setOrgId('')

                        setOrgQuery('')

                      }}

                      className={`rounded-sm px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider ${

                        category === c.id

                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'

                          : 'border border-[var(--rule)] text-[var(--muted)]'

                      }`}

                    >

                      {c.label}

                    </button>

                  ))}

                </div>



                <div className="relative">

                  <Search

                    size={14}

                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"

                  />

                  <input

                    type="search"

                    value={orgQuery}

                    onChange={(e) => setOrgQuery(e.target.value)}

                    placeholder="Search name or letters…"

                    className="input-editorial pl-9"

                  />

                </div>



                <ul className="max-h-[42vh] space-y-1.5 overflow-y-auto">

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

                    <li className="py-8 text-center font-mono text-xs text-[var(--muted)]">

                      No matches

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



                <div className="flex items-center gap-3 border border-[var(--rule)] p-3">

                  <span

                    className="flex h-10 w-10 items-center justify-center font-serif text-sm text-white"

                    style={{ backgroundColor: selectedOrg.primaryColor }}

                  >

                    {selectedOrg.letters}

                  </span>

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-sm font-semibold">{selectedOrg.orgName}</p>

                    <button

                      type="button"

                      onClick={() => setStep(steps.findIndex((s) => s === 'Organization'))}

                      className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] underline-offset-2 hover:underline"

                    >

                      Change org

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

                    placeholder="e.g. Epsilon Pi"

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



          <div className="mt-8 flex gap-2 border-t border-[var(--rule)] pt-6">

            {step > 0 && (

              <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-ghost">

                <ArrowLeft size={14} /> Back

              </button>

            )}

            <button

              type="button"

              disabled={!canNext}

              onClick={goNext}

              className="btn-primary ml-auto"

            >

              {step < steps.length - 1 ? (

                <>

                  Next <ArrowRight size={14} />

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


