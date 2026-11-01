import { test, chromium, type BrowserContext, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BASE,
  FIXED_TIME,
  enterMemberDemo,
  enterOfficerDemo,
  enterRecruitmentDemo,
  humanClick,
  humanPause,
  installDemoChrome,
  smoothScroll,
} from './helpers'

const dir = path.dirname(fileURLToPath(import.meta.url))
const rawDir = path.join(dir, '..', 'raw')

async function withVideo(
  name: string,
  size: { width: number; height: number },
  scale: number,
  run: (page: Page, context: BrowserContext) => Promise<void>
) {
  fs.mkdirSync(rawDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: size,
    deviceScaleFactor: scale,
    recordVideo: { dir: rawDir, size },
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await installDemoChrome(page)
  try {
    await page.clock.setFixedTime(new Date(FIXED_TIME))
  } catch {
    /* older Playwright / clock unavailable */
  }
  try {
    await run(page, context)
  } finally {
    const video = page.video()
    await context.close()
    await browser.close()
    if (video) {
      const src = await video.path()
      const dest = path.join(rawDir, `${name}.webm`)
      if (src && fs.existsSync(src)) {
        fs.renameSync(src, dest)
      }
    }
  }
}

/** Prefer goto for destinations so overflowed sidebar links don't fail capture. */
async function goScene(page: Page, route: string) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
  await humanPause(page, 1100)
}

test('01-hook-landing', async () => {
  await withVideo('01-hook-landing', { width: 1920, height: 1080 }, 1, async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
    await humanPause(page, 1800)
    await smoothScroll(page, 120)
    await humanPause(page, 1200)
  })
})

test('02-officer-home', async () => {
  await withVideo('02-officer-home', { width: 1920, height: 1080 }, 1, async (page) => {
    await enterOfficerDemo(page)
    await humanPause(page, 1200)
    await smoothScroll(page, 280)
    await humanPause(page, 900)
    const unpaid = page.locator('a[href*="dues"], a:has-text("Dues")').first()
    if ((await unpaid.count()) > 0 && (await unpaid.isVisible().catch(() => false))) {
      await humanClick(page, 'a[href*="/dues"], a:has-text("Dues")')
      await humanPause(page, 1400)
    } else {
      await goScene(page, '/dues')
    }
  })
})

test('03-calendar', async () => {
  await withVideo('03-calendar', { width: 1920, height: 1080 }, 1, async (page) => {
    await enterOfficerDemo(page)
    await goScene(page, '/calendar')
    await smoothScroll(page, 160)
    const event = page.locator('a[href*="/events/"]').first()
    if ((await event.count()) > 0) {
      await event.scrollIntoViewIfNeeded().catch(() => {})
      await humanClick(page, 'a[href*="/events/"]')
      await humanPause(page, 1400)
      const rsvp = page.locator('button:has-text("Going"), button:has-text("RSVP")').first()
      if ((await rsvp.count()) > 0 && (await rsvp.isVisible().catch(() => false))) {
        await humanClick(page, 'button:has-text("Going"), button:has-text("RSVP")')
      }
    }
    await humanPause(page, 1000)
  })
})

test('04-attendance', async () => {
  await withVideo('04-attendance', { width: 1920, height: 1080 }, 1, async (page) => {
    await enterOfficerDemo(page)
    await goScene(page, '/calendar')
    const event = page.locator('a[href*="/events/"]').first()
    if ((await event.count()) > 0) {
      await humanClick(page, 'a[href*="/events/"]')
      await humanPause(page, 1000)
      const present = page.locator('button:has-text("Present")').first()
      if ((await present.count()) > 0 && (await present.isVisible().catch(() => false))) {
        await humanClick(page, 'button:has-text("Present")')
      }
    }
    await goScene(page, '/excuses')
    await smoothScroll(page, 180)
    await humanPause(page, 1000)
  })
})

test('05-dues', async () => {
  await withVideo('05-dues', { width: 1920, height: 1080 }, 1, async (page) => {
    await enterOfficerDemo(page)
    await goScene(page, '/dues')
    const unpaid = page.locator('button:has-text("Unpaid"), a:has-text("Unpaid")').first()
    if ((await unpaid.count()) > 0 && (await unpaid.isVisible().catch(() => false))) {
      await unpaid.click()
    }
    await humanPause(page, 1000)
    await smoothScroll(page, 200)
    await humanPause(page, 900)
  })
})

test('06-recruitment', async () => {
  await withVideo('06-recruitment', { width: 1920, height: 1080 }, 1, async (page) => {
    await enterRecruitmentDemo(page)
    await goScene(page, '/recruitment')
    await smoothScroll(page, 180)
    await goScene(page, '/recruitment/pipeline')
    await humanPause(page, 1500)
    const stage = page.locator('select').first()
    if ((await stage.count()) > 0) {
      await stage.selectOption({ label: /Accept|Bid/i }).catch(() => {})
      await humanPause(page, 1000)
    }
    // Attempt a kanban card drag if columns exist
    const card = page.locator('[data-rbd-draggable-id], [draggable="true"], .pipeline-card').first()
    if ((await card.count()) > 0) {
      const box = await card.boundingBox()
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.mouse.down()
        await page.mouse.move(box.x + 280, box.y + box.height / 2, { steps: 20 })
        await page.mouse.up()
        await humanPause(page, 900)
      }
    }
  })
})

test('07-announcements', async () => {
  await withVideo('07-announcements', { width: 1920, height: 1080 }, 1, async (page) => {
    await enterOfficerDemo(page)
    await goScene(page, '/announcements')
    await smoothScroll(page, 220)
    await humanPause(page, 1000)
  })
})

test('08-chapter-room-mobile', async () => {
  await withVideo('08-chapter-room-mobile', { width: 390, height: 844 }, 3, async (page) => {
    await enterMemberDemo(page)
    await humanPause(page, 1200)
    await smoothScroll(page, 240)
    await goScene(page, '/dues')
    await humanPause(page, 1000)
    await goScene(page, '/calendar')
    await humanPause(page, 1100)
  })
})

test('09-chapter-setup', async () => {
  await withVideo('09-chapter-setup', { width: 1920, height: 1080 }, 1, async (page) => {
    await enterOfficerDemo(page)
    await goScene(page, '/chapter-setup')
    await smoothScroll(page, 320)
    await humanPause(page, 1000)
    const seats = page.getByText(/Officer|Feature|Modules/i).first()
    if ((await seats.count()) > 0) {
      await seats.scrollIntoViewIfNeeded().catch(() => {})
      await humanPause(page, 1100)
    }
  })
})
