import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { InviteCodesPanel } from '../components/settings/InviteCodesPanel'
import { useAuth } from '../context/AuthContext'
import { useChapter } from '../context/ChapterContext'
import { useGovernance } from '../context/GovernanceContext'
import { useMembers } from '../context/MembersContext'
import { ONBOARDING_ROLES, roleLabel, type UserProfile } from '../types/permissions'

type SettingsTab = 'account' | 'position' | 'invites'

function TabPills({
  active,
  onChange,
  showPosition,
  showInvites,
}: {
  active: SettingsTab
  onChange: (t: SettingsTab) => void
  showPosition: boolean
  showInvites: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        onClick={() => onChange('account')}
        className={`rounded-sm px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
          active === 'account' ? 'theme-pill-active' : 'theme-pill-muted'
        }`}
      >
        Account
      </button>
      {showPosition && (
        <button
          type="button"
          onClick={() => onChange('position')}
          className={`rounded-sm px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
            active === 'position' ? 'theme-pill-active' : 'theme-pill-muted'
          }`}
        >
          Position
        </button>
      )}
      {showInvites && (
        <button
          type="button"
          onClick={() => onChange('invites')}
          className={`rounded-sm px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
            active === 'invites' ? 'theme-pill-active' : 'theme-pill-muted'
          }`}
        >
          Invites
        </button>
      )}
    </div>
  )
}

