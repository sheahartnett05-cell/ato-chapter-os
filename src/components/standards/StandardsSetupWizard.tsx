import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from 'lucide-react'
import { Modal } from '../ui/Modal'
import {
  APPEAL_WINDOW_OPTIONS,
  EXCUSE_CATEGORY_OPTIONS,
  EXCUSE_LEAD_TIME_OPTIONS,
  MODULE_NAME_PRESETS,
  STANDARDS_ADMIN_ROLE_OPTIONS,
  defaultStandardsConfig,
  nextInfractionId,
  penaltyTypeLabel,
  toStandardsEnvelope,
  type FineMatrixItem,
  type InfractionPenaltyType,
  type StandardsConfig,
  type StandardsConfigEnvelope,
} from '../../types/standardsConfig'

type Step = 1 | 2 | 3

const STEP_LABELS = [
  'Terminology & Leadership',
  'Rulebook & Fine Matrix',
  'Excuses & Appeals',
] as const

interface StandardsSetupWizardProps {
  initialConfig?: StandardsConfig | null
  onComplete: (envelope: StandardsConfigEnvelope) => void
  onCancel?: () => void
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-sm border border-[var(--rule)] px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--ink)]">{label}</p>
        {description && <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? 'bg-[var(--accent)]' : 'bg-neutral-200'
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

function TagMultiSelect({
  options,
  selected,
  onChange,
}: {
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const toggle = (opt: string) => {
    onChange(
      selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]
    )
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition ${
              on
                ? 'bg-[var(--ink)] text-white'
                : 'border border-[var(--rule)] bg-white text-[var(--muted)] hover:border-black/20'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

const emptyCustom: Omit<FineMatrixItem, 'id' | 'is_active'> = {
  title: '',
  type: 'fine',
  fine_amount: 0,
  point_penalty: 0,
  custom_penalty: '',
}

export function StandardsSetupWizard({
  initialConfig,
  onComplete,
  onCancel,
}: StandardsSetupWizardProps) {
  const [step, setStep] = useState<Step>(1)
  const [config, setConfig] = useState<StandardsConfig>(
    () => initialConfig ?? defaultStandardsConfig()
  )
  const [showCustom, setShowCustom] = useState(false)
  const [customDraft, setCustomDraft] = useState(emptyCustom)

  const patch = (partial: Partial<StandardsConfig>) =>
    setConfig((prev) => ({ ...prev, ...partial }))

  const step1Valid =
    config.custom_module_name.trim().length > 0 && config.admin_roles.length > 0

  const step2Valid = config.fine_matrix.some(
    (r) => r.is_active && r.title.trim().length > 0
  )

  const step3Valid =
    config.excuse_policy.categories.length > 0 &&
    EXCUSE_LEAD_TIME_OPTIONS.includes(
      config.excuse_policy.lead_time_hours as (typeof EXCUSE_LEAD_TIME_OPTIONS)[number]
    ) &&
    APPEAL_WINDOW_OPTIONS.includes(
      config.appeal_policy.window_hours as (typeof APPEAL_WINDOW_OPTIONS)[number]
    )

  const canNext = step === 1 ? step1Valid : step === 2 ? step2Valid : step3Valid

  const progressPct = useMemo(() => (step / 3) * 100, [step])

  const updateRow = (id: string, patchRow: Partial<FineMatrixItem>) => {
    patch({
      fine_matrix: config.fine_matrix.map((r) => (r.id === id ? { ...r, ...patchRow } : r)),
    })
  }

  const removeRow = (id: string) => {
    patch({ fine_matrix: config.fine_matrix.filter((r) => r.id !== id) })
  }

  const addCustomInfraction = () => {
    if (!customDraft.title.trim()) return
    const item: FineMatrixItem = {
      id: nextInfractionId(config.fine_matrix),
      title: customDraft.title.trim(),
      type: customDraft.type,
      fine_amount: Number(customDraft.fine_amount) || 0,
      point_penalty: Number(customDraft.point_penalty) || 0,
      custom_penalty: customDraft.custom_penalty?.trim() || undefined,
      is_active: true,
    }
    patch({ fine_matrix: [...config.fine_matrix, item] })
    setCustomDraft(emptyCustom)
    setShowCustom(false)
  }

  const goNext = () => {
    if (!canNext) return
    if (step < 3) setStep((s) => (s + 1) as Step)
    else onComplete(toStandardsEnvelope(config))
  }

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step)
    else onCancel?.()
  }

  const toggleAdminRole = (role: string) => {
    const next = config.admin_roles.includes(role)
      ? config.admin_roles.filter((r) => r !== role)
      : [...config.admin_roles, role]
    patch({ admin_roles: next })
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      {/* Progress */}
      <div className="border-b border-[var(--rule)] bg-[var(--surface-card)] px-4 py-5 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
              Step {step} of 3
            </p>
            <p className="text-sm font-medium text-[var(--ink)]">{STEP_LABELS[step - 1]}</p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <ol className="mt-3 flex gap-2">
            {STEP_LABELS.map((label, i) => {
              const n = (i + 1) as Step
              const active = n === step
              const done = n < step
              return (
                <li
                  key={label}
                  className={`flex-1 truncate font-mono text-[9px] uppercase tracking-wider ${
                    active
                      ? 'text-[var(--ink)]'
                      : done
                        ? 'text-[var(--accent)]'
                        : 'text-neutral-300'
                  }`}
                >
                  {n}. {label}
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-10">
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-2xl tracking-tight text-[var(--ink)]">
                Terminology & Leadership Access
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Name the module and choose which officers can administer it.
              </p>
            </div>

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Custom Tab / Module Name
              </span>
              <input
                value={config.custom_module_name}
                onChange={(e) => patch({ custom_module_name: e.target.value })}
                className="input-editorial mt-1.5 w-full"
                placeholder="Standards"
              />
            </label>

            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Quick select
              </p>
              <div className="flex flex-wrap gap-2">
                {MODULE_NAME_PRESETS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => patch({ custom_module_name: name })}
                    className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition ${
                      config.custom_module_name === name
                        ? 'bg-[var(--accent)] text-white'
                        : 'border border-[var(--rule)] text-[var(--muted)] hover:border-black/20'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Which officer roles have full admin access to manage this module?
              </p>
              <ul className="mt-3 divide-y divide-[var(--rule)] rounded-sm border border-[var(--rule)]">
                {STANDARDS_ADMIN_ROLE_OPTIONS.map((role) => {
                  const checked = config.admin_roles.includes(role)
                  return (
                    <li key={role}>
                      <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-black/[0.02]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAdminRole(role)}
                          className="rounded border-neutral-300 text-[var(--accent)]"
                        />
                        <span className="text-sm font-medium text-[var(--ink)]">{role}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
              {!config.admin_roles.length && (
                <p className="mt-2 text-xs text-amber-700">Select at least one admin role.</p>
              )}
            </div>

            <Toggle
              checked={config.privacy_enabled}
              onChange={(privacy_enabled) => patch({ privacy_enabled })}
              label="Private Hearing Logs"
              description="When enabled, hearing records and case details are restricted strictly to assigned board admins and the accused member."
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl tracking-tight text-[var(--ink)]">
                Rulebook & Fine Matrix
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Enable presets and add custom infractions for your chapter.
              </p>
            </div>

            <div className="overflow-x-auto rounded-sm border border-[var(--rule)]">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--rule)] bg-neutral-50 font-mono text-[9px] uppercase tracking-wider text-[var(--muted)]">
                    <th className="px-3 py-2.5">Infraction Name</th>
                    <th className="px-3 py-2.5">Penalty Type</th>
                    <th className="px-3 py-2.5">Fine ($)</th>
                    <th className="px-3 py-2.5">Points</th>
                    <th className="px-3 py-2.5 text-center">On</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--rule)]">
                  {config.fine_matrix.map((row) => (
                    <tr key={row.id} className={!row.is_active ? 'opacity-50' : undefined}>
                      <td className="px-3 py-2">
                        <input
                          value={row.title}
                          onChange={(e) => updateRow(row.id, { title: e.target.value })}
                          className="w-full min-w-[140px] border-0 bg-transparent text-sm font-medium outline-none focus:ring-0"
                        />
                        {row.type === 'custom' && row.custom_penalty && (
                          <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                            {row.custom_penalty}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={row.type}
                          onChange={(e) =>
                            updateRow(row.id, {
                              type: e.target.value as InfractionPenaltyType,
                            })
                          }
                          className="rounded-sm border border-[var(--rule)] bg-white px-2 py-1.5 text-xs"
                        >
                          <option value="fine">Fine</option>
                          <option value="points">Points</option>
                          <option value="both">Both</option>
                          <option value="custom">Custom</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          disabled={row.type === 'points' || row.type === 'custom'}
                          value={row.fine_amount}
                          onChange={(e) =>
                            updateRow(row.id, { fine_amount: Number(e.target.value) || 0 })
                          }
                          className="w-20 rounded-sm border border-[var(--rule)] px-2 py-1.5 text-xs disabled:bg-neutral-50"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          disabled={row.type === 'fine' || row.type === 'custom'}
                          value={row.point_penalty}
                          onChange={(e) =>
                            updateRow(row.id, { point_penalty: Number(e.target.value) || 0 })
                          }
                          className="w-16 rounded-sm border border-[var(--rule)] px-2 py-1.5 text-xs disabled:bg-neutral-50"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.is_active}
                          onClick={() => updateRow(row.id, { is_active: !row.is_active })}
                          className={`relative inline-block h-6 w-10 rounded-full transition ${
                            row.is_active ? 'bg-[var(--accent)]' : 'bg-neutral-200'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                              row.is_active ? 'left-4' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="rounded-sm p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-red-600"
                          aria-label={`Remove ${row.title}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="flex items-center gap-1.5 rounded-sm border border-dashed border-[var(--rule)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] hover:border-black/25 hover:bg-black/[0.02]"
            >
              <Plus size={16} /> Add Custom Infraction
            </button>

            {!step2Valid && (
              <p className="text-xs text-amber-700">
                Enable at least one named infraction to continue.
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-2xl tracking-tight text-[var(--ink)]">
                Excuses & Appeals Policy
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Set lead times, accepted categories, and how appeals lock into billing.
              </p>
            </div>

            <div className="space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Excuse submission rules
              </p>
              <label className="block">
                <span className="text-xs font-medium text-[var(--ink)]">
                  Excuse Lead Time (Hours before event start)
                </span>
                <select
                  value={config.excuse_policy.lead_time_hours}
                  onChange={(e) =>
                    patch({
                      excuse_policy: {
                        ...config.excuse_policy,
                        lead_time_hours: Number(e.target.value),
                      },
                    })
                  }
                  className="input-editorial mt-1.5 w-full max-w-xs"
                >
                  {EXCUSE_LEAD_TIME_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {h} hours
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <p className="mb-2 text-xs font-medium text-[var(--ink)]">
                  Accepted Excuse Categories
                </p>
                <TagMultiSelect
                  options={EXCUSE_CATEGORY_OPTIONS}
                  selected={config.excuse_policy.categories}
                  onChange={(categories) =>
                    patch({
                      excuse_policy: { ...config.excuse_policy, categories },
                    })
                  }
                />
              </div>

              <Toggle
                checked={config.excuse_policy.require_attachment}
                onChange={(require_attachment) =>
                  patch({
                    excuse_policy: { ...config.excuse_policy, require_attachment },
                  })
                }
                label="Require Photo/File Attachment for Excuses"
              />
            </div>

            <div className="space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Appeals & hearing window
              </p>
              <label className="block">
                <span className="text-xs font-medium text-[var(--ink)]">
                  Member Appeal Window (Hours after fine/citation is issued)
                </span>
                <select
                  value={config.appeal_policy.window_hours}
                  onChange={(e) =>
                    patch({
                      appeal_policy: {
                        ...config.appeal_policy,
                        window_hours: Number(e.target.value),
                      },
                    })
                  }
                  className="input-editorial mt-1.5 w-full max-w-xs"
                >
                  {APPEAL_WINDOW_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {h === 168 ? '168 (1 Week)' : `${h} hours`}
                    </option>
                  ))}
                </select>
              </label>

              <Toggle
                checked={config.appeal_policy.auto_lock_fines}
                onChange={(auto_lock_fines) =>
                  patch({
                    appeal_policy: { ...config.appeal_policy, auto_lock_fines },
                  })
                }
                label="Auto-Lock Fines"
                description="Automatically send finalized fines to billing after appeal window expires."
              />
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 z-10 border-t border-[var(--rule)] bg-[var(--surface-card)]/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1.5 rounded-sm border border-[var(--rule)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-black/[0.02]"
          >
            <ArrowLeft size={16} />
            {step === 1 ? (onCancel ? 'Cancel' : 'Back') : 'Back'}
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={goNext}
            className="flex items-center gap-1.5 rounded-sm bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step === 3 ? (
              <>
                <Check size={16} /> Save & Finish
              </>
            ) : (
              <>
                Next <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      <Modal open={showCustom} onClose={() => setShowCustom(false)} title="Add Custom Infraction" size="md">
        <div className="space-y-4">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Infraction Title
            </span>
            <input
              value={customDraft.title}
              onChange={(e) => setCustomDraft({ ...customDraft, title: e.target.value })}
              className="input-editorial mt-1 w-full"
              placeholder="e.g. Missed chapter cleanup"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Penalty Type
            </span>
            <select
              value={customDraft.type}
              onChange={(e) =>
                setCustomDraft({
                  ...customDraft,
                  type: e.target.value as InfractionPenaltyType,
                })
              }
              className="input-editorial mt-1 w-full"
            >
              <option value="fine">Monetary Fine</option>
              <option value="points">Point Deduction</option>
              <option value="both">Both</option>
              <option value="custom">Custom Action</option>
            </select>
          </label>
          {(customDraft.type === 'fine' || customDraft.type === 'both') && (
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Fine Amount ($)
              </span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={customDraft.fine_amount}
                onChange={(e) =>
                  setCustomDraft({ ...customDraft, fine_amount: Number(e.target.value) || 0 })
                }
                className="input-editorial mt-1 w-full"
              />
            </label>
          )}
          {(customDraft.type === 'points' || customDraft.type === 'both') && (
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Point Deduction Value
              </span>
              <input
                type="number"
                min={0}
                value={customDraft.point_penalty}
                onChange={(e) =>
                  setCustomDraft({
                    ...customDraft,
                    point_penalty: Number(e.target.value) || 0,
                  })
                }
                className="input-editorial mt-1 w-full"
              />
            </label>
          )}
          {customDraft.type === 'custom' && (
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Custom Penalty
              </span>
              <input
                value={customDraft.custom_penalty ?? ''}
                onChange={(e) =>
                  setCustomDraft({ ...customDraft, custom_penalty: e.target.value })
                }
                className="input-editorial mt-1 w-full"
                placeholder='e.g. "Loss of Social Privileges for 2 Weeks"'
              />
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCustom(false)}
              className="rounded-sm border border-[var(--rule)] px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!customDraft.title.trim()}
              onClick={addCustomInfraction}
              className="rounded-sm bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Add {penaltyTypeLabel(customDraft.type)}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
