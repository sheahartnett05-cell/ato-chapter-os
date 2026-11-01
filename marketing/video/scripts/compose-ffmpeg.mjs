/**
 * Compose marketing videos from Playwright raw/*.webm clips.
 * Captions-only VO (no TTS keys). Silent music bed unless assets/music has a file.
 */
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
  copyFileSync,
  readFileSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const raw = join(root, 'raw')
const out = join(root, 'out')
const captions = join(root, 'captions')
const work = join(root, 'raw', '_work')
mkdirSync(out, { recursive: true })
mkdirSync(captions, { recursive: true })
mkdirSync(work, { recursive: true })

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false })
  if (r.status !== 0) throw new Error(`${cmd} ${args[0]} failed (${r.status})`)
}

function ff(...args) {
  run('ffmpeg', ['-y', ...args])
}

function hasClip(name) {
  return existsSync(join(raw, `${name}.webm`)) || existsSync(join(raw, `${name}.mp4`))
}

function toMp4(name, w = 1920, h = 1080) {
  const webm = join(raw, `${name}.webm`)
  const mp4 = join(work, `${name}.mp4`)
  if (!existsSync(webm) && existsSync(join(raw, `${name}.mp4`))) {
    copyFileSync(join(raw, `${name}.mp4`), mp4)
    return mp4
  }
  if (!existsSync(webm)) throw new Error(`Missing clip ${name}`)
  ff(
    '-i',
    webm,
    '-vf',
    `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p`,
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '20',
    '-an',
    mp4
  )
  return mp4
}

/** Explicit font files — Windows ffmpeg often has no fontconfig defaults. */
const FONT_SERIF = (process.env.CHAPTERA_VIDEO_FONT_SERIF || 'C:/Windows/Fonts/georgia.ttf').replace(
  /\\/g,
  '/'
)
const FONT_SANS = (process.env.CHAPTERA_VIDEO_FONT_SANS || 'C:/Windows/Fonts/arial.ttf').replace(
  /\\/g,
  '/'
)
const FONT_MONO = (process.env.CHAPTERA_VIDEO_FONT_MONO || 'C:/Windows/Fonts/consola.ttf').replace(
  /\\/g,
  '/'
)

function ffFont(path) {
  return path.replace(/:/g, '\\:')
}

function titleCard(file, lines, seconds = 3, size = '1920x1080') {
  const escape = (s) =>
    s.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\\\'").replace(/%/g, '\\%')
  const draws = lines
    .map((line, i) => {
      const y = size.startsWith('1080x') ? 820 + i * 70 : 460 + i * 70
      const fontsize = i === 0 ? 56 : 28
      const fontfile = ffFont(i === 0 ? FONT_SERIF : FONT_MONO)
      return `drawtext=fontfile='${fontfile}':text='${escape(line)}':fontcolor=${i === 0 ? 'white' : '0xC4A35A'}:fontsize=${fontsize}:x=(w-text_w)/2:y=${y}`
    })
    .join(',')
  ff(
    '-f',
    'lavfi',
    '-i',
    `color=c=0x1A1A1A:s=${size}:d=${seconds}:r=30`,
    '-vf',
    draws,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '18',
    file
  )
}

function concatList(files, listPath) {
  writeFileSync(
    listPath,
    files.map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n')
  )
}

function concatMp4(files, dest) {
  const list = join(work, 'concat.txt')
  concatList(files, list)
  ff('-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', dest)
}

