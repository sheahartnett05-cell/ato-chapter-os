import { useState } from 'react'
import { FileText, Plus, Presentation, ScrollText, Trash2, Upload } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { useChapterResources } from '../context/ChapterResourcesContext'
import { usePermissions } from '../context/AuthContext'
import type { ExecSlide } from '../types/features'

type MeetingTab = 'agenda' | 'minutes' | 'presentations' | 'files'

export default function ChapterMeetingPage() {
  const {
    meetingNotes,
    updateMeetingNotes,
    addMeetingAttachment,
    removeMeetingAttachment,
    execSlides,
    addSlide,
    deleteSlide,
  } = useChapterResources()
  const { canAccessExecTools } = usePermissions()
  const [tab, setTab] = useState<MeetingTab>('agenda')
  const [fileLabel, setFileLabel] = useState('')

  const tabs: { id: MeetingTab; label: string; icon: typeof FileText }[] = [
    { id: 'agenda', label: 'Agenda', icon: ScrollText },
    { id: 'minutes', label: 'Minutes', icon: FileText },
    { id: 'presentations', label: 'Presentations', icon: Presentation },
    { id: 'files', label: 'Files', icon: Upload },
  ]

  const onPickFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.ppt,.pptx,.doc,.docx,.key,image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      addMeetingAttachment({ label: fileLabel.trim() || file.name, fileName: file.name })
      setFileLabel('')
    }
    input.click()
  }

  return (
    <>
      <TopBar
        title="Chapter meeting"
        subtitle="Agenda, minutes, slides, and meeting files"
        showBrand={false}
      />
      <PageShell className="space-y-6">
        <div className="flex flex-wrap gap-1 border border-[var(--rule)] bg-[var(--surface-card)] p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-wider ${
                tab === id ? 'theme-pill-active' : 'theme-pill-muted'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'agenda' && (
          <section className="space-y-3">
            <p className="text-sm text-[var(--muted)]">
              Outline topics, speakers, and votes for the next chapter or exec meeting.
            </p>
            <textarea
              value={meetingNotes.agenda}
              onChange={(e) => updateMeetingNotes({ agenda: e.target.value })}
              disabled={!canAccessExecTools}
              placeholder="1. Call to order&#10;2. Old business&#10;3. …"
              className="input-editorial min-h-[280px] w-full resize-y font-mono text-sm leading-relaxed"
            />
          </section>
        )}

        {tab === 'minutes' && (
          <section className="space-y-3">
            <p className="text-sm text-[var(--muted)]">
              Record decisions, motions, and action items. Secretary can edit; members can read
              when published.
            </p>
            <textarea
              value={meetingNotes.minutes}
              onChange={(e) => updateMeetingNotes({ minutes: e.target.value })}
              disabled={!canAccessExecTools}
              placeholder="Meeting called to order at…"
              className="input-editorial min-h-[280px] w-full resize-y text-sm leading-relaxed"
            />
          </section>
        )}

        {tab === 'presentations' && (
          <section className="space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Officer slide decks and talking points for chapter meetings.
            </p>
            {canAccessExecTools && (
              <button
                type="button"
                onClick={() =>
                  addSlide({
                    position: 'Officer',
                    title: 'New slide',
                    description: '',
                    responsibilities: [],
                    talkingPoints: [],
                  })
                }
                className="btn-primary gap-1.5 text-xs"
              >
                <Plus size={14} /> Add slide
              </button>
            )}
            <ul className="divide-y divide-[var(--rule)] border border-[var(--rule)]">
              {execSlides.map((slide: ExecSlide) => (
                <li key={slide.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--ink)]">{slide.title}</p>
                    <p className="text-sm text-[var(--muted)]">{slide.position}</p>
                    {slide.description && (
                      <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                        {slide.description}
                      </p>
                    )}
                  </div>
                  {canAccessExecTools && (
                    <button
                      type="button"
                      onClick={() => deleteSlide(slide.id)}
                      className="shrink-0 p-2 text-[var(--muted)] hover:text-red-600"
                      aria-label="Delete slide"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </li>
              ))}
              {execSlides.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-[var(--muted)]">
                  No presentation slides yet.
                </li>
              )}
            </ul>
          </section>
        )}

        {tab === 'files' && (
          <section className="space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Upload agendas, slide decks, or handouts (stored locally in this browser for demo).
            </p>
            {canAccessExecTools && (
              <div className="flex flex-wrap items-end gap-2">
                <label className="block min-w-[200px] flex-1 space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    Label
                  </span>
                  <input
                    value={fileLabel}
                    onChange={(e) => setFileLabel(e.target.value)}
                    placeholder="Fall exec deck"
                    className="input-editorial w-full"
                  />
                </label>
                <button type="button" onClick={onPickFile} className="btn-primary gap-1.5 text-xs">
                  <Upload size={14} /> Upload file
                </button>
              </div>
            )}
            <ul className="divide-y divide-[var(--rule)] border border-[var(--rule)]">
              {meetingNotes.attachments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--ink)]">{a.label}</p>
                    <p className="truncate text-sm text-[var(--muted)]">{a.fileName}</p>
                  </div>
                  {canAccessExecTools && (
                    <button
                      type="button"
                      onClick={() => removeMeetingAttachment(a.id)}
                      className="shrink-0 text-[var(--muted)] hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </li>
              ))}
              {meetingNotes.attachments.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-[var(--muted)]">
                  No files uploaded yet.
                </li>
              )}
            </ul>
          </section>
        )}
      </PageShell>
    </>
  )
}
