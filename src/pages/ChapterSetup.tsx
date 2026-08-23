import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell, Section } from '../components/ui/Section'
import { chapterPositions } from '../data/featureData'
import { getMember } from '../data/mockData'
import { useChapter } from '../context/ChapterContext'
import type { ChapterPosition } from '../types/features'

export default function ChapterSetup() {
  const { chapter } = useChapter()
  const [positions, setPositions] = useState(chapterPositions)
  const [newTitle, setNewTitle] = useState('')

  const addPosition = () => {
    if (!newTitle.trim()) return
    setPositions((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        title: newTitle.trim(),
        isCustom: true,
      },
    ])
    setNewTitle('')
  }

  const removePosition = (id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id && !(!p.isCustom && prev.length <= 1)))
  }

  return (
    <>
      <TopBar
        title="Chapter Setup"
        subtitle="President-only — bootstrap your chapter profile & positions"
      />
      <PageShell>
        <Section title="Chapter profile" subtitle="Started by President">
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              ['Organization', chapter.orgName],
              ['Chapter', chapter.chapterDesignation],
              ['University', chapter.university],
              ['Type', chapter.orgType],
              ['Semester', chapter.semester],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-neutral-50 px-5 py-4">
                <p className="text-xs font-medium text-neutral-500">{label}</p>
                <p className="mt-1 font-semibold text-neutral-900">{value}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Executive positions"
          subtitle="Add or remove roles as your chapter needs"
          action={
            <div className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New position title"
                className="rounded-sm border border-black/5 bg-neutral-50 px-4 py-2 text-sm outline-none focus:border-accent/40"
              />
              <button
                type="button"
                onClick={addPosition}
                className="flex items-center gap-1.5 rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus size={16} /> Add
              </button>
            </div>
          }
        >
          <div className="divide-y divide-black/5 rounded-2xl bg-neutral-50/60">
            {positions.map((pos: ChapterPosition) => {
              const member = pos.assignedMemberId
                ? getMember(pos.assignedMemberId)
                : undefined
              return (
                <div
                  key={pos.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div>
                    <p className="font-semibold text-neutral-900">{pos.title}</p>
                    <p className="text-xs font-medium text-neutral-500">
                      {member
                        ? `${member.firstName} ${member.lastName}`
                        : 'Unassigned'}
                      {pos.isCustom ? ' · Custom' : ' · Standard'}
                    </p>
                  </div>
                  {pos.isCustom && (
                    <button
                      type="button"
                      onClick={() => removePosition(pos.id)}
                      className="rounded-sm p-2 text-neutral-400 hover:bg-neutral-200 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </Section>
      </PageShell>
    </>
  )
}
