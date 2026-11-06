# Chaptera — Adversarial Mobile Chrome & Toolbar QA Prompt

Paste everything below into a fresh coding-agent session on `ato-chapter-os` (branch that matches production, usually `main` or `sprint-fixes`). Goal: find and fix **mobile toolbar / tab / phasing** bugs — not invent new features.

---

```markdown
# Chaptera Mobile Chrome Stress Audit (blocker hunt)

You are a QA-obsessed senior engineer doing an **adversarial mobile pass** on Chaptera (repo: ato-chapter-os). Stack: React 19 + Vite + Tailwind 4 + React Router 7. Auth/shell state is real (Supabase + localStorage). Production site is what members use on phones.

## Mission
Find every mobile bug where **top chrome, bottom tabs, drawers, or page toolbars**:
- disappear, flicker, double-render, or “phase” (opacity / z-index / sticky fight)
- stop receiving taps
- cover content or leave content under the notch / home indicator
- desync from the actual route or Room vs Officer mode
- work on desktop width but break at phone widths

**Do not** redesign the product. **Do** reproduce → classify severity → fix blockers/majors → re-verify.

---

## Environment (required)

1. Run `npm run dev` (and/or hard-refresh the live production URL).
2. Test in **real phone emulation at minimum**, preferably a physical phone:
   - iPhone SE / 13 / 15 Pro viewport (Safari quirks matter)
   - Pixel 5 / mid Android Chrome
3. Also toggle DevTools:
   - width: **320, 375, 390, 414**
   - height short + tall
   - device toolbar on/off, rotate portrait ↔ landscape
   - `prefers-reduced-motion` if any transitions look like flicker
4. Test as:
   - **A) Active member** (no exec tools) → Chapter Room shell only
   - **B) Exec / President** → Room + Officer mode switcher
   - **C) Guest demo** if banner is present (chrome must still work)

If OTP/login blocks you, use an existing signed-in profile or guest demo — still audit chrome.

---

## Architecture map (read these first)

| Surface | Files |
|--------|--------|
| Shell switch Room vs Officer | `src/hooks/useShellKind.ts`, `src/context/ChapterViewModeContext.tsx`, `src/lib/chapterViewMode.ts` |
| Mobile chrome layout | `src/components/routing/AppShells.tsx` (`MemberChrome`, `ExecChrome`, `MobileTopChrome`) |
| Top Room \| Officer tabs | `src/components/layout/MobileModeSwitcher.tsx` |
| Member bottom tabs | `src/components/layout/MemberBottomNav.tsx` |
| Officer bottom tabs | `src/components/layout/OfficerBottomNav.tsx` |
| Page title bars | `src/components/layout/TopBar.tsx` |
| Officer drawer | `src/components/layout/Sidebar.tsx` + `ShellMenuContext` |
| Chapter Room home | `src/pages/MemberDashboard.tsx` |
| Officer home | `src/pages/ExecutiveDashboard.tsx` |
| Safe area / buttons | `src/index.css` |

Known design intent (verify it actually holds):
- Top + bottom chrome are **in-flow** (`shrink-0`), not `position: fixed` (fixed was clipping under `overflow-hidden` / `h-dvh`).
- `MobileTopChrome` is `md:hidden`.
- `OfficerBottomNav` is `md:hidden`; member bottom nav shows in member shell.
- TopBar should **not** duplicate the hamburger (shell owns menu on Officer).
- Exec deep-links force `operations` view mode (`ExecShell` effect).

---

## Severity rubric

| Severity | Meaning |
|----------|---------|
| **Blocker** | Cannot navigate, tabs missing, taps dead, content unreachable |
| **Major** | Flicker/phasing, double chrome, wrong mode, overflow hiding CTAs |
| **Polish** | Uneven spacing, minor safe-area gap, label truncation |

Log every issue as:
`[severity] route · persona · repro steps · expected · actual · files suspected`

---

## Pass 1 — Chrome presence (both personas)

For **member** and **exec**, on cold load and after soft refresh:

### Top chrome
- [ ] At `< md`, top bar is visible and stable (no flash then vanish).
- [ ] Exec sees **Room | Officer** segmented control; member does **not**.
- [ ] Officer mode shows hamburger; Room mode does not need officer drawer.
- [ ] Safe-area top padding: content / tabs not under notch or status bar.
- [ ] Guest banner (if any) does not push tabs off-screen or steal all height.

### Bottom chrome
- [ ] Bottom tabs always visible while shell is mounted (never “phase out” after scroll or route change).
- [ ] Bottom tabs clear the iOS home indicator (`env(safe-area-inset-bottom)`).
- [ ] Content scrolls **between** top and bottom chrome; last list row is not permanently covered.
- [ ] No second ghost tab bar (fixed + in-flow duplicate).
- [ ] Active tab indicator matches the real route.

### Z-index / stacking (“phasing”)
- [ ] Tabs stay above page content; content never paints over tabs.
- [ ] Modals/toasts (`--z-modal`, `--z-toast`) cover tabs when open; after close, tabs work again.
- [ ] Drawer overlay blocks content; closing restores taps to tabs.
- [ ] Sticky `TopBar` inside the scroll scroller does not fight shell top chrome (double sticky, jump, opacity flicker on scroll).
- [ ] Backdrop-blur / translucent bars: no strobing while scrolling (common “phasing”).

---

## Pass 2 — Toolbar & tab actions (must work)

### Room | Officer switch (`MobileModeSwitcher`)
- [ ] Tap **Officer** → lands on `/home`, shell becomes ExecChrome, officer bottom tabs appear.
- [ ] Tap **Room** → lands on `/my-dashboard`, member bottom tabs appear.
- [ ] Rapid alternate taps (10×) do not leave chrome blank, half-mounted, or mismatched (Room tabs on `/home` or vice versa).
- [ ] View mode persists across refresh for that user (`chapterViewMode` storage) without wrong shell.
- [ ] While on Room, tapping hero **Dashboard** (if shown) matches Officer switch behavior.

### Member bottom tabs
Routes to hit in order; each must navigate + highlight correctly:
1. Home → `/my-dashboard`
2. Events → `/calendar` (if feature on)
3. Groups → `/committees` (if feature on)
4. Profile → `/profile`
5. More → `/settings`

Checks:
- [ ] Disabled features hide tabs without leaving a huge empty gap or broken flex.
- [ ] Deep link to `/events/:id` then back: tabs still correct.
- [ ] From Profile, bottom Home returns to Chapter Room without bounce loop.

### Officer bottom tabs
1. Home → `/home`
2. Roster → `/members` (perm/feature gated)
3. Events → `/calendar`
4. Attend → `/attendance` (perm/feature gated)
5. More → `/settings`

Checks:
- [ ] Gated tabs hide cleanly when permission/feature off; remaining tabs still tappable.
- [ ] Hamburger opens sidebar drawer; drawer links navigate; drawer closes on route change.
- [ ] Drawer focus trap / backdrop: cannot tap “dead” UI behind; Escape/backdrop closes.
- [ ] Full sidebar list still reachable (bottom tabs are shortcuts, not the only nav).

### Page toolbars (`TopBar` actions)
On Calendar, Attendance, Members, Settings, Announcements, etc.:
- [ ] Title truncates; does not shove actions off-screen without scroll.
- [ ] Horizontal action row scrolls if needed; primary action still tappable.
- [ ] No duplicate hamburgers (shell + TopBar).
- [ ] Sticky TopBar under shell top chrome: no layout jump when scrolling past.

---

## Pass 3 — Scroll, overflow, and “phasing” repros

These are the bugs users describe as phasing / broken toolbars:

1. **Scroll thrash**  
   On `/home` and `/my-dashboard`, fling scroll up/down hard 20×.  
   Watch top + bottom chrome for flicker, fade, or temporary disappearance.

2. **Route thrash**  
   Alternate bottom tabs as fast as possible for 30s.  
   Fail if chrome unmounts, shows blank header, or active state lags permanently.

3. **Mode thrash**  
   Room ↔ Officer rapidly while mid-scroll on a long page.  
   Fail if `h-dvh` / overflow shell leaves a white gap or clipped tabs.

4. **Keyboard**  
   Open Login / Settings / Profile inputs on mobile.  
   Fail if bottom tabs cover the focused field with no way to scroll it into view, or tabs jump into the middle of the screen (old `fixed` + virtual keyboard bug).

5. **Landscape**  
   Rotate on Room and Officer.  
   Fail if tabs overlap content or top switcher becomes untappable.

6. **Horizontal overflow**  
   On Officer Home upcoming events, Action Ledger, quick actions:  
   Fail if page can rubber-band sideways or tabs shift horizontally.

7. **PWA / standalone** (if installed to home screen)  
   Safe areas and `h-dvh` still keep both bars visible; no double status gap.

8. **Service worker stale shell**  
   After deploy, hard refresh once. Fail if old fixed-nav shell mixes with new in-flow shell (two bars or none).

---

## Pass 4 — High-traffic screens (toolbar regressions)

For each route, confirm chrome + primary toolbar actions:

| Route | Shell | Extra checks |
|-------|--------|--------------|
| `/` Landing | none | CTAs tappable; no clip under notch |
| `/login` | none | Mode links tappable; keyboard OK |
| `/onboarding` | none | Sticky Continue/Back not covered by iOS chrome |
| `/my-dashboard` | Member | Hero + Dashboard button; bottom tabs; mode tabs if exec |
| `/home` | Exec | Menu + mode tabs + officer bottom tabs; quick actions |
| `/calendar` | Shared | Create/filter actions; tab highlight Events |
| `/members` | Exec | Search/add actions; roster tab |
| `/attendance` | Exec | Tab/toolbar controls work with thumbs |
| `/profile` | Member | Save / password controls above bottom tabs |
| `/settings` | either | Sections scroll; logout reachable above bottom tabs |
| `/announcements` | Shared | Composer/actions not under tabs |
| Drawer any | Exec | All sidebar links + Chapter Room entry |

---

## Pass 5 — Code audit (while / after device checks)

Search and verify:

- [ ] No accidental return to `position: fixed` bottom/top nav inside `overflow-hidden` + `h-dvh` shells.
- [ ] `MemberChrome` / `ExecChrome` keep a single scroll parent; avoid nested `min-h-screen` fighting `h-dvh` (extra scroll or phantom blank space).
- [ ] `z-index` tokens (`--z-nav`, `--z-drawer`, `--z-modal`, `--z-toast`) are consistent; tabs not above modal.
- [ ] `MobileTopChrome` returns `null` correctly for pure members (no empty header bar taking height).
- [ ] `ExecShell` view-mode force does not loop navigate or flash Room chrome on officer URLs.
- [ ] Feature flags / permissions filtering bottom tabs cannot yield **zero** tabs.
- [ ] Touch targets ≥ 44px on tab hits and menu button.
- [ ] `active:scale` / opacity transitions on buttons do not make chrome look like it is fading out.

---

## Output format (required)

1. **Summary** — 3–6 sentences: is mobile chrome shippable?
2. **Issue table** — severity · route · persona · repro · root cause · fix (or “open”)
3. **Fixes landed** — commit list if you patched
4. **Retest evidence** — which viewports/personas re-passed
5. **Still open** — anything needing product decision

## Fix policy

- Fix **Blocker** and **Major** in this session.
- Prefer restoring **one** clear top chrome + **one** clear bottom tab bar per shell.
- Do not add a third navigation system.
- After fixes: `npm run build` must pass; then say whether production push is needed (do not push unless asked).

Start with Pass 1 on a 390×844 exec session at `/my-dashboard`, then `/home`, then Pass 2 tab thrash.
```

---

## How to use

1. Paste the fenced prompt into a new Agent chat on this repo.
2. Attach a phone screenshot if tabs are missing/flickering.
3. Tell it: `persona = President` or `persona = member`, and the live URL if not local.
