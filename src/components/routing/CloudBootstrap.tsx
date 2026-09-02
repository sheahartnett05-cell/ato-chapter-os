import { useEffect, useState, type ReactNode } from 'react'
import {
  canSyncToCloud,
  cloudSyncEnabled,
  hydrateFromCloud,
} from '../../lib/chapterCloud'
import { publishInviteCodesToCloud } from '../../lib/joinCodes'
import { readJson } from '../../lib/persist'
import type { ChapterLock } from '../../types/memberAccount'
import { isGuestPreviewActive } from '../../lib/guestPreview'
import {
  initSupabaseSession,
  isSupabaseSessionReady,
  subscribeSupabaseSession,
  waitForSupabaseSession,
} from '../../lib/supabaseSession'

export function CloudBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(
    () => !cloudSyncEnabled() || isGuestPreviewActive() || isSupabaseSessionReady()
  )
  const [status, setStatus] = useState('Starting…')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!cloudSyncEnabled() || isGuestPreviewActive()) {
      setReady(true)
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        setStatus('Connecting…')
        await waitForSupabaseSession()
        if (cancelled) return

        if (!canSyncToCloud()) {
          setReady(true)
          return
        }

        setStatus('Loading chapter from cloud…')
        const result = await hydrateFromCloud()
        if (cancelled) return

        if (!result.ok && result.error) {
          setError(result.error)
        }

        if (readJson<ChapterLock | null>('chapter-os-chapter-lock', null)) {
          const published = await publishInviteCodesToCloud()
          if (!published.ok && published.error !== 'cloud sync unavailable') {
            console.warn('[agora] join code cloud publish', published.error)
          }
        }

        setReady(true)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Cloud sync failed')
          setReady(true)
        }
      }
    })()

    const unsub = subscribeSupabaseSession(() => {
      if (canSyncToCloud() && !ready) {
        void hydrateFromCloud().then(() => {
          if (!cancelled) setReady(true)
        })
      }
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [ready])

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--surface,#f8f9fb)] px-6 text-center">
        <p className="text-sm font-medium text-neutral-800">{status}</p>
        <p className="max-w-sm text-xs text-neutral-500">
          Sign in during onboarding to sync your chapter across devices.
        </p>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="fixed bottom-3 left-3 right-3 z-[100] rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 sm:left-auto sm:right-4 sm:max-w-sm">
          Cloud sync: {error}. Working from local cache.
        </div>
      )}
      {children}
    </>
  )
}

/** Initialize Supabase session before React render. */
export async function bootCloud(): Promise<void> {
  if (!cloudSyncEnabled() || isGuestPreviewActive()) return
  await initSupabaseSession()
}
