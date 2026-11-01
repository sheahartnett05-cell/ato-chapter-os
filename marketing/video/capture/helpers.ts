import type { Page } from 'playwright'

export const BASE = process.env.CHAPTERA_VIDEO_BASE ?? 'http://127.0.0.1:4173'
export const FIXED_TIME = '2026-10-15T15:00:00.000Z'

export async function installDemoChrome(page: Page) {
  await page.addInitScript(() => {
    const root = document.createElement('div')
    root.id = '__video_cursor_root'
    root.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:2147483647;overflow:hidden'
    const cursor = document.createElement('div')
    cursor.id = '__video_cursor'
    cursor.style.cssText =
      'position:fixed;width:18px;height:18px;margin:-2px 0 0 -2px;border-radius:50%;border:2px solid #c4a35a;background:rgba(26,26,26,.35);transform:translate(-100px,-100px);transition:transform 280ms cubic-bezier(.22,1,.36,1);box-shadow:0 0 0 1px rgba(0,0,0,.25)'
    root.appendChild(cursor)
    document.documentElement.appendChild(root)

    ;(window as unknown as { __moveCursor: (x: number, y: number) => void }).__moveCursor = (
      x,
      y
    ) => {
      cursor.style.transform = `translate(${x}px, ${y}px)`
    }
    ;(window as unknown as { __clickRipple: (x: number, y: number) => void }).__clickRipple = (
      x,
      y
    ) => {
      const ripple = document.createElement('div')
      ripple.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:10px;height:10px;margin:-5px;border-radius:50%;border:2px solid #c4a35a;opacity:.9;pointer-events:none;transition:transform 420ms ease,opacity 420ms ease;transform:scale(1)`
      root.appendChild(ripple)
      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(3.2)'
        ripple.style.opacity = '0'
      })
      setTimeout(() => ripple.remove(), 480)
    }
  })
}

export async function humanPause(page: Page, ms = 750) {
  await page.waitForTimeout(ms)
}

async function ensureCursorApi(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as {
      __moveCursor?: (x: number, y: number) => void
      __clickRipple?: (x: number, y: number) => void
    }
    let root = document.getElementById('__video_cursor_root')
    if (!root) {
      root = document.createElement('div')
      root.id = '__video_cursor_root'
      root.style.cssText =
        'position:fixed;inset:0;pointer-events:none;z-index:2147483647;overflow:hidden'
      document.documentElement.appendChild(root)
    }
    let cursor = document.getElementById('__video_cursor')
    if (!cursor) {
      cursor = document.createElement('div')
      cursor.id = '__video_cursor'
      cursor.style.cssText =
        'position:fixed;width:18px;height:18px;margin:-2px 0 0 -2px;border-radius:50%;border:2px solid #c4a35a;background:rgba(26,26,26,.35);transform:translate(-100px,-100px);transition:transform 280ms cubic-bezier(.22,1,.36,1);box-shadow:0 0 0 1px rgba(0,0,0,.25)'
      root.appendChild(cursor)
    }
    w.__moveCursor = (x, y) => {
      cursor!.style.transform = `translate(${x}px, ${y}px)`
    }
    w.__clickRipple = (x, y) => {
      const ripple = document.createElement('div')
      ripple.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:10px;height:10px;margin:-5px;border-radius:50%;border:2px solid #c4a35a;opacity:.9;pointer-events:none;transition:transform 420ms ease,opacity 420ms ease;transform:scale(1)`
      root!.appendChild(ripple)
      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(3.2)'
        ripple.style.opacity = '0'
      })
      setTimeout(() => ripple.remove(), 480)
    }
  })
}

export async function moveTo(page: Page, selector: string) {
  await ensureCursorApi(page)
  const loc = page.locator(selector).first()
  await loc.waitFor({ state: 'visible', timeout: 15000 })
  const box = await loc.boundingBox()
  if (!box) throw new Error(`No box for ${selector}`)
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.evaluate(
    ([cx, cy]) => {
      ;(window as unknown as { __moveCursor: (x: number, y: number) => void }).__moveCursor(cx, cy)
    },
    [x, y] as [number, number]
  )
  await page.mouse.move(x, y, { steps: 18 })
  await humanPause(page, 280)
  return { x, y, loc }
}

export async function humanClick(page: Page, selector: string) {
  const { x, y, loc } = await moveTo(page, selector)
  await ensureCursorApi(page)
  await page.evaluate(
    ([cx, cy]) => {
      ;(window as unknown as { __clickRipple: (x: number, y: number) => void }).__clickRipple(cx, cy)
    },
    [x, y] as [number, number]
  )
  await loc.click({ delay: 40 })
  await humanPause(page, 700)
}

export async function humanType(page: Page, selector: string, text: string) {
  await humanClick(page, selector)
  for (const ch of text) {
    await page.keyboard.type(ch, { delay: 70 })
  }
  await humanPause(page, 500)
}

export async function smoothScroll(page: Page, dy: number) {
  await page.evaluate(async (delta) => {
    const steps = 24
    for (let i = 0; i < steps; i++) {
      window.scrollBy(0, delta / steps)
      await new Promise((r) => setTimeout(r, 16))
    }
  }, dy)
  await humanPause(page, 500)
}

async function finishOpenDemo(page: Page, urlRe: RegExp) {
  await ensureCursorApi(page)
  await humanClick(page, 'button:has-text("Open the demo")')
  await page.waitForURL(urlRe, { timeout: 25000 })
  await page.waitForLoadState('networkidle').catch(() => {})
  await ensureCursorApi(page)
  await humanPause(page, 1000)
}

/** Enter guest officer demo as President (first exec preset). */
export async function enterOfficerDemo(page: Page) {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await ensureCursorApi(page)
  await humanPause(page, 900)
  await humanClick(page, 'a[href="/demo"]')
  await page.waitForURL(/\/demo/, { timeout: 15000 })
  await ensureCursorApi(page)
  await humanClick(page, 'button:has-text("Officer")')
  await humanClick(page, 'button:has-text("Continue")')
  await humanClick(page, 'button:has-text("President")')
  await humanClick(page, 'button:has-text("Continue")')
  await finishOpenDemo(page, /\/(home|my-dashboard)/)
}

export async function enterMemberDemo(page: Page) {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await ensureCursorApi(page)
  await humanPause(page, 800)
  await humanClick(page, 'a[href="/demo"]')
  await page.waitForURL(/\/demo/, { timeout: 15000 })
  await ensureCursorApi(page)
  await humanClick(page, 'button:has-text("Member")')
  await humanClick(page, 'button:has-text("Continue")')
  await finishOpenDemo(page, /\/(my-dashboard|home)/)
}

export async function enterRecruitmentDemo(page: Page) {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await ensureCursorApi(page)
  await humanPause(page, 800)
  await humanClick(page, 'a[href="/demo"]')
  await page.waitForURL(/\/demo/, { timeout: 15000 })
  await ensureCursorApi(page)
  await humanClick(page, 'button:has-text("Officer")')
  await humanClick(page, 'button:has-text("Continue")')
  const rush = page.locator('button:has-text("Recruitment")').first()
  if ((await rush.count()) > 0) await humanClick(page, 'button:has-text("Recruitment")')
  else await humanClick(page, 'button:has-text("President")')
  await humanClick(page, 'button:has-text("Continue")')
  await finishOpenDemo(page, /\/(home|my-dashboard|recruit)/)
}
