import { Link } from 'react-router-dom'
import { Users, ChevronRight } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { useGovernance } from '../context/GovernanceContext'
import { getMember } from '../data/mockData'

export default function Committees() {
  const { committees } = useGovernance()

  return (
    <>
      <TopBar title="Committees" subtitle="Groups & subgroups" />
      <PageShell>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {committees.map((c) => {
            const chair = getMember(c.chairId)
            return (
              <Link
                key={c.id}
                to={`/committees/${c.id}`}
                className="group rounded-2xl bg-neutral-50 p-4 ring-1 ring-black/5 transition hover:ring-black/10"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: c.color.startsWith('var') ? 'var(--primary)' : c.color }}
                  >
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  {c.isPrivate && (
                    <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[9px] font-bold uppercase text-neutral-600">
                      Private
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-neutral-900 group-hover:text-[var(--accent)]">
                  {c.name}
                </h3>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-neutral-500">
                  <Users size={11} />
                  {c.memberIds.length} · {chair?.firstName}
                </p>
                <ChevronRight
                  size={14}
                  className="mt-2 text-neutral-300 group-hover:text-[var(--accent)]"
                />
              </Link>
            )
          })}
        </div>
      </PageShell>
    </>
  )
}
