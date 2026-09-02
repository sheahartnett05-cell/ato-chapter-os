import { useMemo, useRef, useState } from 'react'
import { FileUp, Search, Trash2, BookMarked } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import { useChapterResources } from '../context/ChapterResourcesContext'
import { useAuth, usePermissions } from '../context/AuthContext'

export default function BylawsPage() {
  const { bylaws, importBylaws, deleteBylaws } = useChapterResources()
  const { profile } = useAuth()
  const { canAccessExecTools } = usePermissions()
  const fileRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(bylaws[0]?.id ?? null)
  const [importOpen, setImportOpen] = useState(false)
  const [pasteName, setPasteName] = useState('')
  const [pasteContent, setPasteContent] = useState('')
  const [uploadError, setUploadError] = useState('')

  const active = bylaws.find((b) => b.id === activeId) ?? bylaws[0]

  const highlights = useMemo(() => {
    if (!active || !query.trim()) return []
    const q = query.trim().toLowerCase()
    const lines = active.content.split('\n')
    return lines
      .map((line, i) => ({ line, i }))
      .filter(({ line }) => line.toLowerCase().includes(q))
      .slice(0, 12)
  }, [active, query])

  const importText = (fileName: string, content: string) => {
    if (!content.trim()) return
    const doc = importBylaws({
      fileName,
      content,
      importedBy: `${profile.firstName} ${profile.lastName}`.trim() || 'Officer',
    })
    setActiveId(doc.id)
    setImportOpen(false)
    setPasteName('')
    setPasteContent('')
  }

  const onFile = async (file: File) => {
    setUploadError('')
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext && !['txt', 'md', 'text'].includes(ext)) {
      setUploadError('Upload .txt or .md files, or paste content below.')
      return
    }
    const text = await file.text()
    importText(file.name, text)
  }

  return (
    <>
      <TopBar
        title="Bylaws"
        subtitle={`${bylaws.length} document${bylaws.length === 1 ? '' : 's'} on file`}
        actions={
          canAccessExecTools ? (
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void onFile(f)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn-ghost gap-1.5 text-xs"
              >
                <FileUp size={14} /> Import file
              </button>
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="btn-primary gap-1.5 text-xs"
              >
                <BookMarked size={14} /> Paste / import
              </button>
            </div>
          ) : undefined
        }
      />

      <PageShell className="space-y-6">
        {bylaws.length === 0 ? (
          <div className="border border-[var(--rule)] bg-[var(--surface-card)] px-6 py-12 text-center">
            <p className="font-serif text-xl tracking-tight text-[var(--ink)]">No bylaws imported</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Officers can upload a .txt/.md file or paste chapter bylaws for quick reference.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <aside className="border border-[var(--rule)] bg-[var(--surface-card)]">
              <p className="border-b border-[var(--rule)] px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-[var(--muted)]">
                Documents
              </p>
              <ul>
                {bylaws.map((doc) => (
                  <li key={doc.id} className="border-b border-[var(--rule)] last:border-0">
                    <button
                      type="button"
                      onClick={() => setActiveId(doc.id)}
                      className={`w-full px-3 py-3 text-left text-sm transition ${
                        active?.id === doc.id
                          ? 'bg-[var(--primary-subtle)] font-medium text-[var(--ink)]'
                          : 'text-[var(--muted)] hover:bg-black/[0.02]'
                      }`}
                    >
                      {doc.fileName}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            {active && (
              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
                  <div>
                    <h2 className="font-serif text-2xl tracking-tight">{active.fileName}</h2>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      Imported {new Date(active.importedAt).toLocaleDateString()} · {active.importedBy}
                    </p>
                  </div>
                  {canAccessExecTools && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteBylaws(active.id)
                        setActiveId(bylaws.find((b) => b.id !== active.id)?.id ?? null)
                      }}
                      className="btn-ghost gap-1 text-[10px] text-red-700"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                  />
                  <input
                    className="input-editorial pl-9 font-mono text-sm"
                    placeholder="Search bylaws…"
                    aria-label="Search bylaws"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                {query.trim() && highlights.length > 0 && (
                  <ul className="border border-[var(--rule)] bg-[var(--primary-subtle)] px-4 py-3 text-sm">
                    {highlights.map(({ line, i }) => (
                      <li key={i} className="py-0.5">
                        {line}
                      </li>
                    ))}
                  </ul>
                )}

                <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap border border-[var(--rule)] bg-[var(--surface-card)] p-5 font-sans text-sm leading-relaxed text-[var(--ink)]">
                  {active.content}
                </pre>
              </div>
            )}
          </div>
        )}
      </PageShell>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import bylaws" size="lg">
        <div className="space-y-3">
          {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
          <input
            className="input-editorial"
            placeholder="Document name (e.g. Chapter Bylaws 2025)"
            value={pasteName}
            onChange={(e) => setPasteName(e.target.value)}
          />
          <textarea
            className="input-editorial min-h-[240px] resize-y font-mono text-xs leading-relaxed"
            placeholder="Paste bylaws text here…"
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
          />
          <button
            type="button"
            onClick={() => importText(pasteName || 'bylaws.txt', pasteContent)}
            className="btn-primary w-full"
            disabled={!pasteContent.trim()}
          >
            Save bylaws
          </button>
        </div>
      </Modal>
    </>
  )
}
