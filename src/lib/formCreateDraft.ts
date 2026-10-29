import type { FormKind } from '../types'

const DRAFT_KEY = 'chapter-os-form-create-draft'
const NEW_EVENT_KEY = 'chapter-os-form-create-new-event-id'

export interface FormCreateDraft {
  formKind: FormKind
  selectedEventId: string
  selectedTemplateId: string
  formName: string
  createOpen: boolean
}

export function readFormCreateDraft(): FormCreateDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as FormCreateDraft
  } catch {
    return null
  }
}

export function writeFormCreateDraft(draft: FormCreateDraft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    /* storage unavailable */
  }
}

export function clearFormCreateDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

export function stashNewEventForFormCreate(eventId: string) {
  try {
    sessionStorage.setItem(NEW_EVENT_KEY, eventId)
  } catch {
    /* ignore */
  }
}

export function consumeNewEventForFormCreate(): string | null {
  try {
    const id = sessionStorage.getItem(NEW_EVENT_KEY)
    if (id) sessionStorage.removeItem(NEW_EVENT_KEY)
    return id
  } catch {
    return null
  }
}