function writeSrt(path, cues) {
  const body = cues
    .map((c, i) => {
      const fmt = (s) => {
        const h = Math.floor(s / 3600)
        const m = Math.floor((s % 3600) / 60)
        const sec = Math.floor(s % 60)
        const ms = Math.floor((s % 1) * 1000)
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms).padStart(3, '0')}`
      }
      return `${i + 1}\n${fmt(c.start)} --> ${fmt(c.end)}\n${c.text}\n`
    })
    .join('\n')
  writeFileSync(path, body, 'utf8')
}

const scenes = [
  { id: '01-hook-landing', label: 'Hook' },
  { id: '02-officer-home', label: 'Officer Home' },
  { id: '03-calendar', label: 'Calendar' },
  { id: '04-attendance', label: 'Attendance' },
  { id: '05-dues', label: 'Dues' },
  { id: '06-recruitment', label: 'Recruitment' },
  { id: '07-announcements', label: 'Announcements' },
  { id: '08-chapter-room-mobile', label: 'Chapter Room', mobile: true },
  { id: '09-chapter-setup', label: 'Chapter Setup' },
]

const available = scenes.filter((s) => hasClip(s.id))
if (available.length === 0) {
  console.error('No raw clips in', raw)
  process.exit(1)
}
console.log(
  'Composing from clips:',
  available.map((s) => s.id).join(', ')
)
if (available.length < scenes.length) {
  console.warn(
    'Missing clips (cut from edit):',
    scenes.filter((s) => !hasClip(s.id)).map((s) => s.id)
  )
}

const openCard = join(work, 'open.mp4')
const closeCard = join(work, 'close.mp4')
titleCard(openCard, ['Chaptera', 'YOUR CHAPTER, ONE PLACE'], 5)
titleCard(closeCard, ['Try the demo', 'chapteramanager.com', 'No account needed'], 5)

const desktopParts = [openCard]
for (const s of available) {
  // Mobile clip is letterboxed into 1080p for the walkthrough beat.
  // Cap each scene so the tour lands in the 2:00–2:30 window.
  const full = toMp4(s.id, 1920, 1080)
  const capped = join(work, `${s.id}-cap.mp4`)
  ff('-i', full, '-t', '13', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-an', capped)
  desktopParts.push(capped)
}
desktopParts.push(closeCard)

const walkthrough = join(out, 'agora-walkthrough.mp4')
const walkNoAudio = join(work, 'walk-noaudio.mp4')
concatMp4(desktopParts, walkNoAudio)

// silent AAC bed
const silent = join(work, 'silence.aac')
ff('-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', '180', '-c:a', 'aac', silent)
ff(
  '-i',
  walkNoAudio,
  '-i',
  silent,
  '-shortest',
  '-c:v',
  'copy',
  '-c:a',
  'aac',
  '-movflags',
  '+faststart',
  walkthrough
)

const walkCues = [
  { start: 0, end: 5, text: 'Your chapter runs on GroupMe, five spreadsheets, and a prayer.' },
  { start: 5, end: 10, text: 'Chaptera puts it in one place.' },
  { start: 10, end: 23, text: 'Every officer gets a home built for their job.' },
  { start: 23, end: 36, text: 'Events, RSVPs, and meetings in one calendar.' },
  { start: 36, end: 49, text: 'Attendance and excuses - counted automatically.' },
  { start: 49, end: 62, text: "Know who's paid without chasing a spreadsheet." },
  { start: 62, end: 75, text: 'Run rush from first contact to bid day.' },
  { start: 75, end: 88, text: "Announcements that don't get buried." },
  { start: 88, end: 101, text: 'Members get a clean app on their phone.' },
  { start: 101, end: 114, text: 'Turn modules on or off. Fit how your chapter works.' },
  { start: 114, end: 121, text: 'Try the live demo - chapteramanager.com' },
]
writeSrt(join(out, 'agora-walkthrough.srt'), walkCues)
writeSrt(join(captions, 'agora-walkthrough.srt'), walkCues)

// 30s ad from strongest clips
const adParts = [openCard]
for (const id of ['02-officer-home', '06-recruitment', '05-dues']) {
  if (hasClip(id)) {
    const src = toMp4(id)
    const trim = join(work, `ad-${id}.mp4`)
    ff('-i', src, '-t', '7', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-an', trim)
    adParts.push(trim)
  }
}
adParts.push(closeCard)
const ad30raw = join(work, 'ad30-raw.mp4')
concatMp4(adParts, ad30raw)
const ad30 = join(out, 'agora-ad-30s.mp4')
ff(
  '-i',
  ad30raw,
  '-i',
  silent,
  '-t',
  '30',
  '-shortest',
  '-c:v',
  'libx264',
  '-pix_fmt',
  'yuv420p',
  '-crf',
  '20',
  '-c:a',
  'aac',
  '-movflags',
  '+faststart',
  ad30
)
const ad30cues = [
  { start: 0, end: 2, text: 'Spreadsheets out. One home in.' },
  { start: 2, end: 10, text: 'Officer Home — built for the job.' },
  { start: 10, end: 18, text: 'Rush, end to end.' },
  { start: 18, end: 25, text: 'Dues without the chase.' },
  { start: 25, end: 30, text: 'Try the demo · chapteramanager.com' },
]
writeSrt(join(out, 'agora-ad-30s.srt'), ad30cues)

// 15s vertical
const vertCard = join(work, 'vert-close.mp4')
ff(
  '-f',
  'lavfi',
  '-i',
  'color=c=0x1A1A1A:s=1080x1920:d=3:r=30',
  '-vf',
  `drawtext=fontfile='${ffFont(FONT_SERIF)}':text='Try the demo':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=820,drawtext=fontfile='${ffFont(FONT_MONO)}':text='chapteramanager.com':fontcolor=0xC4A35A:fontsize=36:x=(w-text_w)/2:y=900`,
  '-c:v',
  'libx264',
  '-pix_fmt',
  'yuv420p',
  vertCard
)

const vertParts = []
if (hasClip('08-chapter-room-mobile')) {
  const m = toMp4('08-chapter-room-mobile', 1080, 1920)
  const trim = join(work, 'vert-mobile.mp4')
  ff('-i', m, '-t', '12', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-an', trim)
  vertParts.push(trim)
} else if (hasClip('02-officer-home')) {
  const m = toMp4('02-officer-home', 1080, 1920)
  const trim = join(work, 'vert-desk.mp4')
  ff('-i', m, '-t', '12', '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920', '-an', trim)
  vertParts.push(trim)
}
vertParts.push(vertCard)
const vertRaw = join(work, 'vert-raw.mp4')
concatMp4(vertParts, vertRaw)
const vertOut = join(out, 'agora-ad-15s-vertical.mp4')
const vertSrt = join(out, 'agora-ad-15s-vertical.srt')
const vertCues = [
  { start: 0, end: 4, text: 'Your chapter, on your phone.' },
  { start: 4, end: 10, text: 'Dues. Events. Updates.' },
  { start: 10, end: 15, text: 'Try the demo · chapteramanager.com' },
]
writeSrt(vertSrt, vertCues)
// burn captions (safe zone-ish)
const srtEsc = vertSrt.replace(/\\/g, '/').replace(/:/g, '\\:')
ff(
  '-i',
  vertRaw,
  '-i',
  silent,
  '-t',
  '15',
  '-vf',
  `subtitles='${srtEsc}':force_style='Fontsize=28,PrimaryColour=&H00FFFFFF&,OutlineColour=&H001A1A1A&,BorderStyle=3,Outline=2,MarginV=420'`,
  '-c:v',
  'libx264',
  '-pix_fmt',
  'yuv420p',
  '-crf',
  '20',
  '-c:a',
  'aac',
  '-shortest',
  '-movflags',
  '+faststart',
  vertOut
)

// thumbnail from officer home or open card
const thumbSrc = hasClip('02-officer-home') ? toMp4('02-officer-home') : openCard
ff(
  '-i',
  thumbSrc,
  '-ss',
  '1',
  '-frames:v',
  '1',
  '-vf',
  `scale=1280:720,drawtext=fontfile='${ffFont(FONT_SERIF)}':text='Chaptera':fontcolor=white:fontsize=64:x=48:y=48,drawtext=fontfile='${ffFont(FONT_MONO)}':text='Product walkthrough':fontcolor=0xC4A35A:fontsize=32:x=48:y=120`,
  join(out, 'thumbnail.png')
)

writeFileSync(
  join(out, 'RENDER_NOTES.json'),
  JSON.stringify(
    {
      brand: 'Chaptera',
      url: 'chapteramanager.com',
      vo: 'placeholder — captions only (no ELEVENLABS_API_KEY / OPENAI_API_KEY)',
      music: 'silent bed — no licensed commercial track bundled; add to assets/music/ to enable',
      clipsUsed: available.map((s) => s.id),
      clipsMissing: scenes.filter((s) => !hasClip(s.id)).map((s) => s.id),
    },
    null,
    2
  )
)

console.log('Wrote outputs to', out)
for (const f of readdirSync(out)) console.log(' -', f)
