import { useState } from 'react'
import { ChevronRight, Copy, Check, Presentation, Pencil, Plus, Trash2 } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import { useChapterResources } from '../context/ChapterResourcesContext'
import { usePermissions } from '../context/AuthContext'
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

function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

const emptyDraft = (): Omit<ExecSlide, 'id'> => ({
  position: '',
  title: '',
  description: '',
  responsibilities: [],
  talkingPoints: [],
})

export default function ExecSlides() {
  const { execSlides, updateSlide, addSlide, deleteSlide } = useChapterResources()
  const { canAccessExecTools } = usePermissions()

  const [active, setActive] = useState<ExecSlide | null>(null)
  const [copied, setCopied] = useState(false)
  const [presentMode, setPresentMode] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft] = useState<Omit<ExecSlide, 'id'>>(emptyDraft())
  const [respText, setRespText] = useState('')
  const [talkText, setTalkText] = useState('')

  const openSlide = (slide: ExecSlide, editing: boolean) => {
    setActive(slide)
    setPresentMode(false)
    setEditMode(editing)
    setDraft({
      position: slide.position,
      title: slide.title,
      description: slide.description,
      responsibilities: slide.responsibilities,
      talkingPoints: slide.talkingPoints,
    })
    setRespText(slide.responsibilities.join('\n'))
    setTalkText(slide.talkingPoints.join('\n'))
  }

  const openNew = () => {
    setActive(null)
    setEditMode(true)
    setDraft(emptyDraft())
    setRespText('')
    setTalkText('')
  }

  const saveEdit = () => {
    const payload = {
      ...draft,
      responsibilities: linesToList(respText),
      talkingPoints: linesToList(talkText),
    }
    if (active) {
      updateSlide(active.id, payload)
      setActive({ ...active, ...payload })
    } else {
      const created = addSlide(payload)
      setActive(created)
    }
    setEditMode(false)
  }

  const copySlide = async (slide: ExecSlide) => {
    try {
      await navigator.clipboard.writeText(slideToText(slide))
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
        subtitle="Editable decks for elections & officer transitions"
        actions={
          canAccessExecTools ? (
            <button type="button" onClick={openNew} className="btn-primary gap-1.5 text-xs">
              <Plus size={14} /> New slide
            </button>
          ) : undefined
        }
      />
      <PageShell>
        <p className="mb-4 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
          Open, edit, present, or copy to Google Slides
        </p>

        {execSlides.length === 0 ? (
          <p className="py-10 text-center font-mono text-xs text-[var(--muted)]">
            No slides yet. Create a template for each officer role.
          </p>
        ) : (
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
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {canAccessExecTools && (
                    <button
                      type="button"
                      onClick={() => openSlide(slide, true)}
                      className="btn-ghost gap-1 text-xs"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openSlide(slide, false)}
                    className="btn-primary shrink-0 gap-1 text-xs"
                  >
                    Open <ChevronRight size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageShell>

      <Modal
        open={editMode}
        onClose={() => setEditMode(false)}
        title={active ? 'Edit slide' : 'New slide'}
        size="lg"
      >
        <div className="space-y-3">
          <input
            className="input-editorial"
            placeholder="Position (e.g. President)"
            value={draft.position}
            onChange={(e) => setDraft({ ...draft, position: e.target.value })}
          />
          <input
            className="input-editorial"
            placeholder="Slide title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <textarea
            className="input-editorial min-h-[72px] resize-none"
            placeholder="Description"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Responsibilities (one per line)
            </span>
            <textarea
              className="input-editorial mt-1 min-h-[100px] resize-y font-mono text-xs"
              value={respText}
              onChange={(e) => setRespText(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Talking points (one per line)
            </span>
            <textarea
              className="input-editorial mt-1 min-h-[80px] resize-y font-mono text-xs"
              value={talkText}
              onChange={(e) => setTalkText(e.target.value)}
            />
          </label>
          <div className="flex gap-2 border-t border-[var(--rule)] pt-4">
            <button type="button" onClick={saveEdit} className="btn-primary flex-1">
              Save slide
            </button>
            {active && canAccessExecTools && (
              <button
                type="button"
                onClick={() => {
                  deleteSlide(active.id)
                  setEditMode(false)
                  setActive(null)
                }}
                className="btn-ghost gap-1 text-red-700"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={active != null && !editMode && !presentMode}
        onClose={() => setActive(null)}
        title={active?.title ?? 'Slide'}
        size="lg"
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
              {canAccessExecTools && (
                <button
                  type="button"
                  onClick={() => openSlide(active, true)}
                  className="btn-ghost gap-1 text-xs"
                >
                  <Pencil size={14} /> Edit
                </button>
              )}
              <button
                type="button"
                onClick={() => setPresentMode(true)}
                className="btn-primary gap-1 text-xs"
              >
                <Presentation size={14} /> Present
              </button>
              <button
                type="button"
                onClick={() => copySlide(active)}
                className="btn-ghost gap-1 text-xs"
              >
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
            <button
              type="button"
              onClick={() => copySlide(active)}
              className="btn-ghost text-xs text-white"
            >
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
