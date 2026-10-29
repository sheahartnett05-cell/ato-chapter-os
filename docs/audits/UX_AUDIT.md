# UX Audit — Agora merged shell (Agent 2: Usability / IA / polish)

Base: `agora-merged` @ df6d591 (Shea origin/main shell + partner landing/demo). Branch `agent/usability`.
Scope: audit only (no source changes on this branch). All line numbers refer to df6d591.

Path walked (by code reading, UI could not be run):
`/` → `/demo` (role → officer function) → `/home` (Officer Home) ↔ `/my-dashboard` (Chapter Room) → `/settings` →
`/chapter-setup` → a `FeatureRoute`-disabled page → Exit (GuestPreviewBanner → `leaveGuestPreview`) → `/demo` again.

Severity: **P0** = data loss / dead end / broken trust; **P1** = confusing or blocks a common task; **P2** = polish, a11y debt, consistency.

---

## 1. Top findings (read this first)

| # | Sev | Finding | Evidence |
|---|-----|---------|----------|
| 1 | **P0** | Entering the demo **destroys the backup of a real chapter**. `enterGuestPreview` calls `backupRealSession()` then `clearDemoData()`, and `clearDemoData` removes every key in `EXTRA_SESSION_KEYS`, which includes `'chapter-os-session-backup'`. On Exit, `restoreRealSession()` finds nothing and the real local chapter is gone. The demo copy promises the opposite ("Starting the demo sets that aside until you exit"). | `src/lib/enterGuestPreview.ts:38-39`; `src/lib/demoSeed.ts:208-215` (key list), `:256-265` (`clearDemoData`); copy at `src/pages/DemoPreview.tsx:238-241` |
| 2 | **P0** | **Dead-end redirect loop for officers in Chapter Room mode.** `ExecShell` silently bounces to `/my-dashboard` when view mode is `chapter-room`. Links shown *inside* the member shell point to exec-only routes: `FeatureRoute` "Open Chapter Setup", Settings "Manage officer positions". A president in Room mode clicks them and lands back in the Room with no explanation. This matches the "nav stuck" reports. | `src/components/routing/AppShells.tsx:128-141`; `src/components/routing/FeatureRoute.tsx:27-30`; `src/pages/Settings.tsx:108-114` |
| 3 | **P0 (trust)** | **Settings shows made-up dues receipts to real (non-guest) chapters**: "Aug 1, 2025 · $425" and "Jan 15, 2025 · $425" are hard-coded. | `src/pages/Settings.tsx:308-327` |
| 4 | **P1** | **The guest banner sits above fixed overlays.** The banner is `relative z-[60]`. The mobile sidebar drawer (`fixed inset-y-0 z-50`), `Modal` (`fixed inset-0 z-50`) and the drawer backdrop (`z-40`) all draw *under* it, so at 375px the banner covers the drawer's Logo row and **Close** button, and the top of every modal backdrop. This is the real "banner overlaps header" seam. The TopBar itself can't collide with the banner because it scrolls in a sibling container. | `src/components/routing/GuestPreviewBanner.tsx:18`; `src/components/layout/Sidebar.tsx:319-326`; `src/components/ui/Modal.tsx:25` |
| 5 | **P1** | **There are two stacked headers on mobile exec.** `ExecChrome` renders a `md:hidden` bar with a static title "Operations", then each page renders its own sticky `TopBar` with the real title. That costs about 56px at 375px, and the label is wrong on every page. | `src/components/routing/AppShells.tsx:79-89` |
| 6 | **P1** | **"Operations" and "Officer Home" naming is inconsistent.** The Settings card says "Operations". The mobile header says "Operations". The buttons say "Back to Home". The sidebar says "Home". The briefing says "Officer Home". | `src/pages/Settings.tsx:135,154`; `AppShells.tsx:88`; `ChapterModeNav.tsx:41,80`; `Sidebar.tsx:35` |
| 7 | **P1** | **"Back to Home" appears up to three times on the Room.** The strip (all member-shell routes), the hero button (`/my-dashboard`, sm+) and the TopBar pill (subpages) can show together. | `ChapterModeNav.tsx:22-45` (strip, mounted at `AppShells.tsx:44`); `MemberDashboard.tsx:320-328`; `ChapterModeNav.tsx:73-82` |
| 8 | **P1** | **The banner's "Switch view" link is ambiguous.** It goes to `/demo` (pick a different *demo persona*), but "view" is the app's word for Chapter Room vs Operations. | `GuestPreviewBanner.tsx:30-35` |
| 9 | **P1** | **The sidebar can show two active items at once.** Recruitment "Overview" (`/recruitment`) has no `end`, so it stays active on `/recruitment/pipeline` and `/recruitment/pnm/:id` alongside "Pipeline". Inactive hover (`bg-white/5 text-white`) is nearly identical to active (`bg-white/10 text-white`), so a hovered item reads as a second active item. | `Sidebar.tsx:83-84`, `:129-134`, `:266-271` |
| 10 | **P1** | **The bell is fake.** It has a permanent gold "unread" dot, no handler, and is hidden below `lg`. | `src/components/layout/TopBar.tsx:40-52` |
| 11 | **P1 (a11y)** | **The codebase has no `:focus-visible` style at all.** `.input-editorial` sets `outline: none` and only changes the border color. Keyboard focus is near-invisible on the dark sidebar and on gold. | `grep focus-visible src` → 0; `src/index.css:144-160` |
| 12 | **P1 (a11y)** | **Gold text on light surfaces fails AA.** `#c4a35a` on `#faf9f7` is about 2.3:1. It is used as link/text color in many places (`text-[var(--accent)]`, `text-accent`, `text-gold` in about 55 usages across 21 files). | e.g. `Settings.tsx:418,471,609,641`; `MemberProfile.tsx:73`; `BudgetDetail.tsx:66`; `ChapterTables.tsx:200`; `ChapterSetup.tsx:550` |
| 13 | **P1 (a11y)** | **Mono labels are too small or too faint.** There are 311 uses of `text-[9px]`/`text-[10px]`. Sidebar section labels are 9px at `text-white/35` (about 3.3:1 on #1a1a1a). The footer role line is 9px at `white/45`. The bottom-nav labels are 9px. The banner is 10px. The Settings card uses `text-neutral-400` on `bg-neutral-50` (about 2.4:1). | `Sidebar.tsx:149,304`; `MemberBottomNav.tsx:45`; `GuestPreviewBanner.tsx:25,39`; `ChapterModeNav.tsx:32,38`; `Settings.tsx:132-133` |
| 14 | **P2** | **`Modal` is not an accessible dialog.** It has no `role="dialog"`, `aria-modal` or `aria-labelledby`, no focus trap and no focus return. The mobile drawer has no Escape key, no focus trap and no `aria-modal`. | `src/components/ui/Modal.tsx:23-46`; `Sidebar.tsx:317-329` |
| 15 | **P2** | **There is no shared feedback layer.** No toast or undo exists (0 matches). Empty states are ad-hoc mono `text-xs` strings. Members has no "no results" row when search filters everything out. | `Announcements.tsx:259-262`; `Dues.tsx:210-213`; `Calendar.tsx:658-661`; `MemberManagement.tsx:198` |

---

## 2. Merge seams (Shea main × partner landing/demo)

| Seam | Status | Evidence / recommendation |
|------|--------|---------------------------|
| `/preview`, `/login`, `/demo`, `/` | **Not duplicates, but overlapping.** `/preview` and `/login` both render `Landing` unconditionally. `/` renders `Landing` only when not onboarded, otherwise it redirects to `defaultHomePath()`. So Landing's "You already have a chapter… Continue" / "Return to the demo" copy is only reachable via `/preview` or `/login`, and nothing in the app links there. | `App.tsx:69-75`; `OnboardingPage.tsx:37-51`; `Landing.tsx:42-57`. **Keep** `/preview` and `/login` as external aliases (old links, docs). Optionally add a "Start screen" link from Settings/guest card → `/preview`. No route removal needed. |
| `GuestLogin` | **Gone from code** (0 references in `src`). It still appears in AGENT_HANDOFF.md entries dated 2026-10-16 and 2026-10-18, and in the briefing §2/§3 ("GuestLogin function picker", "`/preview` → Exec → choose function"). Those verify steps no longer work: `/preview` is now Landing, and the function picker lives at `/demo` step 2. | `DemoPreview.tsx:202-232`. Coordinator: annotate the handoff when merging. |
| Two mobile headers / drawers | **One drawer** (Sidebar, owned by `ExecChrome`), but **two header bars** on mobile exec (finding 5). The drawer close is wired twice: `ExecChrome` effect on pathname plus `Sidebar` effect on pathname plus `onNavigate` per item. That is harmless but redundant. | `AppShells.tsx:64-66`; `Sidebar.tsx:171-173,221` |
| Guest sees "Signed in as —" / Sign out | **Mostly fixed.** Guests get the "Guest preview — data stays in this browser" card. Remaining gap: a **non-guest local-only chapter with cloud required but no session** still renders "Signed in as —" plus Sign out. The guest CTA "Create chapter / sign in" calls `leaveGuestPreview('/onboarding?intent=create')`, but `leaveGuestPreview` ignores the fallback and goes to `/home` when a backup exists. | `Settings.tsx:235-274`, `:261`; `leaveGuestPreview.ts:12-19` |
| `RootRedirect` vs `RequireOnboarded` | **Consistent.** Both send un-onboarded users to `/` → Landing. Nuance: `defaultHomePath()` is role-based and ignores view mode, so a president in Room mode hitting `/` or an unknown URL goes `/home` → `ExecShell` → `/my-dashboard`. Two hops, but no loop. After `restoreRealSession`, `leaveGuestPreview` hard-codes `/home` instead of `defaultHomePath()`, which for a member means two hops. | `OnboardingPage.tsx:46-51`; `AppShells.tsx:102-106,128-141`; `onboardingStorage.ts:46-50`; `leaveGuestPreview.ts:19` |
| `ExecSlides.tsx` | **Dead.** 375 lines with no imports (`/exec-slides` redirects to `/chapter-meeting`). It is safe to delete. The storage key `chapter-os-exec-slides` is still used by `ChapterResourcesContext` and must stay. | `App.tsx:301-304`; `ChapterResourcesContext.tsx:26` |
| Settings "Position" tab | **Dead code path.** `hasPositionTab = false`, so `PositionDashboard`, `TreasurerPanel` (incl. a fake "Stripe · Connected" and an uncontrolled `defaultValue={850}` dues input), `JBoardPanel`, `ChapterPoliciesPanel` and `AdminPanel` are unreachable. **Note:** "Wipe test chapter data" and "Re-run setup wizard" live only in `AdminPanel`, so those admin tools are currently unreachable too. | `Settings.tsx:333-658`, `:679` |
| `AdaptiveShell`, `SettingsShellPage` | Deprecated aliases with no importers. Safe to remove with ExecSlides. | `AppShells.tsx:143-151` |

---

## 3. Full issue list by area

### 3.1 Mental model and copy
- P1: Inconsistent "Operations" naming (finding 6). The user-facing name should be **Officer Home**, while the internal value `'operations'` and its storage keys stay unchanged.
- P1: The Settings view-mode card (`Settings.tsx:131-157`) is the only place that explains the dual shell. It uses off-brand neutral-50/neutral-400 styling and says "Operations uses the officer sidebar".
- P1: The banner says "Guest preview · demo chapter · local only" in 10px mono. A first-time viewer doesn't learn *who* they are previewing as. `GUEST_EXEC_FUNCTION_PRESETS` has the label, so the banner could say "Demo · previewing as Treasurer".
- P2: The demo persona's name is "Guest Treasurer" etc. (`enterGuestPreview.ts:22-33`), but the roster member it is mapped to (`memberId` m3, …) has a different real name, so Profile and Roster disagree. This is a trust issue.
- P2: The Room bottom nav uses the `Megaphone` icon for "Room" (`MemberBottomNav.tsx:7`).
- P2: The notification switches persist locally but nothing sends email or push (`Settings.tsx:177-178`). Add "(coming soon)" or hide them. Don't imply delivery.

### 3.2 Navigation and IA
- P0: Exec-only links rendered in the member shell cause the silent bounce (finding 2). The same applies to `ChapterSetup.tsx:62` and `StandardsSetup.tsx:38`, which `Navigate` to `/home` for non-admins (fine), but a member with no exec capability then bounces again to `/my-dashboard`.
- P1: `ExecShell`'s redirect for `kind === 'member'` gives no feedback. Prefer: when an exec-capable user in Room mode deep-links to an exec route, **switch view mode to `operations` and render**, because the URL is explicit intent. Keep the redirect only for non-exec users.
- P1: Sidebar dual-active (finding 9).
- P1: The Sidebar has two Settings-gear items, "Chapter Setup" (Admin) and "Settings" (Account), with identical icons (`Sidebar.tsx:99,257`).
- P2: The Sidebar `<nav>` has no `aria-label`. The bottom nav uses `Link` instead of `NavLink`, so it has no `aria-current="page"` (`MemberBottomNav.tsx:42-51`).
- P2: The ExecChrome mobile menu button is 34px. Use a 44px touch target (`AppShells.tsx:80-87`).
- P2: `MemberBottomNav` is `fixed` (z-30) while `MemberChrome` is an `h-dvh` flex column. This works because of `pb-[4.25rem]`, but there is no `env(safe-area-inset-bottom)` padding, so on iOS the home indicator overlaps the labels.

### 3.3 Chrome layering (banner, TopBar, overlays)
- P1: Banner z-index over overlays (finding 4).
- P2: `TopBar` is `sticky top-[2px]` (`TopBar.tsx:15`) to sit under the 2px `theme-stripe`, but the stripe is inside the scroll container (`AppShells.tsx:91`) and scrolls away. The result is a **2px gap above the sticky TopBar** where content shows through while scrolling. On mobile the stripe is `hidden` but the 2px offset remains. In `MemberChrome` there is no stripe at all.
- P2: The member shell stacks banner + Operations strip (+ hero) before content. At 375px with a guest officer in Room mode, that is about 90px of chrome before the hero.

### 3.4 Guest preview lifecycle (exit / re-enter)
- **P0**: The backup is destroyed on enter (finding 1).
- P1: `leaveGuestPreview(fallbackPath)` ignores `fallbackPath` when a backup exists and hard-codes `/home` (`leaveGuestPreview.ts:12-19`).
- P2: Exit without a backup doesn't clear `chapter-os-dashboard-function`, the old `chapter-os-view-mode-<userId>` key, or the notify flags. Re-entering overwrites what matters (new userId + view mode + function for exec). For a *member* re-entry, a stale exec dashboard function lingers. This is harmless today, but `clearDemoData` should own these keys.
- P2: `main.tsx:11-12` wipes everything when `demoSeeded` exists without the guest flag. Combined with finding 1, an interrupted exit (tab closed mid-reload) can leave a real user with nothing. Making `restoreRealSession` atomic (write the restored keys, *then* drop the flag and the backup) and keeping the backup out of `clearDemoData` fixes both.
- OK: The seed version path (`ensureGuestDemoFresh`) reseeds data only and keeps onboarding/persona. That is fine.
- OK: Re-entering via the banner's "Switch view" while already a guest: `backupRealSession` early-returns while the guest flag is set, so the (already-lost) backup isn't overwritten with demo data. That is correct once finding 1 is fixed.

### 3.5 Accessibility
- P1: No focus-visible rings (finding 11). Inputs drop the outline.
- P1: Gold-on-light text (finding 12). Gold on the dark sidebar (#1a1a1a) is about 7:1 and passes for ATO's palette, but `--accent` is org-driven (`ChapterContext.tsx:116`), so other orgs can fail on dark too.
- P1: Tiny or low-contrast mono labels (finding 13).
- P2: `--muted #6b6b6b` passes AA on `#faf9f7` (about 5.1:1) and on the org-tinted `--surface-tint` (about 4.6–4.8:1 for dark primaries). That is marginal, so darken to about `#5c5c5c` for headroom.
- P2: Modal and drawer dialog semantics (finding 14). `Sidebar.tsx:323` labels the backdrop "Close menu backdrop". Use `aria-hidden` plus `tabIndex={-1}` on the backdrop and rely on the real Close button and Escape.
- P2: The Room hero avatar link (`MemberDashboard.tsx:330-338`) has only initials as its name. Add `aria-label="Your profile"`.
- P2: Settings switches are fine (`role="switch"`, `aria-checked`). The Chapter policies switch (`Settings.tsx:454-469`) has no accessible label, but that code is currently dead.

### 3.6 Feedback, empty and loading states
- P1: No toast/undo pattern. Destructive actions use `ConfirmDialog`, and edits save silently.
- P2: Empty states are inconsistent (finding 15). The Members filtered-to-zero case renders an empty table.
- P2: No loading or skeleton states. Local data is synchronous, but `CloudBootstrap` and cloud sync paths could use a skeleton.

### 3.7 Trust and data consistency
- P0: Fake dues receipts in Settings (finding 3).
- P1: The Members subtitle `"{filtered.length} on roster"` changes as you type in search, so it reads like the roster size shrank (`MemberManagement.tsx:79`). Use `members.length` for "on roster" and show "N shown" separately.
- P2: The fake "Stripe · Connected" in the dead `TreasurerPanel` (`Settings.tsx:366`) must not be revived as-is.

### 3.8 Mobile
- P1: Double header on exec mobile (finding 5).
- P1: The drawer top is hidden under the banner (finding 4).
- P2: The bell is hidden below `lg` (finding 10). Once it is real, it needs a mobile entry point (TopBar icon at all sizes, or the Room hero).
- P2: There is no safe-area padding on the bottom nav (3.2).

---

## 4. ⌘K command palette — strategy

**Goal:** One keyboard and mobile entry to jump anywhere. It respects feature flags, permissions and the dual shell.

1. **Nav registry (prerequisite, small refactor).** Extract `mainNav`, `recruitmentNav` and `adminNav` from `Sidebar.tsx:34-109`, plus the bottom-nav `NAV` (`MemberBottomNav.tsx:6-12`), into `src/lib/nav/registry.ts`. Each entry is `{ to, label, icon, feature?, perm?, shell: 'exec' | 'member' | 'shared', keywords? }`. Sidebar, bottom nav and the palette all read from it, so a module Agent 3 adds appears everywhere with one edit.
2. **Sources** (all synchronous, from existing contexts):
   - Routes: registry filtered by `isFeatureEnabled` and `permissions[perm]`.
   - Members: `useMembers().members` → `/members/:id`. Only if `roster` is enabled and `canManageRoster`. Otherwise, for members, hide them or route to a read-only profile later.
   - Events: `useChapterOps().events` (upcoming first, next 60 days) → `/events/:id`. Only if `calendar` is enabled. Member shell hides exec-only events, using the `Event.audience` rule from `Calendar.tsx`.
   - Actions (phase 2): "Switch to Chapter Room / Officer Home", "Post announcement", "Exit demo" (guest only).
3. **Shell rule.** Selecting an exec-shell route while in `chapter-room` mode calls `setViewMode('operations')` before `navigate()`, mirroring `useGoToOperations`. This avoids the silent bounce from finding 2. Non-exec users never see exec routes.
4. **UI.** `src/components/ui/CommandPalette.tsx` is mounted once inside `BrowserRouter` (needs router + contexts), e.g. in both chromes or a `<GlobalOverlays/>` in `App.tsx`. Open it with `metaKey||ctrlKey + k` (`preventDefault`) or a TopBar search button (all breakpoints, `aria-keyshortcuts="Meta+K Control+K"`). Use the ARIA combobox pattern: input `role="combobox"` + `aria-controls` → `role="listbox"`, `aria-activedescendant`, arrow, Enter and Escape keys, and focus restore. Use simple scored substring matching (label > keywords > secondary text); no dependency is needed.
5. **Risks.** `Sidebar.tsx` and `MemberBottomNav.tsx` are append-edited by Agent 3. Land the registry refactor at integration time (or have Agent 3 append to the registry instead). Keep the palette out of Landing, Demo and Onboarding.

## 5. Notification bell — strategy

**Goal:** Turn the decorative bell (`TopBar.tsx:40-52`) into a real inbox: unread count, mark-all-read, deep links. No backend is needed for v1.

1. **Data.** Build items from what already exists:
   - Officers: `buildActionLedgerTasks(...)` (`src/lib/dashboard/actionLedgerTasks.ts:15`), which already has per-item `id`, `title`, `link` (deep links like `/excuses?status=pending`, `/dues?status=unpaid`) and officer `functions`. Fall back to `buildLiveAlerts` (`src/lib/liveAlerts.ts:14`) for aggregate items. Reuse the inputs `useOfficerDashboard` already computes rather than recomputing.
   - Members: new announcements since last seen (`CommunicationsContext` posts), new or changed events in the next 7 days, own dues balance and own pending excuse status.
   - Filter every item by `isFeatureEnabled` for the feature behind its link.
2. **Read state.** Store `chapter-os-notif-read-<userId>` as `{ [itemId]: fingerprint }`, where the fingerprint is the title (aggregate counts change the title, so "3 unpaid dues" → "4 unpaid dues" becomes unread again). Unread means the fingerprint is missing or different. "Mark all read" writes the current map. Clicking an item marks it read, then navigates (with the same view-mode switch rule as ⌘K). Add the key to `clearDemoData` so the demo starts fresh.
3. **UI.** A `NotificationBell` popover (`role="dialog"`, labelled, Escape closes, focus returns) with the count badge only when > 0 (`aria-label="Notifications, 3 unread"`). Show it at all breakpoints in `TopBar`, and in the Room hero for the member shell. Empty state: "You're all caught up."
4. **Later.** Persist to a Supabase `notifications` table with RLS by `chapter_id` + recipient, and wire the email/push switches in Settings. That belongs to Agent 3 or platform work.
5. **Risk.** `useOfficerDashboard` is Agent 3-owned. Consume it read-only and don't modify it.

---

## 6. Prioritized fix plan

Each cluster is a small commit. The type-check runs before each one (baseline: 2 stub errors in `supabaseSession.ts`). Ownership notes flag files outside Agent 2's list.

### Cluster A — Trust and data safety (P0) · about 1h
| Fix | Files | Approach |
|-----|-------|----------|
| Keep the real-session backup on demo entry | `src/lib/demoSeed.ts` | Remove `'chapter-os-session-backup'` from `EXTRA_SESSION_KEYS` (both backup and clear use it). Make `restoreRealSession` write the bag, then remove the backup and the guest flag. Add `chapter-os-dashboard-function` (and the future notif-read key) to the clear list. |
| Honor the exit target | `src/lib/leaveGuestPreview.ts` | After a restore, go to `defaultHomePath()`. If the caller passed an explicit non-`/` fallback (e.g. create chapter), restore and then go there. |
| Remove fake receipts | `src/pages/Settings.tsx:308-327` | Replace with the member's real charges/payments from `ChapterOpsContext` (dues charges/payments for `memberId`), or an EmptyState "No payments recorded yet". |
| "Signed in as —" | `Settings.tsx:254-273` | When `!cloudEmail`, show "Not signed in — this chapter is saved only in this browser" + "Sign in" instead of "—" + Sign out. |

Risk: `demoSeed.ts` is shared by all agents. The change is tiny and additive, but flag it to the coordinator.

### Cluster B — Naming and dead ends (P0/P1) · about 1.5h
| Fix | Files | Approach |
|-----|-------|----------|
| "Operations" → "Officer Home" (user-facing only) | `Settings.tsx:135,154`, `AppShells.tsx:88` (and comments) | Keep `'operations'` and its storage keys. Settings copy: "Chapter Room — the member layout with bottom tabs. Officer Home — the officer sidebar and tools." Restyle the card with `--rule`/`--surface-card`/`--muted` tokens. |
| Explicit deep links switch the shell | `AppShells.tsx:128-141` | If `execCapable && kind === 'member'`, call `setViewMode('operations')` in an effect and render `ExecChrome`. Keep the redirect only for non-exec users. This fixes the FeatureRoute and Settings links in one place. |
| De-duplicate "Back to Home" | `ChapterModeNav.tsx`, `MemberDashboard.tsx:320-328` | Keep one control. Recommended: the strip (it is visible on all Room routes, all sizes). Drop the TopBar pill's exec button and the hero duplicate, or hide the strip on `/my-dashboard`. Rename both to "Officer Home". |
| Banner copy | `GuestPreviewBanner.tsx` | "Demo · viewing as {persona}" and rename "Switch view" → "Change demo role". |
| Dead code | `src/pages/ExecSlides.tsx`, `AppShells.tsx:143-151` | Delete (no importers). Decide the fate of the Settings Position panels. Recommendation: move "Re-run setup wizard" and "Wipe test chapter data" into Chapter Setup → Danger zone, then delete the rest. |

### Cluster C — Chrome layering and mobile (P1) · about 1.5h
| Fix | Files | Approach |
|-----|-------|----------|
| Banner vs overlays | `GuestPreviewBanner.tsx:18` | Drop `z-[60]` (the banner is in normal flow and doesn't need it). Overlays (drawer z-50, modal z-50) then cover it. Or define a z-scale in `index.css` (`--z-banner:30; --z-nav:40; --z-drawer:50; --z-modal:60; --z-toast:70`) and use it everywhere. |
| Mobile exec double header | `AppShells.tsx:79-89`, `TopBar.tsx` | Remove the static bar. Render the menu button inside `TopBar` (left of the title, `md:hidden`) via a small `ShellMenuContext` that `ExecChrome` provides. Pages are untouched. |
| TopBar 2px gap | `TopBar.tsx:15`, `AppShells.tsx:91` | Use `sticky top-0` and move `theme-stripe` outside the scroll container (above `<main>`). |
| Safe-area and targets | `MemberBottomNav.tsx`, `AppShells.tsx:80` | `pb-[env(safe-area-inset-bottom)]` on the nav. Use a 44px menu button. |

### Cluster D — Sidebar and a11y tokens (P1) · about 2h
| Fix | Files | Approach |
|-----|-------|----------|
| Single active state | `Sidebar.tsx:83,129-134,266-271` | Add `end: true` to Recruitment Overview. Inactive hover → `hover:bg-white/5 hover:text-white/85` (no full-white, no border). Active keeps the accent border and `bg-white/10`. Use the same `NavItem` for the Chapter Room link (pass `onClick` for view mode). |
| Labels | `Sidebar.tsx:149,304`, `MemberBottomNav.tsx:45`, `ChapterModeNav.tsx:32,38`, `GuestPreviewBanner.tsx:25,39`, `Settings.tsx` labels | Mono labels at a minimum of 11px. Sidebar label opacity ≥ `white/60`. Then add an `index.css` utility `.label-mono` (11px, 0.14em, `--muted`) for pages to adopt incrementally (311 usages, so don't codemod blindly). |
| Focus rings | `src/index.css` | Add `:where(a,button,[role=switch],summary,input,select,textarea,[tabindex]):focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px }`. Use `--focus-ring: var(--ink)` on light and `.theme-sidebar { --focus-ring: var(--accent) }` on dark. Replace `.input-editorial` `outline:none` with the ring. |
| Gold text | `src/context/ChapterContext.tsx` (outside ownership, minimal), `index.css`, call sites | Add a `--accent-ink` token: darken `accent` with `darkenHex` in steps until contrast against `#faf9f7` is ≥ 4.5 (uses `hexLuminance` in `themeUtils.ts`). Swap `text-[var(--accent)]`/`text-accent`/`text-gold` → `text-[var(--accent-ink)]` **on light surfaces only** (keep gold fills, borders and sidebar icons). Also darken `--muted` to `#5c5c5c`. |
| aria | `Sidebar.tsx` (`<nav aria-label="Officer navigation">`), `MemberBottomNav.tsx` (`aria-current`), `MemberDashboard.tsx:330` (avatar label), `Modal.tsx` (dialog semantics + focus trap/return), drawer (Escape + `aria-modal`) | Mechanical. |

### Cluster E — Feedback primitives (P1/P2) · about 2h
Proposed API in `src/components/ui/` (not built, since this is audit-only):
- `ToastProvider` + `useToast()` → `toast({ title, description?, tone?: 'neutral'|'success'|'error', action?: { label: 'Undo', onClick } , durationMs? })`. One `aria-live="polite"` region, z-index from the scale. Mount it in `App.tsx` inside `BrowserRouter`.
- `<EmptyState icon? title description? action? compact? />` uses the serif title, muted copy and `--rule` border, matching the `FeatureRoute` card style.
- `<SkeletonRows count? />` / `<Skeleton className />` uses `animate-pulse` blocks and respects `prefers-reduced-motion`.

Adopt without restyling on: Members (zero-results + roster empty, `MemberManagement.tsx:198`), Announcements feed (`:259`), Dues charges (`:210`), Calendar agenda (`:658`). First toasts: announcement posted or deleted (with Undo), dues payment recorded, and member saved.

### Cluster F — ⌘K and bell (P2) · about 4–6h
See §4 and §5. Do the nav registry first, because it removes a merge hotspot for Agent 3.

### Sequencing and risks
- Order: A → B → C → D → E → F. A and B are the highest pain per line changed.
- Files outside Agent 2 ownership that the plan touches: `src/lib/demoSeed.ts`, `src/lib/leaveGuestPreview.ts` (Cluster A), `src/context/ChapterContext.tsx` (one token), and `src/pages/MemberDashboard.tsx`/`MemberManagement.tsx`/`Dues.tsx`/`Calendar.tsx`/`Announcements.tsx` (small adoptions). All edits are small and listed for the coordinator.
- The `ExecShell` behavior change (B) alters Shea's redirect semantics. It is still view-mode-driven and only adds "explicit exec URL switches the mode". Confirm with Shea/coordinator before landing.
- Agent 3 appends nav entries to `Sidebar.tsx`/`MemberBottomNav.tsx`, so land the registry refactor after integration.

---

## 7. Manual verify steps (after fixes land)

Run each at **375×812**, **768×1024**, **1280×800**. Clear site data first.

1. **Backup safety (A).** Create a chapter via `/onboarding?intent=create` and add one announcement. Go to `/preview` → Try the demo → Officer → Treasurer → Open. Exit from the gold bar. *Expect:* your own chapter and announcement are back, you land on your home, and there's no "Leaving preview…" flash longer than one reload.
2. **Clean re-entry.** Exit with no real chapter → Landing. `/demo` → Member → Open → Room loads with the bottom nav and no sidebar. Exit → `/demo` → Officer → President → `/home` with the sidebar, and president tiles differ from Treasurer's.
3. **Naming (B).** In the officer demo: Settings → view card reads "Chapter Room / Officer Home". Choose Chapter Room → the shell switches to bottom tabs. Exactly **one** "Officer Home" control is visible on `/my-dashboard` and on `/calendar` in the Room. Click it → `/home` with the sidebar.
4. **Dead-end fix (B).** In the officer demo in Room mode: Settings → Officer positions → Manage → *expect* Chapter Setup opens in Officer Home (no bounce). Chapter Setup → turn off Calendar → visit `/calendar` → "Not available" → Open Chapter Setup → it opens.
5. **Banner layering (C).** At 375 in the officer demo, open the menu: the drawer's logo row and **Close** button are fully visible and tappable, and Escape closes it. Open any modal (e.g. Add member): the backdrop covers the gold bar. Scroll a long page (Members): the TopBar sticks flush with no 2px strip of content above it. Only **one** header row (TopBar with menu button) shows at 375.
6. **Sidebar (D).** At 1280, open `/recruitment/pipeline`: only "Pipeline" is highlighted. Hover other items: they lighten but don't look selected. From `/settings`, click every sidebar item and confirm each navigates.
7. **Keyboard (D).** Tab from the page top on `/home` and `/my-dashboard`: every link, button, switch and input shows a visible ring on both the dark sidebar and the light canvas. Bottom nav: the current tab is announced as current (screen reader / DevTools a11y pane).
8. **Contrast (D).** Lighthouse a11y on `/home`, `/my-dashboard`, `/settings`, `/members` should be ≥ 95. DevTools contrast checker on a gold link in Settings ≥ 4.5:1 and on sidebar section labels ≥ 4.5:1.
9. **Feedback (E).** Members: search "zzzz" → EmptyState with "Clear search". Announcements: post, then delete → toast with Undo restores it. Dues/Calendar agenda in a fresh real chapter → EmptyState with a primary action.
10. **Trust (A/3.7).** In a real chapter, Settings shows no made-up receipts. The Members subtitle roster count doesn't change while typing in search.
11. **⌘K / bell (F, if built).** Ctrl/⌘+K anywhere in the app opens the palette. Typing a member name → profile. Typing "dues" with Dues disabled → no result. In Room mode, choosing "Members" switches to Officer Home. Bell shows a count, "Mark all read" clears it, and a new unpaid member makes it unread again.
