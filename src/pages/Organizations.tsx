import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Check } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { useChapter } from '../context/ChapterContext'
import type { NationalOrg } from '../data/nationalOrgs'

function ColorSwatches({ org }: { org: NationalOrg }) {
  return (
    <div className="flex gap-1">
      {[org.primaryColor, org.secondaryColor, org.accentColor].map((color) => (
        <span
          key={color}
          className="h-4 w-4 rounded-sm ring-1 ring-black/10"
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  )
}

function OrgCard({
  org,
  isActive,
  onSelect,
}: {
  org: NationalOrg
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl bg-white p-4 transition hover:shadow-md ${
        isActive ? '' : 'ring-1 ring-black/5 hover:ring-black/10'
      }`}
      style={isActive ? { boxShadow: `0 0 0 2px ${org.primaryColor}` } : undefined}
    >
      <div
        className="-mx-4 -mt-4 mb-3 h-1.5"
        style={{
          background: `linear-gradient(90deg, ${org.primaryColor}, ${org.accentColor}, ${org.secondaryColor})`,
        }}
      />
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold"
          style={{
            backgroundColor: org.primaryColor,
            color: org.primaryColor === '#FFFFFF' ? '#171717' : '#fff',
          }}
        >
          {org.letters}
        </div>
        <ColorSwatches org={org} />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-neutral-900">{org.orgName}</h3>
      <p className="mt-0.5 text-xs font-medium text-neutral-500">{org.nickname}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
        {org.orgType} · {org.languagePack.memberSingular}
      </p>
      <button
        type="button"
        onClick={onSelect}
        className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-sm py-2 text-xs font-semibold transition ${
          isActive ? 'theme-pill-active' : 'theme-pill-muted hover:opacity-90'
        }`}
        style={
          !isActive
            ? { background: org.primaryColor, color: '#fff' }
            : undefined
        }
      >
        {isActive ? (
          <>
            <Check size={14} /> Selected
          </>
        ) : (
          'Select chapter'
        )}
      </button>
    </article>
  )
}

export default function Organizations() {
  const { orgDirectory, selectedOrgId, setSelectedOrg } = useChapter()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orgDirectory
    return orgDirectory.filter(
      (o) =>
        o.orgName.toLowerCase().includes(q) ||
        o.nickname.toLowerCase().includes(q) ||
        o.letters.toLowerCase().includes(q) ||
        o.orgType.toLowerCase().includes(q)
    )
  }, [orgDirectory, query])

  const handleSelect = (id: string) => {
    setSelectedOrg(id)
    navigate('/')
  }

  return (
    <>
      <TopBar title="Organizations" subtitle="Select your chapter" />
      <PageShell className="space-y-5">
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search org, letters, school…"
            className="w-full rounded-sm border border-black/5 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((org) => (
            <OrgCard
              key={org.id}
              org={org}
              isActive={org.id === selectedOrgId}
              onSelect={() => handleSelect(org.id)}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-sm text-neutral-500">No chapters match.</p>
        )}
      </PageShell>
    </>
  )
}
