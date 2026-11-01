# Chaptera marketing video pipeline

Records the **guest demo** against a local `vite preview` build (never production / never real chapters).

## One command

From the repo root:

```bash
npm run video:render
```

This will:

1. `npm run build`
2. Start `vite preview` on `http://127.0.0.1:4190` (override with `CHAPTERA_VIDEO_PORT`)
3. Run Playwright scene captures → `marketing/video/raw/*.webm`
4. Compose deliverables with ffmpeg → `marketing/video/out/`

## Outputs (`marketing/video/out/`)

| File | Spec |
|------|------|
| `agora-walkthrough.mp4` | 1920×1080 product tour |
| `agora-ad-30s.mp4` | 30s horizontal promo |
| `agora-ad-15s-vertical.mp4` | 15s vertical (captions burned in) |
| Matching `.srt` files | Captions for each |
| `thumbnail.png` | 1280×720 |
| `RENDER_NOTES.json` | VO / music / missing-clip notes |

Filenames keep the `agora-` prefix from the brief for drop-in compatibility; on-screen brand is **Chaptera** · **chapteramanager.com**.

## Script

See [`script.md`](./script.md).

## Voiceover

No TTS keys were configured (`ELEVENLABS_API_KEY` / `OPENAI_API_KEY`). Videos ship with **captions + silent bed**. Drop WAV/MP3 takes into `vo/` with timing notes and re-mux later.

## Music

**Silent.** No commercial-license track is bundled. To add a bed, place a clearly licensed file in `assets/music/` and extend `scripts/compose-ffmpeg.mjs` (document license here).

| Source | License |
|--------|---------|
| _(none)_ | silent placeholder |

## Voiceover takes

Drop recordings in `vo/` using the cue list in `vo/TIMING.md`, then remux over the silent AAC track.

## Remotion

React compositions live in `remotion/src/` (Chaptera colors/fonts). After capture:

```bash
cd marketing/video
npm install
npm run remotion:studio
```

Canonical deliverables are produced by **ffmpeg** so the pipeline stays reliable without Remotion GPU quirks. Remotion is for title polish / future re-edits.

## Content rules enforced in capture

- Guest preview only (`/demo`)
- Fixed clock `2026-10-15` for stable relative dates
- Product org (Chaptera) — avoid crest screenshots in edits
- Headless Chromium, no extensions

## Re-render after UI changes

```bash
npm run video:render
```

Review `out/RENDER_NOTES.json` for any scenes cut because a clip failed.
