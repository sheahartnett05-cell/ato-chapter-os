import type { Session, User } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from './supabase'

type Listener = () => void

let session: Session | null = null
let user: User | null = null
let ready = !isSupabaseConfigured()
let initStarted = false
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((l) => l())
}

export function getSupabaseSession(): Session | null {
  return session
}

export function getSupabaseUser(): User | null {
  return user
}

export function isSupabaseSessionReady(): boolean {
  return ready
}

export function subscribeSupabaseSession(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Call once at app boot before render. */
export async function initSupabaseSession(): Promise<void> {
  if (!isSupabaseConfigured()) {
    ready = true
    notify()
    return
  }
  if (initStarted) return
  initStarted = true

  const sb = getSupabase()
  if (!sb) {
    ready = true
    notify()
    return
  }

  const { data } = await sb.auth.getSession()
  session = data.session
  user = data.session?.user ?? null

  if (!user && import.meta.env.VITE_SMOKE_TEST === '1') {
    const { data: anon, error } = await sb.auth.signInAnonymously()
    if (!error && anon.session) {
      session = anon.session
      user = anon.session.user
    } else if (error) {
      console.warn('[agora] smoke-test anonymous sign-in failed', error.message)
    }
  }

  ready = true
  notify()

  sb.auth.onAuthStateChange((_event, next) => {
    session = next
    user = next?.user ?? null
    notify()
  })
}

export async function waitForSupabaseSession(): Promise<void> {
  if (ready) return
  await initSupabaseSession()
  if (ready) return
  await new Promise<void>((resolve) => {
    const unsub = subscribeSupabaseSession(() => {
      if (ready) {
        unsub()
        resolve()
      }
    })
  })
}
