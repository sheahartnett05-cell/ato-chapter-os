import type { ReactNode } from 'react'
import {
  CalendarDays,
  DollarSign,
  Megaphone,
  Scale,
  Users,
  UserSearch,
} from 'lucide-react'
import { ChapteraMark } from '../layout/Logo'
import { OrgCrest } from '../ui/OrgCrest'
import { CHAPTERA_PRODUCT_NAME, CHAPTERA_TAGLINE } from '../../lib/brandCopy'
import { contrastText } from '../../lib/themeUtils'
import type { NationalOrg } from '../../data/nationalOrgs'

const ORG_MOTTOS: Record<string, string> = {
  ato: 'Established 1865 · Friendship · Truth',
  'sigma-chi': 'In Hoc Signo Vinces',
  'kappa-sigma': 'Bononia Docet',
  'zeta-tau-alpha': 'Seek the Noblest',
  'delta-gamma': 'Do Good',
  aka: 'By Culture and By Merit',
}

const CHAPTERA_FEATURES = [
  {
    icon: Users,
    title: 'Roster & roles',
    body: 'Members, officers, invite codes',
  },
  {
    icon: CalendarDays,
    title: 'Events & calendar',
    body: 'RSVPs, attendance, excuses',
  },
  {
    icon: UserSearch,
    title: 'Recruitment',
    body: 'Pipeline, PNMs, intake forms',
  },
  {
    icon: Scale,
    title: 'Standards',
    body: 'Cases, fines, committees',
  },
  {
    icon: DollarSign,
    title: 'Dues & budgets',
    body: 'Treasurer tools, allotments',
  },
  {
    icon: Megaphone,
    title: 'Communications',
    body: 'Announcements, polls, sign-ups',
  },
] as const

function ArchPattern({ accent }: { accent: string }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="chaptera-columns" width="72" height="120" patternUnits="userSpaceOnUse">
          <rect x="8" y="0" width="3" height="120" fill={accent} opacity="0.9" />
          <rect x="61" y="0" width="3" height="120" fill={accent} opacity="0.9" />
          <path
            d="M8 28 Q36 8 64 28"
            fill="none"
            stroke={accent}
            strokeWidth="2.5"
            opacity="0.85"
          />
          <rect x="0" y="108" width="72" height="2" fill={accent} opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#chaptera-columns)" />
    </svg>
  )
}

function FeatureTile({
  icon: Icon,
  title,
  body,
  accent,
  fg,
}: {
  icon: typeof Users
  title: string
  body: string
  accent: string
  fg: string
}) {
  return (
    <li
      className="flex gap-3 rounded-sm border px-3.5 py-3 backdrop-blur-sm"
      style={{
        borderColor: `${fg}14`,
        backgroundColor: `${fg}08`,
      }}
    >
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm"
        style={{ backgroundColor: `${accent}22`, color: accent }}
      >
        <Icon size={15} strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="mt-0.5 text-xs leading-snug opacity-65">{body}</p>
      </div>
    </li>
  )
}

export function BrandHeroPanel({
  org,
  variant = 'onboarding',
  headline,
  description,
  footer,
}: {
  org: NationalOrg | null
  variant?: 'onboarding' | 'guest'
  headline?: string
  description?: string
  footer?: ReactNode
}) {
  const primary = org?.primaryColor ?? '#1a1a1a'
  const accent = org?.accentColor ?? '#c4a35a'
  const fg = contrastText(primary)

  const defaultHeadline = org
    ? `Welcome, ${org.nickname}`
    : variant === 'guest'
      ? 'Tour Chaptera as a guest'
      : 'Your chapter, one workspace'

  const defaultDescription = org
    ? (ORG_MOTTOS[org.id] ?? `${org.orgType} · ${org.orgName}`)
    : variant === 'guest'
      ? 'Explore officer and member views with demo data — nothing leaves this browser.'
      : CHAPTERA_TAGLINE

  return (
    <aside
      className="relative hidden min-h-screen overflow-hidden lg:flex lg:w-1/2 lg:flex-col"
      style={{ backgroundColor: primary, color: fg }}
    >
      <div className="h-[3px] shrink-0" style={{ backgroundColor: accent }} aria-hidden />

      <ArchPattern accent={accent} />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 100% 0%, ${accent}18, transparent 55%), radial-gradient(ellipse 60% 50% at 0% 100%, ${accent}10, transparent 50%)`,
        }}
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col justify-between p-10 xl:p-14">
        <div className="flex items-center gap-3">
          {org ? (
            <OrgCrest org={org} size={44} />
          ) : (
            <ChapteraMark size={44} onDark={fg === '#ffffff'} />
          )}
          <div className="min-w-0 leading-tight">
            <p className="font-serif text-lg tracking-tight">
              {org ? org.orgName : CHAPTERA_PRODUCT_NAME}
            </p>
            {!org && (
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] opacity-55">
                {CHAPTERA_TAGLINE}
              </p>
            )}
          </div>
        </div>

        <div className="max-w-lg py-8">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-50"
            style={{ color: accent }}
          >
            {org ? org.orgType : variant === 'guest' ? 'Guest preview' : 'Chapter platform'}
          </p>
          <h1 className="mt-3 font-serif text-[2.35rem] leading-[1.1] tracking-tight xl:text-[2.75rem]">
            {headline ?? defaultHeadline}
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed opacity-80">
            {description ?? defaultDescription}
          </p>

          {!org && (
            <ul className="mt-8 grid gap-2 sm:grid-cols-2">
              {CHAPTERA_FEATURES.map((f) => (
                <FeatureTile key={f.title} {...f} accent={accent} fg={fg} />
              ))}
            </ul>
          )}
        </div>

        <div className="border-t pt-6" style={{ borderColor: `${fg}18` }}>
          {org ? (
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="font-serif text-lg tracking-tight">{org.nickname}</p>
                <p className="mt-1 text-sm opacity-65">Your app theme uses these colors</p>
              </div>
              <div className="flex gap-2">
                {[org.primaryColor, org.accentColor, org.secondaryColor].map((c) => (
                  <span
                    key={c}
                    className="h-9 w-9 rounded-sm border border-white/10 shadow-sm"
                    style={{ backgroundColor: c }}
                    aria-hidden
                  />
                ))}
              </div>
            </div>
          ) : (
            (footer ?? (
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-45">
                Calendar · Roster · Recruitment · Dues · Standards
              </p>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}
