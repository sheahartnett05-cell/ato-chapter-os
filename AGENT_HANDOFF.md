# Agent handoff log

Shared running notes for **async work** on this repo. Both collaborators (and their Cursor agents) should read this at the start of a session and **append** a short entry when finishing meaningful work.

## How to use (humans + agents)

1. **Start of session:** Read the latest entry below (newest first).
2. **End of session:** Add a new block under [Log](#log) — do not edit old entries except to fix typos.
3. **Format:** Copy the template; keep bullets factual (what changed, where, how to verify).
4. **Scope:** Features, bugs, seed/demo data, routes, types, and known follow-ups. Skip trivial formatting-only commits unless it affects behavior.

### Entry template

```markdown
### YYYY-MM-DD — Author (human or agent session label)

**Summary:** One sentence.

**Changes:**
- Area: files or modules — what changed

**Verify:**
- How to smoke-test (routes, preview mode, etc.)

**Follow-ups / known gaps:**
- Optional
```

---

## Log

*(Newest entries at the top.)*

### 2026-10-29 — Agent (Chapter Room UX, meeting page, search, settings)

**Summary:** Chapter Room polish (announcements/upcoming, collapsible quick access), Exec Slides replaced by Chapter meeting, sidebar Forms/Members order, shared SearchField, Settings officer positions entry, view-mode hook fallbacks.

**Changes:**
- **Chapter Room:** `MemberDashboard.tsx` — no harsh line-clamps on announcements/upcoming; `CollapsibleSection.tsx` for quick access.
- **Chapter meeting:** `ChapterMeeting.tsx`, `App.tsx` routes `/chapter-meeting`, redirect `/exec-slides`; `ChapterResourcesContext.tsx` + `chapterResources.ts` for agenda, minutes, attachments; sidebar label **Chapter meeting**; feature label in `chapterFeatures.ts`.
- **Navigation:** `Sidebar.tsx` — Forms after Announcements, Members before Committees.
- **Forms:** `ChapterTables.tsx` — cleaner toolbar, row search via `SearchField`.
- **Search:** `SearchField.tsx` (icon, border, clear, full-width mobile); wired in Members, Forms, Bylaws, Committees modals; `index.css` normalizes `type=search`; `TopBar.tsx` removed non-functional search.
- **Settings:** `Settings.tsx` — collapsible **Officer positions** → `/chapter-setup#officer-positions`; Position tab hidden; `ChapterSetup.tsx` + `Section.tsx` `id="officer-positions"`.
- **Stability:** `ChapterViewModeContext.tsx` — `useChapterViewModeOptional`, `useResolvedChapterViewMode`, `useSetChapterViewMode` so components outside provider do not crash; `useShellKind.ts`, `ChapterModeNav.tsx` updated.

**Verify:**
- `/my-dashboard` (Chapter Room): announcements/upcoming text not clipped; quick access expands/collapses.
- Sidebar: Forms above Members; **Chapter meeting** opens agenda/minutes/uploads.
- `/members` and a form detail: search field visible, full width on mobile, clear button when typing.
- Settings → Officer positions → Chapter Setup anchor scrolls to seats.
- `npm run build` passes.

**Follow-ups / known gaps:**
- `ExecSlides.tsx` may remain unused; safe to delete if no other imports.
- Onboarding roster search still uses raw `input-editorial` (not `SearchField`).
- Settings toggle copy still “Operations” vs “Officer Home” (optional rename).

---

### 2026-10-18 — Agent (Chapter Room nav, calendar UX, feature gates)

**Summary:** Officers can leave Chapter Room via **Back to Home**; disabled features show an explanation instead of silent redirect; member-shell scroll resets on route change; calendar defaults to month view.

**Changes:**
- **Exec exit:** `ChapterModeNav.tsx` — `useGoToOperations()`, strip + TopBar **Back to Home** → `/home` + `operations` view mode; hero button on `MemberDashboard.tsx`.
- **Navigation UX:** `AppShells.tsx` — scroll container resets to top on pathname change (member + exec main).
- **Feature gates:** `FeatureRoute.tsx` — disabled-feature page with Chapter Setup link; `MemberBottomNav.tsx` hides Calendar/Groups when off.
- **Calendar:** `Calendar.tsx` — default view `month` (removed member/mobile agenda forcing).

**Verify:**
- Guest exec-capable member (e.g. Scholarship preview): **Back to Home** from Room → sidebar + `/home`.
- Disable Calendar in Chapter Setup → bottom nav omits Calendar; visiting `/calendar` shows “Not available” (not bounce to Room).
- Scroll Room, open Profile → page starts at top.
- Calendar opens on month grid.

**Follow-ups / known gaps:**
- Settings toggle labels still say “Operations”; could align with “Officer Home” if desired.
- Prior commit `a3fb86d` (shell/view mode) lands with this push if not yet on remote.

---

### 2026-10-18 — Agent (app shell, calendar, view mode)

**Summary:** Shared routes use member vs exec shell from persisted **Chapter Room / Operations** view mode (not permission boost alone); calendar uses real today and relative demo dates; Settings toggle for exec-capable users.

**Changes:**
- **View mode:** `chapterViewMode.ts`, `ChapterViewModeContext.tsx`, `useShellKind.ts`, `can.ts` — `chapter-room` vs `operations`, guest preview defaults in `GuestLogin.tsx`.
- **Shells:** `AppShells.tsx` — `SharedShell`, `MemberShell` + `MemberBottomNav`, `ExecShell` mobile drawer; `App.tsx` wraps shared routes with `SharedShell`.
- **Layout:** `Sidebar.tsx` drawer on narrow; `TopBar.tsx` back link via `useIsMemberShell()`; member dashboard no duplicate bottom nav.
- **Calendar:** `Calendar.tsx` — `localTodayIso()`, hide exec-only events in member shell, RSVP on list items; `Event.audience` on seed.
- **Demo dates:** `demoRelativeDates.ts`, `demoSeed.ts`, `ChapterContext.tsx` semester from meta.
- **Copy:** `Committees.tsx`, `CommitteeDetail.tsx` — “Groups” in member shell.
- **Settings:** `AppViewModeCard` on Account tab for exec-capable users.
- **Fixes:** `MemberBottomNav.tsx` TS for optional `end`; `MyProfile.tsx` back target from shell kind.

**Verify:**
- `/preview` → Member → Calendar / Groups: bottom nav stays, no exec sidebar.
- Exec-capable guest → Settings → toggle Chapter Room vs Operations; sidebar vs bottom nav.
- Calendar opens on current month with visible upcoming events after re-seed / switch preview.
- `npm run build` passes.

**Follow-ups / known gaps:**
- Exec calendar: RSVP counts / attendance tooling not built out.
- Re-enter guest preview if stale localStorage still has old view mode or fixed demo dates.

---

### 2026-10-16 — Sheah + agent (Home dashboard & Chapter Room)

**Summary:** Officer Home is function-based with actionable stat tiles, Action Ledger tasks, guest preview by officer function; member Chapter Room quick access and several chapter-feature fixes; async handoff via this file.

**Changes:**
- **Home / exec dashboard:** `ExecutiveDashboard.tsx`, `StatTile`, `useOfficerDashboard`, `src/lib/dashboard/*` — function-based tile registry, metrics from store, role preview on `/preview`, polished tile hierarchy (label → value → context → progress), attendance seed fix, ledger line-clamp.
- **Officer functions:** `OfficerFunction`, `ChapterPosition.function`, `officerFunctions.ts`, Chapter Setup function dropdown.
- **Demo seed:** `demoSeed.ts`, `demoRelativeDates.ts`, `demoRosterExpansion.ts`, `demoAttendanceSeed.ts`, dashboard stubs — relative dates, ~24 members, consistent dues/attendance.
- **Deep links:** `Dues.tsx` (`?status=unpaid`), `ExcuseApprovals.tsx` (`?status=pending`), `LibraryHours.tsx` (`?filter=below`), `Calendar.tsx` (`?event=`).
- **Guest preview:** `GuestLogin.tsx`, `guestPreview.ts` — pick officer function after Exec.
- **Member UX:** `MemberDashboard.tsx` quick access grid (stack on mobile), `TopBar` Chapter Room back, announcements policy (`announcementsOfficersOnly`), forms/calendar draft (`formCreateDraft.ts`), library hours assignment, budgets spending (from earlier in same working tree).
- **Header fix:** `formatChapterHeaderLine` — no duplicate “CHAPTER” in title.

**Verify:**
- `/preview` → Exec → choose function → `/home` tiles differ by function.
- Re-seed guest preview if attendance tiles show empty (Switch preview or clear demo storage).
- Member: `/my-dashboard` → Quick access shows all buttons stacked on narrow viewport.

**Follow-ups / known gaps:**
- Chapter-level custom tile layouts (L2) stored but no Setup UI yet.
- Stub tiles (minutes, risk forms, chores, etc.) use minimal seed data; full modules TODO.
- Calendar page still uses a fixed demo “today” in places; guest Home uses real `localTodayIso()`.

---

### (Partner: add your next entry above this line)

**Summary:**

**Changes:**

**Verify:**

**Follow-ups:**
