import { useState } from 'react'
import { ChevronRight, Copy, Check, Presentation } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import { execSlides } from '../data/featureData'
import type { ExecSlide } from '../types/features'

function slideToText(slide: ExecSlide): string {
  return [
    slide.title,
    slide.position,
    '',
    slide.description,
    '',
    'RESPONSIBILITIES',
    ...slide.responsibilities.map((r) => `• ${r}`),
    '',
    'TALKING POINTS',
    ...slide.talkingPoints.map((t) => `• ${t}`),
  ].join('\n')
}

export default function ExecSlides() {
  const [active, setActive] = useState<ExecSlide | null>(null)
  const [copied, setCopied] = useState(false)
  const [presentMode, setPresentMode] = useState(false)

  const copySlide = async () => {
    if (!active) return
    try {
      await navigator.clipboard.writeText(slideToText(active))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <>
      <TopBar
        title="Exec Position Slides"
        subtitle="Premade decks for elections & officer transitions"
      />
      <PageShell>
        <p className="mb-4 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
          Templates for each officer role — open, present, or copy to Google Slides
        </p>
        <ul className="divide-y divide-[var(--rule)] border border-[var(--rule)]">
          {execSlides.map((slide) => (
            <li key={slide.id} className="flex flex-wrap items-start justify-between gap-4 px-4 py-5">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--primary)]">
                  {slide.position}
                </p>
                <h3 className="mt-1 font-serif text-xl tracking-tight text-[var(--ink)]">
                  {slide.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{slide.description}</p>
                <ul className="mt-4 space-y-1.5">
                  {slide.responsibilities.slice(0, 3).map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-sm text-[var(--ink)]"
                    >
                      <span className="mt-2 h-px w-3 shrink-0 bg-[var(--accent)]" />
                      {r}
                    </li>
                  ))}
                  {slide.responsibilities.length > 3 && (
                    <li className="font-mono text-[10px] text-[var(--muted)]">
                      +{slide.responsibilities.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActive(slide)
                  setPresentMode(false)
                }}
                className="btn-primary shrink-0 gap-1 text-xs"
              >
                Use template <ChevronRight size={14} />
              </button>
            </li>
          ))}
        </ul>
      </PageShell>

      <Modal
        open={active != null && !presentMode}
        onClose={() => setActive(null)}
        title={active?.title ?? 'Slide'}
      >
        {active && (
          <div className="space-y-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              {active.position}
            </p>
            <p className="text-sm leading-relaxed text-[var(--muted)]">{active.description}</p>

            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Responsibilities
              </p>
              <ul className="list-editorial space-y-2">
                {active.responsibilities.map((r) => (
                  <li key={r} className="text-sm text-[var(--ink)]">
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Talking points
              </p>
              <ul className="list-editorial space-y-2">
                {active.talkingPoints.map((t) => (
                  <li key={t} className="text-sm text-[var(--ink)]">
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-[var(--rule)] pt-4">
              <button
                type="button"
                onClick={() => setPresentMode(true)}
                className="btn-primary gap-1 text-xs"
              >
                <Presentation size={14} /> Present
              </button>
              <button type="button" onClick={copySlide} className="btn-ghost gap-1 text-xs">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy outline'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {active && presentMode && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <div className="theme-stripe shrink-0" />
          <div className="flex flex-1 flex-col justify-center px-8 py-12 md:px-16">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">
              {active.position}
            </p>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">
              {active.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg opacity-85">{active.description}</p>

            <div className="mt-12 grid gap-10 md:grid-cols-2">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider opacity-50">
                  Responsibilities
                </p>
                <ul className="mt-4 space-y-3">
                  {active.responsibilities.map((r) => (
                    <li key={r} className="flex gap-3 text-base">
                      <span className="mt-2.5 h-px w-6 shrink-0 bg-[var(--accent)]" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider opacity-50">
                  Talking points
                </p>
                <ul className="mt-4 space-y-3">
                  {active.talkingPoints.map((t) => (
                    <li key={t} className="text-base opacity-90">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-white/10 px-6 py-4">
            <button type="button" onClick={copySlide} className="btn-ghost text-xs text-white">
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPresentMode(false)
                setActive(null)
              }}
              className="rounded-sm px-4 py-2 text-xs font-semibold"
              style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
            >
              Exit
            </button>
          </div>
        </div>
      )}
    </>
  )
}
