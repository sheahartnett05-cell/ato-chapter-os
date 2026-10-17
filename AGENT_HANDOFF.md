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
