import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Shield, Smartphone } from 'lucide-react'
import { AgoraMark } from '../components/layout/Logo'
import { useAuth } from '../context/AuthContext'
import { AGORA_PRODUCT_NAME } from '../lib/brandCopy'
import { enterGuestPreview } from '../lib/enterGuestPreview'
import {
  GUEST_EXEC_FUNCTION_PRESETS,
  isGuestPreviewActive,
  type GuestExecFunctionPreset,
  type GuestPreviewMode,
} from '../lib/guestPreview'

const STEPS = ['role', 'function', 'confirm'] as const

export default function DemoPreview() {
  const { isOnboarded, onboarding } = useAuth()
  const inRealSession = isOnboarded && onboarding?.isGuest !== true && !isGuestPreviewActive()
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<GuestPreviewMode | null>(null)
  const [execPreset, setExecPreset] = useState<GuestExecFunctionPreset | null>(null)
  const visibleSteps = mode === 'member' ? (['role', 'confirm'] as const) : STEPS
  const visibleKey = visibleSteps[Math.min(step, visibleSteps.length - 1)]

  const goNextFromRole = () => {
    if (mode === 'member') setStep(2)
    else setStep(1)
  }

  const openDemo = () => {
    if (!mode) return
    enterGuestPreview(mode, mode === 'exec' ? execPreset ?? undefined : undefined)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-tint)] text-[var(--ink)]">
      <div className="theme-stripe" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)]"
          >
            <ArrowLeft size={14} /> Home
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Demo {Math.min(step, visibleSteps.length - 1) + 1} / {visibleSteps.length}
          </p>
        </div>

        <div className="mb-8 flex items-center gap-3">
          <AgoraMark size={36} />
          <p className="font-serif text-lg tracking-tight">{AGORA_PRODUCT_NAME}</p>
        </div>

        {visibleKey === 'role' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-3xl tracking-tight">Which view do you want?</h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Same sample chapter either way. You can leave and pick the other view later.
              </p>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMode('exec')
                  setExecPreset(GUEST_EXEC_FUNCTION_PRESETS[0])
                }}
                className={`flex w-full items-start gap-4 border p-5 text-left transition ${
                  mode === 'exec'
                    ? 'border-[var(--ink)] bg-[var(--surface-card)]'
                    : 'border-[var(--rule)] bg-[var(--surface-card)] hover:border-[var(--ink)]'
                }`}
              >
                <Shield size={20} className="mt-0.5 shrink-0" strokeWidth={1.5} />
                <span>
                  <span className="block font-semibold">Officer</span>
                  <span className="mt-1 block text-sm text-[var(--muted)]">
                    Officer Home tiles by seat function.
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('member')
                  setExecPreset(null)
                }}
                className={`flex w-full items-start gap-4 border p-5 text-left transition ${
                  mode === 'member'
                    ? 'border-[var(--ink)] bg-[var(--surface-card)]'
                    : 'border-[var(--rule)] bg-[var(--surface-card)] hover:border-[var(--ink)]'
                }`}
              >
                <Smartphone size={20} className="mt-0.5 shrink-0" strokeWidth={1.5} />
                <span>
                  <span className="block font-semibold">Member</span>
                  <span className="mt-1 block text-sm text-[var(--muted)]">
                    Chapter Room with the member bottom nav.
                  </span>
                </span>
              </button>
            </div>
          </div>
        )}

        {visibleKey === 'function' && mode === 'exec' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-3xl tracking-tight">Which officer seat?</h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Home tiles change with the function you pick.
              </p>
            </div>
            <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
              {GUEST_EXEC_FUNCTION_PRESETS.map((preset) => (
                <li key={preset.function}>
                  <button
                    type="button"
                    onClick={() => setExecPreset(preset)}
                    className={`flex w-full flex-col border px-4 py-3 text-left transition ${
                      execPreset?.function === preset.function
                        ? 'border-[var(--ink)] bg-[var(--surface-card)]'
                        : 'border-[var(--rule)] hover:border-[var(--ink)]'
                    }`}
                  >
                    <span className="font-semibold text-[var(--ink)]">{preset.label}</span>
                    <span className="mt-0.5 text-xs text-[var(--muted)]">{preset.hint}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {visibleKey === 'confirm' && mode && (
          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-3xl tracking-tight">
                {mode === 'exec'
                  ? `${execPreset?.label ?? 'Officer'} demo`
                  : 'Member demo'}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                This opens a sample chapter. It stays in this browser and is not a real account.
              </p>
            </div>
            <ul className="space-y-2 border border-[var(--rule)] bg-[var(--surface-card)] p-4 text-sm text-[var(--ink)]">
              <li>Dates and members are sample data.</li>
              <li>Exit from the gold bar at the top whenever you want.</li>
              <li>Nothing here creates a login or touches your cloud chapter.</li>
            </ul>
            {inRealSession && (
              <p className="text-sm text-amber-950">
                You have a saved chapter in this browser. Starting the demo sets that aside until you
                exit.
              </p>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 border-t border-[var(--rule)] pt-6">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => (mode === 'member' && s === 2 ? 0 : s - 1))}
              className="btn-ghost"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
          {visibleKey === 'role' ? (
            <button
              type="button"
              disabled={!mode}
              onClick={goNextFromRole}
              className="btn-primary ml-auto disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue <ArrowRight size={14} />
            </button>
          ) : visibleKey === 'function' ? (
            <button
              type="button"
              disabled={!execPreset}
              onClick={() => setStep(2)}
              className="btn-primary ml-auto disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button type="button" disabled={!mode} onClick={openDemo} className="btn-primary ml-auto">
              Open the demo <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
