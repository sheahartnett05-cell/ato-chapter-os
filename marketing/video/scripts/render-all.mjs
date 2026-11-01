/**
 * One-command marketing video pipeline:
 * 1) build app  2) preview  3) Playwright capture  4) ffmpeg compose
 * Remotion package is optional enrichment (npm run remotion:render inside marketing/video).
 */
import { spawn, spawnSync } from 'node:child_process'
// spawnSync used for capture so we can continue compose after partial failures
import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const videoRoot = join(repo, 'marketing', 'video')
const raw = join(videoRoot, 'raw')
const out = join(videoRoot, 'out')
const remotionPublic = join(videoRoot, 'public', 'raw')

mkdirSync(raw, { recursive: true })
mkdirSync(out, { recursive: true })
mkdirSync(remotionPublic, { recursive: true })

function run(cmd, args, cwd = repo) {
  console.log('>', cmd, args.join(' '))
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true })
  if (r.status !== 0) throw new Error(`Failed: ${cmd} ${args.join(' ')}`)
}

async function waitPort(port, ms = 90000) {
  const http = await import('node:http')
  const start = Date.now()
  for (;;) {
    const ok = await new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
        res.resume()
        resolve(true)
      })
      req.on('error', () => resolve(false))
    })
    if (ok) return
    if (Date.now() - start > ms) throw new Error(`preview timeout on :${port}`)
    await new Promise((r) => setTimeout(r, 500))
  }
}

async function main() {
  // Dedicated preview port so we don't collide with an existing vite preview/dev server.
  const port = Number(process.env.CHAPTERA_VIDEO_PORT || 4190)
  const base = `http://127.0.0.1:${port}`

  // 1. Build
  run('npm', ['run', 'build'], repo)

  // 2. Preview
  const preview = spawn(
    'npx',
    ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    {
      cwd: repo,
      shell: true,
      stdio: 'ignore',
      detached: false,
    }
  )
  process.env.CHAPTERA_VIDEO_BASE = base
  try {
    await waitPort(port)
    console.log(`Preview ready on :${port}`)

    // Ensure marketing deps + Chromium
    if (!existsSync(join(videoRoot, 'node_modules', '@playwright', 'test'))) {
      run('npm', ['install'], videoRoot)
    }
    const browsersPath = join(videoRoot, 'pw-browsers')
    process.env.PLAYWRIGHT_BROWSERS_PATH = browsersPath
    run('npx', ['playwright', 'install', 'chromium'], videoRoot)

    // 3. Capture (max-failures=0 so one broken scene still leaves usable clips)
    const cap = spawnSync(
      'npx',
      ['playwright', 'test', '-c', 'capture/playwright.config.ts', '--max-failures=0'],
      { cwd: videoRoot, stdio: 'inherit', shell: true, env: process.env }
    )
    if (cap.status !== 0) {
      console.warn('Capture finished with failures — composing from whatever clips exist.')
    }

    // Copy mp4/webm into remotion public for optional Remotion renders
    for (const f of readdirSync(raw)) {
      if (f.endsWith('.webm') || f.endsWith('.mp4')) {
        copyFileSync(join(raw, f), join(remotionPublic, f))
      }
    }

    // 4. Compose with ffmpeg (canonical deliverables)
    run('node', ['scripts/compose-ffmpeg.mjs'], videoRoot)

    // 5. Optional Remotion (best-effort; ffmpeg outputs are source of truth)
    try {
      if (existsSync(join(videoRoot, 'node_modules', 'remotion'))) {
        console.log('Remotion available — skipping full remotion render (ffmpeg out/ is canonical).')
        console.log('Run: cd marketing/video && npm run remotion:studio')
      }
    } catch {
      /* ignore */
    }

    console.log('\nDone. Outputs in marketing/video/out/')
  } finally {
    preview.kill('SIGTERM')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
