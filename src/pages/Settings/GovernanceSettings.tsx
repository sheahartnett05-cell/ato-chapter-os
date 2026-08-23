import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '../../components/layout/TopBar'
import { PageShell } from '../../components/ui/Section'
import { useGovernance } from '../../context/GovernanceContext'
import { getMember, members } from '../../data/mockData'

export default function GovernanceSettings() {
  const { fineSchedule, config, updateConfig, updateFineSchedule } = useGovernance()
  const [rules, setRules] = useState(fineSchedule)
  const [localConfig, setLocalConfig] = useState(config)

  const save = () => {
    updateFineSchedule(rules)
    updateConfig(localConfig)
  }

  return (
    <>
      <TopBar
        title="Governance Settings"
        subtitle="Fines · J-Board · Permissions"
        actions={
          <button
            type="button"
            onClick={save}
            className="rounded-sm bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-white"
          >
            Save
          </button>
        }
      />
      <PageShell className="space-y-6">
        {/* Fine schedule */}
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase text-neutral-400">
            Fine schedule
          </p>
          <ul className="space-y-2">
            {rules.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.label}</span>
                <input
                  type="number"
                  value={r.amount}
                  onChange={(e) => {
                    const next = [...rules]
                    next[i] = { ...r, amount: Number(e.target.value) }
                    setRules(next)
                  }}
                  className="w-16 rounded-lg border border-black/5 bg-white px-2 py-1 text-sm text-right"
                />
                <span className="text-xs text-neutral-400">$</span>
              </li>
            ))}
          </ul>
        </div>

        {/* J-Board setup */}
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase text-neutral-400">
            J-Board committee
          </p>
          <div className="space-y-3 rounded-xl bg-neutral-50 p-4">
            <label className="block">
              <span className="text-[11px] font-medium text-neutral-500">Standards Chair</span>
              <select
                value={localConfig.standardsChairId}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, standardsChairId: e.target.value, jBoardChairId: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-black/5 bg-white px-3 py-2 text-sm"
              >
                {members.filter((m) => m.isExec).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} — {m.role}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localConfig.casesHiddenFromMembers}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, casesHiddenFromMembers: e.target.checked })
                }
                className="rounded border-neutral-300"
              />
              <span className="text-sm text-neutral-700">Hide cases from non-committee members</span>
            </label>
            <p className="text-[10px] text-neutral-400">
              Members: {localConfig.jBoardMemberIds.map((id) => getMember(id)?.firstName).join(', ')}
            </p>
          </div>
        </div>

        {/* Permissions summary */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase text-neutral-400">Permissions</p>
          <ul className="space-y-1 text-sm text-neutral-600">
            <li className="flex items-center gap-2 rounded-lg px-2 py-1.5">
              <span className="h-1.5 w-1.5 rounded-sm bg-[var(--accent)]" />
              Members → own fines & cases only
            </li>
            <li className="flex items-center gap-2 rounded-lg px-2 py-1.5">
              <span className="h-1.5 w-1.5 rounded-sm bg-[var(--primary)]" />
              J-Board / Exec → full ledger
            </li>
          </ul>
          <Link
            to="/judicial-board"
            className="mt-3 inline-block text-xs font-semibold text-[var(--accent)]"
          >
            Open J-Board →
          </Link>
        </div>
      </PageShell>
    </>
  )
}
