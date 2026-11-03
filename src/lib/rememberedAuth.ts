const EMAIL_KEY = 'chapter-os-remembered-email'

/** Last email used for OTP — prefill login; does not replace the session. */
export function readRememberedEmail(): string {
  try {
    return localStorage.getItem(EMAIL_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

export function writeRememberedEmail(email: string) {
  try {
    const trimmed = email.trim().toLowerCase()
    if (trimmed) localStorage.setItem(EMAIL_KEY, trimmed)
  } catch {
    /* storage unavailable */
  }
}

export function clearRememberedEmail() {
  try {
    localStorage.removeItem(EMAIL_KEY)
  } catch {
    /* ignore */
  }
}