function AccountSettings({
  profile,
  onSave,
}: {
  profile: UserProfile
  onSave: (p: Partial<UserProfile>) => void
}) {
  const [local, setLocal] = useState(profile)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifyPush, setNotifyPush] = useState(true)

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase text-neutral-400">Profile</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={local.firstName}
              onChange={(e) => setLocal({ ...local, firstName: e.target.value })}
              placeholder="First"
              className="rounded-xl border border-black/5 bg-white px-3 py-2 text-sm outline-none"
            />
            <input
              value={local.lastName}
              onChange={(e) => setLocal({ ...local, lastName: e.target.value })}
              placeholder="Last"
              className="rounded-xl border border-black/5 bg-white px-3 py-2 text-sm outline-none"
            />
          </div>
          <input
            value={local.phone}
            onChange={(e) => setLocal({ ...local, phone: e.target.value })}
            placeholder="Phone"
            className="w-full rounded-xl border border-black/5 bg-white px-3 py-2 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => onSave(local)}
            className="theme-pill-active rounded-sm px-4 py-2 text-xs font-semibold"
          >
            Save profile
          </button>
        </div>
      </div>

      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase text-neutral-400">Notifications</p>
        <ul className="space-y-1">
          {[
            { label: 'Email', checked: notifyEmail, set: setNotifyEmail },
            { label: 'Push', checked: notifyPush, set: setNotifyPush },
          ].map(({ label, checked, set }) => (
            <li key={label} className="flex items-center justify-between rounded-xl px-3 py-2.5 theme-pill-muted">
              <span className="text-sm font-medium">{label}</span>
              <button
                type="button"
                onClick={() => set(!checked)}
                className={`rounded-sm px-2.5 py-0.5 text-[10px] font-bold ${
                  checked ? 'theme-pill-active' : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {checked ? 'On' : 'Off'}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase text-neutral-400">Dues receipts</p>
        <ul className="space-y-1">
          {[
            { date: 'Aug 1, 2025', amount: 425 },
            { date: 'Jan 15, 2025', amount: 425 },
          ].map((r) => (
            <li
              key={r.date}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm theme-pill-muted"
            >
              <span>{r.date}</span>
              <span className="font-semibold tabular-nums">${r.amount}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function TreasurerPanel() {
  const { fineSchedule, updateFineSchedule } = useGovernance()
  const [rules, setRules] = useState(fineSchedule)

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-semibold uppercase text-neutral-400">Fine schedule</p>
      <ul className="space-y-1.5">
        {rules.map((r, i) => (
          <li key={r.id} className="flex items-center gap-3 rounded-xl px-3 py-2 theme-pill-muted">
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.label}</span>
            <input
              type="number"
              value={r.amount}
              onChange={(e) => {
                const next = [...rules]
                next[i] = { ...r, amount: Number(e.target.value) }
                setRules(next)
              }}
              className="w-14 rounded-lg border border-black/5 bg-white px-2 py-1 text-sm text-right"
            />
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => updateFineSchedule(rules)}
        className="theme-pill-active rounded-sm px-4 py-2 text-xs font-semibold"
      >
        Save schedule
      </button>

      <p className="pt-2 text-[10px] font-semibold uppercase text-neutral-400">Payment gateway</p>
      <div className="rounded-xl px-3 py-2.5 text-sm theme-pill-muted">Stripe · Connected</div>

      <p className="text-[10px] font-semibold uppercase text-neutral-400">Dues</p>
      <div className="flex items-center justify-between rounded-xl px-3 py-2.5 theme-pill-muted">
        <span className="text-sm">Semester total</span>
        <input
          type="number"
          defaultValue={850}
          className="w-20 rounded-lg border border-black/5 bg-white px-2 py-1 text-sm text-right"
        />
      </div>
    </div>
  )
}

function JBoardPanel() {
  const { config, updateConfig } = useGovernance()
  const { members } = useMembers()
  const [localConfig, setLocalConfig] = useState(config)

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-semibold uppercase text-neutral-400">
        Standards committee
      </p>
      <select
        value={localConfig.standardsChairId}
        onChange={(e) =>
          setLocalConfig({
            ...localConfig,
            standardsChairId: e.target.value,
            jBoardChairId: e.target.value,
          })
        }
        className="w-full rounded-xl border border-black/5 bg-white px-3 py-2 text-sm"
      >
        {members.filter((m) => m.isExec).map((m) => (
          <option key={m.id} value={m.id}>
            {m.firstName} {m.lastName}
          </option>
        ))}
      </select>

      <p className="text-[10px] font-semibold uppercase text-neutral-400">Strike policy</p>
      <ul className="space-y-1 text-sm">
        {['1st — Warning', '2nd — $25 fine', '3rd — Standards hearing'].map((line) => (
          <li key={line} className="rounded-xl px-3 py-2 theme-pill-muted">
            {line}
          </li>
        ))}
      </ul>

      <Link to="/standards" className="text-xs font-semibold text-[var(--accent)]">
        Open Standards & Accountability →
      </Link>
      <Link to="/standards/setup" className="block text-xs font-semibold text-[var(--ink)]">
        Configure module wizard →
      </Link>

      <button
        type="button"
        onClick={() => updateConfig(localConfig)}
        className="theme-pill-active rounded-sm px-4 py-2 text-xs font-semibold"
      >
        Save
      </button>
    </div>
  )
}

function AdminPanel() {
  const navigate = useNavigate()
  const { resetOnboarding } = useAuth()
  const { chapter } = useChapter()

  const rerunOnboarding = () => {
    resetOnboarding()
    navigate('/onboarding')
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase text-neutral-400">
          Chapter administration
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/chapter-setup"
            className="theme-pill-active rounded-sm px-4 py-2 text-xs font-semibold"
          >
            Assign positions, features & editors
          </Link>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="theme-pill-muted rounded-sm px-4 py-2 text-xs font-semibold"
          >
            Invites & account
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Edit chapter name, toggle features, seat officers, and choose who can edit each area.
        </p>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase text-neutral-400">Onboarding</p>
        <button
          type="button"
          onClick={rerunOnboarding}
          className="theme-pill-muted rounded-sm px-4 py-2 text-xs font-semibold"
        >
          Re-run setup wizard
        </button>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase text-neutral-400">Role matrix</p>
        <ul className="space-y-1 text-xs">
          {ONBOARDING_ROLES.map((r) => (
            <li key={r.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 theme-pill-muted">
              <span className="h-1.5 w-1.5 rounded-sm bg-[var(--accent)]" />
              {r.label}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase text-neutral-400">Chapter branding</p>
        <div className="flex gap-1">
          {[chapter.primaryColor, chapter.accentColor, chapter.secondaryColor].map((c) => (
            <span key={c} className="h-6 flex-1 rounded-lg ring-1 ring-black/5" style={{ backgroundColor: c }} />
          ))}
        </div>
        <p className="mt-2 text-[10px] text-neutral-400">
          Brand colors follow the national org selected at onboarding
        </p>
      </div>
    </div>
  )
}

function PositionDashboard() {
  const { role, permissions } = useAuth()

  if (!role || permissions.isMemberView) {
    return (
      <p className="text-sm text-neutral-500">No position tools for your role.</p>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm font-semibold text-neutral-900">{roleLabel(role)} tools</p>

      {permissions.canAccessAdminSettings && (
        <section className="rounded-xl border border-black/5 bg-neutral-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase text-neutral-400">President</p>
          <p className="mt-1 text-sm text-neutral-600">
            Assign officers, edit chapter profile, and manage who can access each tool.
          </p>
          <Link
            to="/chapter-setup"
            className="mt-3 inline-block text-xs font-semibold text-[var(--accent)]"
          >
            Open Chapter Setup →
          </Link>
        </section>
      )}

      {permissions.canAccessTreasurerSettings && (
        <section>
          {(role === 'President' || role === 'Treasurer') && (
            <>
              <p className="mb-3 text-[10px] font-semibold uppercase text-neutral-400">
                {role === 'Treasurer' ? 'Treasurer' : 'Treasurer · Overview'}
              </p>
              <TreasurerPanel />
            </>
          )}
        </section>
      )}

      {permissions.canAccessJBoardSettings && (
        <section>
          <p className="mb-3 text-[10px] font-semibold uppercase text-neutral-400">
            Standards & Accountability
          </p>
          <JBoardPanel />
        </section>
      )}

      {permissions.canManageRecruitment && role === 'RecruitmentChair' && (
        <section>
          <p className="mb-3 text-[10px] font-semibold uppercase text-neutral-400">Recruitment</p>
          <Link to="/recruitment/pipeline" className="text-xs font-semibold text-[var(--accent)]">
            Open pipeline →
          </Link>
        </section>
      )}

      {permissions.canAccessAdminSettings && (
        <section>
          <p className="mb-3 text-[10px] font-semibold uppercase text-neutral-400">Admin</p>
          <AdminPanel />
        </section>
      )}
    </div>
  )
}

export default function Settings() {
  const { profile, updateProfile, role, permissions, onboarding } = useAuth()
  const { updateMemberProfile } = useMembers()
  const location = useLocation()
  const initialTab =
    (location.state as { tab?: SettingsTab } | null)?.tab === 'invites' &&
    permissions.canManageInvites
      ? 'invites'
      : 'account'
  const [tab, setTab] = useState<SettingsTab>(initialTab)
  const hasPositionTab = !permissions.isMemberView
  const hasInvitesTab = permissions.canManageInvites

  const saveProfile = (patch: Partial<UserProfile>) => {
    updateProfile(patch)
    if (onboarding?.memberId) updateMemberProfile(onboarding.memberId, patch)
  }

  return (
    <>
      <TopBar
        title="Settings"
        subtitle={role ? roleLabel(role) : undefined}
        actions={
          <TabPills
            active={tab}
            onChange={setTab}
            showPosition={hasPositionTab}
            showInvites={hasInvitesTab}
          />
        }
      />
      <PageShell>
        {tab === 'account' && (
          <AccountSettings profile={profile} onSave={saveProfile} />
        )}
        {tab === 'position' && hasPositionTab && <PositionDashboard />}
        {tab === 'invites' && hasInvitesTab && <InviteCodesPanel />}
      </PageShell>
    </>
  )
}
