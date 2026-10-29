# Agora — Features Audit & Slice Plan (Agent 3)

Branch `agent/features`, base `df6d591`, written 2026-10-29. **This is an audit only.** No source files changed.
All references are `path:line` relative to the repo root. Nothing here was clicked through in a browser (there is no dev server in this environment). Every finding comes from reading the code.

---

## 0. Top findings (read this first)

1. **Every chapter member can write all chapter data in the cloud.** The app uses only `chapter_kv` (`src/lib/chapterCloud.ts:351`). Its RLS policy is `is_chapter_member(chapter_id)` for select, insert, update and delete (`supabase/migrations/20260326000000_auth_membership_rls.sql:115-130`). No role is checked. Any member can overwrite roster, dues, attendance, fines, governance, or ballots from a browser console. Hiding the UI is the only control in place.
2. **Members can join any chapter and pick their own role.** `memberships_insert_self` checks only `user_id = auth.uid()`. `memberships_update_self` lets a user update their own `role` column (`supabase/migrations/20260327000000_wipe_test_chapters_fix_claim.sql:99-108`). That means any signed-in user can insert themselves into any `chapter_id` they can guess, with `role='President'`. **This must be fixed before cloud voting or check-in has any integrity.**
3. **`chapter_kv` is last-write-wins on whole blobs, and nothing re-hydrates it.** Hydration runs once at boot (`src/components/routing/CloudBootstrap.tsx:45`). There is no realtime and no polling. Each write upserts the entire key (`src/lib/chapterCloud.ts:339-352`). If members check in or vote by writing `chapter-os-attendance` or a votes blob, devices will clobber each other's writes. Member-originated writes need per-row storage plus RPCs, not kv blobs.
4. **Every client writes computed data back to the cloud.** `AttendanceSyncBridge` and `DuesSyncBridge` (`src/App.tsx:65-66`) recompute `attendancePct` and dues fields. When anything differs, they persist the **whole roster** (`src/context/MembersContext.tsx:870-894`). So every member's device can push its own stale copy of `chapter-os-roster-members` to the cloud.
5. **Attendance and points disagree across pages.**
   - `Member.points` is a static seed number (`src/data/demoFixtures.ts:27…246`, `src/data/demoRosterExpansion.ts:53`). It is shown on Chapter Room (`src/pages/MemberDashboard.tsx:399`), MyProfile (`src/pages/MyProfile.tsx:236`) and Members (`src/pages/MemberManagement.tsx:262`).
   - The officer member profile instead sums `pointsEarned` from attendance rows (`src/pages/MemberProfile.tsx:52-55,144,335`). **The same member shows two different point totals.**
   - The attendance % formula is: rows Present or Excused, divided by the rows the member appears in (`src/lib/attendanceSync.ts:4-24`).
   - The Home tile uses a different formula: Present or Excused, divided by **all active members** (`src/lib/dashboard/dashboardTileCompute.ts:77-83`).
   - Neither formula distinguishes required from optional events, or consults approved excuses directly.
6. **Seed data contradicts itself.**
   - Demo attendance is assigned by roster index (`src/data/demoAttendanceSeed.ts:6-25`) and ignores the approved excuse `ex2` (m6 @ e1) and the pending excuse `ex1` (m5 @ e2) (`src/data/eventParticipationData.ts:45-62`).
   - Every seeded attendance row awards 5 points, even for e2, which is worth 10 (`src/data/demoAttendanceSeed.ts:20`, `src/data/demoFixtures.ts:277`).
7. **Standards settings are stored but nothing uses them.**
   - `fine_matrix[].point_penalty` (`src/types/standardsConfig.ts:43`) and `appeal_policy.auto_lock_fines` are never read. The toggle copy says it will "Automatically send finalized fines to billing" (`src/components/standards/StandardsSetupWizard.tsx:539-547`), but nothing reads the flag.
   - Fines live only in the `chapter-os-governance` blob. They never become dues charges.
   - Denying the same excuse twice issues two fines, because the denial path has no idempotency check (`src/pages/ExcuseApprovals.tsx:41-56`).
8. **Dues "Record" payment always applies to `duesCharges[0]`**, whichever charge the balance actually belongs to (`src/pages/Dues.tsx:269-272`).
9. **Officer Home tiles have broken or misleading links and data.**
   - `standards_cases` links to `/j-board`, which has no route, so it falls through to `RootRedirect` (`src/lib/dashboard/tileRegistryMeta.ts:38`, `src/lib/dashboard/dashboardTileCompute.ts:287`; routes in `src/App.tsx`).
   - The `service_hours` tile counts "below minimum" from **study-hour** logs (`src/lib/dashboard/dashboardTileCompute.ts:384-386`).
   - Members ignores `?filter=attention|pending|new-member` (`src/pages/MemberManagement.tsx:46-48`).
   - `?filter=attendance` sorts highest first, the opposite of what the low-attendance ledger task needs (`src/pages/MemberManagement.tsx:69`).
   - Stub tiles read `chapter-os-dashboard-stubs` once per mount (`src/hooks/useOfficerDashboard.ts:50-54`).
10. **Some storage keys sit outside `STORAGE_KEYS`.**
    - `chapter-os-chapter-meeting` (`src/context/ChapterResourcesContext.tsx:27`) and `chapter-os-budgets` (`src/context/BudgetContext.tsx:14`; that one is in `EXTRA_SESSION_KEYS`) are not in `STORAGE_KEYS`.
    - As a result, the meeting notes key is skipped by `CLOUD_SYNC_KEYS` (`src/lib/chapterCloud.ts:19-27`), `backupRealSession` (`src/lib/demoSeed.ts:216-232`) and `clearDemoData` (`src/lib/demoSeed.ts:251-260`). Real meeting notes therefore leak into guest preview, guest edits survive the exit, and a founder's initial push leaves them out.
    - Any new module key **must** be added to `STORAGE_KEYS`.
11. **The normalized Supabase tables are dead weight.** `events`, `event_attendance`, `fines`, `dues_*` and the others (`supabase/migrations/20260324000000_agora_initial.sql:53-140`) use uuid foreign keys to `chapter_members`. The app uses string ids (`m1`, `e1`) and never queries these tables. Only `chapter_kv`, `chapters`, `chapter_memberships` and `profiles` are used (`src/lib/chapterCloud.ts`, `src/lib/supabaseAuth.ts`).
12. **The only existing voting is the announcement poll, and it is neither anonymous nor binding.** It stores `voterIds: memberId → optionIds` next to the counts (`src/types/features.ts:13-20`), and there is no quorum, eligibility or reveal-on-close. It must not be reused for motions or bid votes.

---

## 1. Platform plumbing (what new modules plug into)

| Concern | Where | Notes |
|---|---|---|
| Persistence | `src/lib/persist.ts:34-63` `readJson` / `writeJson` | Writes go to localStorage first. Then `queueChapterKvWrite` runs when not guest and Supabase is configured. |
| Cloud sync | `src/lib/chapterCloud.ts:19-27` `CLOUD_SYNC_KEYS`; `:317-358` queue/flush; `:360-391` hydrate | Any `chapter-os-*` key is queued on write (`:320`). Only keys in `CLOUD_SYNC_KEYS` are pushed on founder bootstrap (`:393-409`). |
| Key registry | `src/lib/demoSeed.ts:50-86` `STORAGE_KEYS` | Drives cloud push, guest backup/restore and clear. **Register every new key here.** |
| Guest seed | `src/lib/demoSeed.ts:105-190` `seedGuestDemo`; `ensureGuestDemoFresh` `:193-203`; `DEMO_SEED_VERSION='3'` `src/lib/demoRelativeDates.ts:13` | `relativizeDemo` (`src/lib/demoRelativeDates.ts:61-77`) shifts **every** string that starts with `YYYY-MM-DD` and replaces the literal `2025` in all strings. New seed ids and codes must not contain `2025`. |
| Feature flags | `src/types/chapterFeatures.ts:3-16,46-125`; `src/context/ChapterFeaturesContext.tsx:20-37,48-51` | `readState` merges stored flags over defaults. A new flag with `defaultEnabled: true` is therefore ON for the guest demo (the seed never writes features) and for existing chapters. |
| Feature gate | `src/components/routing/FeatureRoute.tsx:43-54`; Sidebar `src/components/layout/Sidebar.tsx:40-107,175`; bottom nav `src/components/layout/MemberBottomNav.tsx:7-25` | Nav items carry `feature:`. |
| Setup UI | `src/pages/ChapterSetup.tsx:377-410` | Renders `catalog` toggles generically. Module config, such as points rules, needs its own Section. |
| Module config pattern | `src/lib/standardsConfigStorage.ts`, `src/hooks/useStandardsModuleConfig.ts` | A versioned envelope plus a change event. Copy this pattern for `attendance`/`points` config. |
| Permissions | `src/types/permissions.ts:2-13,85-110` | `canAccessExecTools`, `canEditEventPoints` (both `isExec`), `canManageFines`, `canAccessTreasurerSettings`, `canAccessAdminSettings`. Roles: President, Treasurer, JBoardChair, RecruitmentChair, ScholarshipChair, Chaplain, ActiveMember, NewMember. |
| Provider tree | `src/App.tsx:43-66` | A new `AttendancePointsProvider` and `VotingProvider` belong inside `ChapterOpsProvider` and next to `BudgetProvider`, with their bridges alongside `AttendanceSyncBridge`. |
| StrictMode | `src/main.tsx:22` | Updaters must stay pure. `fileCase` calls `setFinesList` inside a `setCases` updater (`src/context/GovernanceContext.tsx:246-279`), which can double-append in dev. New code must not copy that pattern. |

---

## 2. §7 area-by-area: what exists today

### 2.1 Attendance & points (§4E/§7) — partially built, not trustworthy
- **Data:** `attendance: Record<eventId, AttendanceEntry[]>` with `status: Present|Excused|Absent` and `pointsEarned` (`src/types/index.ts:96-100`). Key `chapter-os-attendance` (`src/lib/demoSeed.ts:65`). Read and written by `src/context/ChapterOpsContext.tsx:136-140,214-260`.
- **Roll call:** EventPage has an "attendance" tab with Present, Excused and Absent buttons for exec users (`src/pages/EventPage.tsx:50,364-424`). Points are `event.points` when Present, otherwise 0 (`:392-397`).
- **Points tab:** lists `pointsEarned` per row. When there are no rows it falls back to form RSVPs (`src/pages/EventPage.tsx:427-462`).
- **Excuses:** approving one writes an `Excused` row (`src/pages/ExcuseApprovals.tsx:36-39`). Denying one writes `Absent` and issues a fine (`:41-56`). A later roll call can overwrite an approved excuse with Absent, and nothing reconciles the two.
- **% sync:** `AttendanceSyncBridge` (`src/components/routing/AttendanceSyncBridge.tsx`) calls `syncMemberAttendancePct` (`src/lib/attendanceSync.ts:27-44`), which rewrites `Member.attendancePct` in the roster blob.
- **Missing:** check-in sessions, rotating codes, member self check-in, geofence, required vs optional weighting, a points ledger, points rules, manual adjustments, and a member-visible "why" list.
- **Demo:** `src/lib/demoSeed.ts:144-147` seeds e1 and e2 via `buildAttendanceForMeeting` (`src/data/demoAttendanceSeed.ts`). The roster-expansion `attendancePct` (`src/data/demoRosterExpansion.ts:52`) is overwritten on boot.

### 2.2 Meetings & voting (§4Q/§7) — no voting
- **Chapter meeting:** `src/pages/ChapterMeeting.tsx` has tabs for agenda, minutes, presentations and files (`:9,24-29`). Data is `ChapterMeetingNotes {agenda, minutes, attachments}` (`src/types/chapterResources.ts:37-41`) under the unregistered key `chapter-os-chapter-meeting` (`src/context/ChapterResourcesContext.tsx:27,93-100`). The feature flag is still named `execSlides` (`src/types/chapterFeatures.ts:113-118`).
- **Dead code:** `src/pages/ExecSlides.tsx` (375 lines) is no longer routed. `/exec-slides` redirects.
- **Polls:** see finding 12. `src/components/communications/PollCard.tsx`, `src/context/CommunicationsContext.tsx:~124`.
- **Missing:** motions, a ballot primitive, quorum, anonymity, eligibility, elections, and bid votes.

### 2.3 Recruitment upgrades (overlap with Agent 1)
- `Prospect` has `rating: number` but no `legacy` or `conflictMemberIds` field (`src/types/index.ts:107-128`).
- There is no bid-vote store. Agent 1 owns the Prospect fields. Agent 3 owns the vote primitive (see §4).

### 2.4 New member program — stub only
- `nm_class` and `nm_behind` tiles read `stubs.nmRequirements` (`src/lib/dashboard/dashboardTileCompute.ts:309-339`). The seed is `src/data/dashboardStubSeed.ts:65-68`.
- There is no checklist, quiz, big/little or anti-hazing acknowledgment module. `Member.big`/`little` are plain strings.

### 2.5 Risk management — stub only
- `risk_forms` and `sober_monitors` tiles read `stubs.eventRisk` (`src/lib/dashboard/dashboardTileCompute.ts:340-359`, `src/data/dashboardStubSeed.ts:69-74`).
- There are no incident reports and no policy vault. The tiles link to `/calendar`, which has no risk UI.

### 2.6 Academics — partial (study hours only)
- Study hours are real: `src/lib/studyHours.ts`, `src/pages/LibraryHours.tsx`, and `src/context/ChapterOpsContext.tsx:177-185,307-416`.
- There is no GPA, no probation flag, and no academic link. `Probation` exists only as a standards `SanctionType` (`src/types/governance.ts:13-15`).

### 2.7 Service & philanthropy — stub only
- `service_hours` and `funds_raised` tiles read `stubs.serviceHours` and `stubs.philanthropy` (`src/lib/dashboard/dashboardTileCompute.ts:379-405`). There is a study-hours bug at `:384-386`.
- There is no logging or verification UI.

### 2.8 Finance — partial
- **Dues:** charges, payments and BillHighway are real (`src/context/ChapterOpsContext.tsx:418-509`, `src/pages/Dues.tsx`). There is a `duesCharges[0]` bug at `src/pages/Dues.tsx:269`. `memberDuesBalance` counts every charge with empty `assignedMemberIds` against **every** member, alumni included (`src/context/ChapterOpsContext.tsx:511-526`). The roster sync filters alumni separately.
- **Fines:** these are `Fine {id, memberId, caseId?, amount, reason, dateIssued, dueDate, status}` (`src/types/governance.ts:35-44`), stored in `chapter-os-governance`. They are created by `fileCase` (`src/context/GovernanceContext.tsx:246-279`), `issueFine` (`:281-297`) and excuse denial. Fines never reach dues (finding 7).
- **Budgets:** `src/types/budget.ts`, `src/context/BudgetContext.tsx`. Expenses have no receipts and no approvals.
- **Missing:** reimbursements, which appear only as copy (`src/data/featureData.ts:182`), payment plans, late fees, exports and an audit trail.

### 2.9 House — partial
- `HouseTask` (`src/types/chapterResources.ts:14-26`) and `src/pages/HouseMaintenance.tsx` work.
- `chores`, `house_bills` and `maintenance` tiles read stubs, not house tasks (`src/lib/dashboard/dashboardTileCompute.ts:406-435`). `maintenance` could be wired to `HouseTask` today.

### 2.10 Communication — UI only
- Notification switches are local, per device (`src/pages/Settings.tsx:177-178,278-291`). There is no push, digest, read receipt or bell.

### 2.11 Alumni & family — stub only
- The `alumni` tile reads `stubs.alumni` (`src/lib/dashboard/dashboardTileCompute.ts:436-452`) and links to `/chapter-setup`, which has no alumni UI.

### 2.12 Calendar upgrades — none
- There is no iCal feed, capacity or waitlist (only signup slots have `capacity`, `src/types/features.ts:22-27`), no recurrence and no IFC overlay.

### 2.13 Platform / trust
- **RLS:** see findings 1–3. The normalized tables have membership-only policies (`supabase/migrations/20260326000000_auth_membership_rls.sql:140-230`) and are unused.
- **Audit log:** none, anywhere.
- **Export:** forms have a Download button (`src/pages/ChapterTables.tsx:245`). There is no nationals or IFC export.
- **Tests:** there is no test runner in the repo (`package.json`). The logic most in need of tests (`attendanceSync`, `duesSync`, `studyHours`, `dashboardTileCompute`) is already pure.

### 2.14 Officer Home tiles: real vs. stub

| Real data | Seed-stub data (`stubs.*`) |
|---|---|
| dues, attendance, next_event, rush_pipeline (bid day comes from the stub), budget, study_hours, open_excuses, action_items, good_standing, standards_cases (broken link), repeat_absences, participation | minutes_pending, roster_changes, nm_class (count real, % stub), nm_behind, risk_forms, sober_monitors, compliance_deadline, service_hours, funds_raised, maintenance, chores, house_bills, alumni |

Tile defaults by function are in `src/lib/dashboard/functionTileDefaults.ts:4-22`. There is no tile for **points**.

---

## 3. Slice 1 — Check-in → attendance % → points ledger

### 3.1 Data model (new `src/types/attendance.ts`, `src/types/points.ts`)
```ts
// Officer-owned
interface CheckInSession {
  eventId: string
  openedBy: string            // memberId
  openedAt: string; closedAt?: string
  secret: string              // random 16+ chars; never shown
  rotateSeconds: number       // default 30
  acceptPrevious: boolean     // default true (clock skew / slow typing)
  geofence?: { lat: number; lng: number; radiusM: number; enforced: boolean } // stored; enforced=false locally
}
// Member-originated
interface CheckIn {
  id: string; eventId: string; memberId: string
  at: string; method: 'code' | 'roll_call' | 'excuse'
  recordedBy?: string         // officer for roll_call overrides
  geo?: { lat: number; lng: number; accuracyM: number }
}
type PointsSource = 'attendance' | 'manual' | 'standards' | 'study_hours'
interface PointsLedgerEntry {          // stored = manual/standards only
  id: string; memberId: string; delta: number; reason: string
  source: PointsSource; sourceRef?: string    // eventId / fineId / caseId
  createdAt: string; createdBy?: string
}
interface PointsRules {
  version: 1
  byEventType: Record<string, { present?: number; excused?: number; absentUnexcused?: number }>
  // present undefined → use event.points (existing per-event field, src/types/index.ts:83)
  defaults: { excused: number; absentUnexcused: number }   // e.g. 0, -5 (required events only)
  countOptionalEventsInAttendance: false
}
```
**Rotating code:** `code(secret, window) = base32(fnv1a(secret + ':' + window)).slice(0,6)` where `window = floor(epochSec / rotateSeconds)`. The pure function lives in `src/lib/attendance/rotatingCode.ts`. A QR is skipped because there are no dependencies. The code is rendered large in mono.

**Canonical attendance (pure `src/lib/attendance/attendanceMath.ts`):**
- The tracked events for a member are past or today events with `required === true` and roll-call or check-in data, where the member was active at the time.
- Per event, the status is decided in priority order:
  1. Officer roll-call row (`AttendanceEntry`).
  2. Otherwise a `CheckIn`, which counts as Present.
  3. Otherwise an **approved** `RsvpExcuse`, which counts as Excused.
  4. Otherwise Absent.
- An approved excuse **beats a roll-call Absent**. This fixes the overwrite gap described in §2.1.
- `pct = present / (tracked − excused)`. Excused events drop out of the denominator. When the denominator is 0 the result is `null`, and callers fall back to the stored `Member.attendancePct`.
- One function feeds the roster bridge, the Home tile (`meetingAttendancePct` → `eventAttendanceRate(eventId)` using the same rules), `repeat_absences` and `participation`, so every page agrees. Document clearly that this **changes semantics** from "excused counts as attended" (`src/lib/attendanceSync.ts:15`) to "excused is neutral".

**Points (pure `src/lib/points/pointsMath.ts`):**
- Derived entries are recomputed from attendance and `PointsRules`. They are never stored, which keeps them idempotent and lets roll-call edits re-flow.
- Stored entries hold manual and standards adjustments.
- `memberPoints = Σ derived + Σ stored`, and `explainPoints(memberId)` returns the merged, sorted "why" list.
- `Member.points` is used only when the chapter has no ledger data at all.

### 3.2 Storage keys and sync path
Add every key to `STORAGE_KEYS` (`src/lib/demoSeed.ts:50`).

| Key | Writer | Local/guest | Cloud |
|---|---|---|---|
| `chapter-os-checkin-sessions` | officers | blob | kv blob is acceptable because only officers write it. **But the `secret` is readable by every member through kv**, so in cloud mode it must move server-side. See below. |
| `chapter-os-checkins` | members | blob | **Not a kv blob.** Concurrent members would clobber each other (finding 3). |
| `chapter-os-points-ledger` | officers | blob | kv blob (officer-only writes, low contention) |
| `chapter-os-points-rules` | officers | blob | kv blob |
| `chapter-os-attendance-config` | officers | blob | kv blob (`{ requireRequiredOnly, rotateSeconds, geofenceDefault }`) |

**Cloud plan (new migration, never edit old ones):** `supabase/migrations/2026110xxxxxxx_checkins.sql`
- `event_checkin_sessions(chapter_id, event_key text, secret text, rotate_seconds int, opened_by uuid, opened_at, closed_at)`. RLS: select and write for officers only, via a new `is_chapter_officer(chapter_id)` that checks `chapter_memberships.role in (...)`. **This depends on fixing finding 2 first.** Role must not be self-updatable: drop `memberships_update_self` for the role column, or move role writes to a security-definer RPC.
- `event_checkins(chapter_id, event_key text, app_member_id text, at, method, recorded_by)` with a unique key on `(chapter_id, event_key, app_member_id)`. RLS: members select their own rows, officers select all. There is **no direct insert**.
- `rpc check_in(p_chapter_id, p_event_key, p_code)` is a security definer. It derives the member from `auth.uid()`, validates the code against the current and previous window server-side, and enforces the geofence when enabled.
- Client: a thin `src/lib/attendance/checkinCloud.ts` adapter. The provider uses the local blob in guest or unconfigured mode and the RPC with periodic refetch (every 15 s while a session is open) in cloud mode.
- If the cloud part slips, ship local-only and state plainly in the UI: "Check-in codes are validated on this device. Cloud enforcement pending."

### 3.3 Feature flags
In `src/types/chapterFeatures.ts`:
- `attendanceCheckIn`: "Event check-in", default `true`.
- `pointsLedger`: "Points", default `true`.

Both stay ON in the guest demo through the default merge. Add `editAttendance` and `editPoints` editor capabilities. The roll-call gate is currently `canAccessExecTools || canEditEventPoints` (`src/pages/EventPage.tsx:50`); extend it with `canMemberEdit('editAttendance', memberId)`.

### 3.4 Files to touch
- **New:**
  - `src/types/attendance.ts` and `src/types/points.ts`
  - `src/lib/attendance/{rotatingCode,attendanceMath,checkinCloud}.ts`
  - `src/lib/points/{pointsMath,pointsRulesStorage}.ts`
  - `src/context/AttendancePointsContext.tsx`
  - `src/components/attendance/{CheckInSessionPanel,CheckInCodeEntry,RollCallList}.tsx`
  - `src/components/points/{PointsWhyList,PointsAdjustModal,PointsRulesEditor}.tsx`
  - `src/pages/Points.tsx` (`/points`, officer totals and member "why")
  - `src/data/demoCheckInSeed.ts`
- **Edit:**
  - `src/lib/demoSeed.ts` (keys and seed)
  - `src/lib/demoRelativeDates.ts` (bump `DEMO_SEED_VERSION` to `'4'`)
  - `src/data/demoAttendanceSeed.ts` (honor excuses, use `event.points`)
  - `src/lib/attendanceSync.ts` (delegate to `attendanceMath`)
  - `src/components/routing/AttendanceSyncBridge.tsx` (pass events, excuses and check-ins, and sync `points`)
  - `src/context/MembersContext.tsx`: a minimal signature change to `syncRosterAttendance`, or a new `syncRosterStanding(map)`. This file is shared, so keep the edit small and call it out.
  - `src/pages/EventPage.tsx`: add a "Check-in" section next to rsvp, attendance and points at `:66,289`
  - `src/pages/MemberProfile.tsx:52-55`: use `memberPoints` so it agrees with everything else
  - `src/lib/dashboard/{dashboardTileCompute,tileIds,tileRegistryMeta,functionTileDefaults}.ts`: add a `points` tile and route attendance math through the lib
  - `src/pages/ChapterSetup.tsx` (Points rules section)
  - `src/App.tsx` (provider and `/points` route)
  - `src/components/layout/Sidebar.tsx` (one entry, append only)
  - `src/pages/MemberDashboard.tsx:397-399`: link the Attendance and Points stats to the "why" list and add a "Check in" card when a session is open

### 3.5 Views
- **Officer, on EventPage → Check-in:**
  - "Open check-in" starts a session.
  - A full-width panel shows the 6-character code in large mono type, with a countdown ring that rotates every 30 s, a "Fullscreen for projector" toggle, a live count ("14 / 24 checked in"), and a "Close session" button.
  - The Roll call tab gains badges for checked-in, excused and absent members, plus a "Mark remaining absent" bulk action.
  - Officers see a geofence toggle labeled "not enforced in local mode".
- **Member, in Chapter Room and on EventPage:** when a session is open for an event happening today, a "Check in" card appears. It has one input for the 6 characters and gives a success or error state. Under "Your semester", Attendance shows the % plus a "3 of 4 required · 1 excused" breakdown, and Points opens the why list.
- **Points page (`/points`):**
  - Officers see a sortable totals table, an "Adjust points" modal (member, ± delta, reason, required) and the full ledger.
  - Members see only their own why list.
- **Chapter Setup → Points rules:** a per-event-type grid with Present, Excused and Unexcused absence columns. Present defaults to the event's own points.
- **Home:** the attendance tile uses canonical math. A new `points` tile shows "avg pts · N below threshold".

### 3.6 Risks
- Every page displaying `attendancePct` changes value (the semantic change). Put it in the release notes.
- Roster rewrite churn (finding 4). Before syncing, compare against the existing value. That is already done for attendance and must be extended to points.
- Client-side code validation is spoofable in local mode. That is acceptable only with the honest copy above.
- `relativizeDemo` rewrites strings that start with a date and any literal `2025`. Seed check-in `at` fields must be ISO timestamps, which shift correctly. Ids must not contain `2025`.
- Agent 2 owns the MemberDashboard and Sidebar visual language. Keep those edits append-only.

### 3.7 Verify (manual)
1. `/preview` → Exec (President) → `/home`. The Attendance tile value equals the e1 rate shown on `/events/e1` → Attendance. The Points tile is present.
2. Chapter Setup → toggle **Event check-in** off. The EventPage Check-in tab and Chapter Room card disappear, and `/points` shows "Not available" only when **Points** is off.
3. Open the upcoming event (e9) → Check-in → Open. The code changes every 30 s.
4. Switch the preview to Member (m-something) → Chapter Room → "Check in" card. Enter the current code: success. Enter the code from two windows ago: rejected.
5. Back in Exec, the live count went up by one and roll call shows that member as checked in.
6. Approve an excuse for a past required event. The member's % no longer drops from that event, and the why list shows "Excused · 0".
7. Officer → Adjust points −3 "Late to chapter". The member sees it in their why list. The totals on `/members`, `/members/:id`, `/profile` and `/my-dashboard` are identical.
8. Reload, then exit preview and re-enter. Data persists, and the re-seed is version 4.

---

## 4. Slice 2 — Shared voting primitive + meeting motions + bid-vote API

### 4.1 Data model (`src/lib/voting/types.ts`)
```ts
type VoteSubjectType = 'motion' | 'election' | 'pnm'
type VoteStatus = 'draft' | 'open' | 'closed'
interface VoteOption { id: string; label: string }      // pnm default: yes/no/abstain
interface Eligibility {
  statuses: MemberStatus[]          // default ['Active']  (New Member excluded)
  excludeMemberIds: string[]        // recusals / conflicts of interest
}
type Quorum = { kind: 'count'; min: number } | { kind: 'percent'; pct: number } // of eligible
interface Vote {
  id: string; subjectType: VoteSubjectType; subjectId: string
  title: string; options: VoteOption[]
  eligibility: Eligibility; quorum: Quorum
  threshold: { kind: 'majority' | 'two_thirds' | 'unanimous' | 'custom'; pct?: number } // of non-abstain
  anonymous: boolean; revealOnClose: boolean
  status: VoteStatus; openedAt?: string; closedAt?: string; createdBy: string
}
// Stored separately so identity can be withheld:
interface Ballot { voteId: string; optionId: string; castAt: string; voterId?: string } // voterId only when !anonymous
interface VoterRoll { voteId: string; memberIds: string[] }   // "has voted" set
interface VoteResult { tallies: Record<string, number>; cast: number; eligible: number;
  quorumMet: boolean; outcome: 'passed' | 'failed' | 'no_quorum' | 'tie' | null }
```
**Pure functions** in `src/lib/voting/voteMath.ts`: `eligibleVoters(vote, members)`, `canCast(vote, memberId, roll)`, `tally(vote, ballots, eligibleCount)`, `quorumMet`, `outcome`. Abstain counts toward quorum but not toward the threshold. Write down the rule for ties: a tie fails.

**Anonymity:**
- Locally, ballots go in a shuffled array with no `voterId`, and `castAt` is truncated to the minute. The roll is a separate set.
- This is **not** real anonymity, because a determined officer could still correlate write order on one device. The UI must say "Anonymous on this device; server-sealed in cloud mode".
- Cloud mode needs a new migration:
  - `votes(id, chapter_id, …)`.
  - `vote_ballots(vote_id, option_id, cast_bucket)`, with no voter column. RLS: select only after `votes.status='closed'` or for non-anonymous votes.
  - `vote_roll(vote_id, voter_uid)`, unique, readable only by the voter and officers for counting.
  - `rpc cast_ballot(vote_id, option_id)` is a security definer. It checks eligibility and that the vote is open, inserts the roll row and the ballot row in one transaction, and the unique constraint enforces one vote per member.
- The kv path **cannot** satisfy anonymity or one-vote-per-member, because of findings 1 and 3.

### 4.2 Storage keys and sync path
Add `chapter-os-votes`, `chapter-os-vote-ballots`, `chapter-os-vote-rolls` and `chapter-os-meeting-motions` to `STORAGE_KEYS`. Also move `chapter-os-chapter-meeting` into `STORAGE_KEYS` (finding 10).
- Local and guest use blobs.
- Cloud uses the migration plus RPC above, through a `src/lib/voting/votingCloud.ts` adapter that refetches every 10 s while a vote is open.
- Until the RPC exists, cloud chapters should treat binding votes as "preview only". Show a banner and keep the vote feature from presenting results as authoritative.

### 4.3 API (for the coordinator and Agent 1)
```ts
// src/lib/voting/VotingContext.tsx
useVoting(): {
  votes: Vote[]
  getVotesFor(subjectType, subjectId): Vote[]
  createVote(input: Omit<Vote,'id'|'status'|'createdBy'|'openedAt'|'closedAt'>): string
  openVote(id), closeVote(id), deleteDraft(id)
  castBallot(voteId, optionId): { ok: true } | { ok: false; reason: 'closed'|'ineligible'|'already_voted'|'recused' }
  hasVoted(voteId, memberId?): boolean
  result(voteId): VoteResult | null      // null while open && revealOnClose
}
// src/components/voting/BidVotePanel.tsx
interface BidVotePanelProps {
  prospectId: string
  prospectName?: string
  conflictMemberIds?: string[]  // falls back to (prospect as any).conflictMemberIds if Agent 1 adds it
  legacy?: boolean              // shows "Legacy" badge only
  quorum?: Quorum               // default { kind:'percent', pct: 50 }
  threshold?: Vote['threshold'] // default majority
}
```
`BidVotePanel` is self-contained. It uses `subjectType: 'pnm'`, is anonymous by default, offers Yes, No and Abstain, and gives officers open and close controls. Members see "Cast ballot", or "You voted" once they have, or "Recused" if conflicted. Results are revealed on close. It reads the prospect defensively from `useRecruitment()` and does **not** edit PNMProfile; the coordinator mounts it. It is gated by flag `voting`, default `true`, plus `recruitment`.

### 4.4 Meeting motions
`MeetingMotion {id, meetingDate, title, movedBy, secondedBy?, voteId?, outcome: 'pending'|'passed'|'failed'|'tabled', notes?}`.
- `ChapterMeeting.tsx` gets a fifth tab, "Motions". Officers can add a motion, then choose "Call vote", which opens a `Vote` with `subjectType: 'motion'`.
- Closing the vote sets the outcome from `VoteResult`. "Table" sets the outcome directly.
- Members see open motions with a ballot UI, and closed motions with their results.
- Rename the feature id `execSlides` to a label-only change. **Keep the id** because stored flags depend on it.

### 4.5 Files
- **New:** `src/lib/voting/{types,voteMath,votingStorage,votingCloud}.ts`, `src/lib/voting/VotingContext.tsx`, `src/components/voting/{BidVotePanel,BallotCard,VoteResultBar,CreateVoteForm}.tsx` and `src/data/demoVotesSeed.ts`.
- **Edit:** `src/pages/ChapterMeeting.tsx`, `src/types/chapterFeatures.ts`, `src/lib/demoSeed.ts`, `src/App.tsx` (provider), `src/pages/ChapterSetup.tsx` (default quorum and threshold), and the migration file.

### 4.6 Risks
- Anonymity overclaim in local mode (see the copy above).
- Eligibility snapshot: freeze the eligible member list when the vote opens. Otherwise roster changes mid-vote alter quorum.
- Clock and refetch lag across devices.
- Agent 1 field names (`conflictMemberIds`, `legacy`) are unconfirmed. Read them defensively.

### 4.7 Verify
1. Exec → Chapter meeting → Motions → add "Approve formal budget" → Call vote with quorum at 50% → Open.
2. Switch to Member → Chapter meeting → vote Yes. The ballot button changes to "You voted", and a second attempt is rejected.
3. Switch to a New Member preview: "Not eligible".
4. Exec closes the vote. The tallies appear and the outcome becomes Passed or Failed. If not enough members voted, the outcome reads **No quorum**.
5. Mount `<BidVotePanel prospectId="p1" conflictMemberIds={['m3']}/>` in a scratch route. m3 sees "Recused". Results stay hidden until close.
6. Reload. Votes, roll and outcome persist. The anonymous vote's ballots in localStorage contain no member ids.

---

## 5. Slice 3 — Finance enforcement

### 5.1 Standards fines → dues (idempotent)
- **Model:** extend `DuesCharge` with optional `source?: { kind: 'fine'; fineId: string }` and `kind?: 'dues' | 'fine' | 'late_fee'`. Use one charge per fine, with `assignedMemberIds: [fine.memberId]`.
- **Pure** `src/lib/finance/fineCharges.ts`: `reconcileFineCharges(fines, charges, policy) → { add: DuesCharge[]; void: chargeId[] }`.
  - A charge is posted when the fine is `Unpaid` and, if `auto_lock_fines` is set, the appeal window has passed (`src/types/standardsConfig.ts:54-57`).
  - A `Waived` fine voids the charge: set amount to 0, or `status: 'Waived'` on the payment.
  - Charges are keyed by `fineId`, so re-running is a no-op.
  - A `FineDuesBridge`, next to `DuesSyncBridge`, runs this. **Only officer devices** run it (`canManageFines || canAccessTreasurerSettings`), to avoid multi-writer races.
- **Also:** add excuse-denial idempotency (`src/pages/ExcuseApprovals.tsx:41-56`) by keying the fine with `sourceRef: excuseId`. Fix `Dues.tsx:269` so it records against the selected charge.
- **Flag:** `financeEnforcement`, default `false` for new chapters (it changes money) and `true` in the demo seed (write it into `chapter-os-chapter-features` in `seedGuestDemo`).

### 5.2 Reimbursements with dual approval
```ts
interface Reimbursement {
  id: string; requesterId: string; amount: number; description: string
  budgetId?: string; lineItemId?: string
  receipts: { id: string; fileName: string; dataUrl?: string; sizeBytes: number }[] // local: dataUrl ≤ 500KB
  status: 'submitted' | 'approved' | 'rejected' | 'paid'
  approvals: { role: 'President' | 'Treasurer'; memberId: string; at: string; decision: 'approve' | 'reject'; note?: string }[]
  audit: { at: string; actorId: string; action: string; detail?: string }[]
  createdAt: string
}
```
- **Rule (pure, `src/lib/finance/reimbursementRules.ts`):** `requiredApprovals(amount) = amount > 250 ? ['President','Treasurer'] : ['Treasurer']`.
  - One person cannot fill both roles, and the requester cannot approve their own request.
  - Any reject moves the request to `rejected`. On `paid`, optionally post an expense to the linked budget.
- **Keys:** `chapter-os-reimbursements`. Receipts are inline data URLs locally. They must be size-capped, because quota failures surface via `PersistErrorNotice`.
- **Cloud:** move receipts to Supabase Storage under a per-chapter path with storage RLS by membership, plus `rpc approve_reimbursement` that checks role. **New migration only.** The kv path is acceptable for metadata until then, with the same multi-writer caveat.
- **Audit trail:** append-only `audit[]` on each record. A chapter-wide `chapter-os-audit-log` (dues, fines, roles, reimbursements) is a cheap follow-up.
- **Views:**
  - Members: `/dues` → "Request reimbursement", which lets them upload a receipt and see their request statuses.
  - Treasurer and President: a queue showing which approvals are still missing, approve and reject buttons, "Mark paid", and an audit drawer.
  - Officer Home gets a ledger task: "N reimbursements awaiting your approval".
- **Files:** `src/types/finance.ts`, `src/lib/finance/*`, `src/context/FinanceContext.tsx`, `src/pages/Reimbursements.tsx` (or a tab in `Dues.tsx`), `src/components/routing/FineDuesBridge.tsx`, `src/lib/dashboard/actionLedgerTasks.ts`, `src/types/chapterFeatures.ts`, `src/lib/demoSeed.ts`.
- **Risks:** money changes need the RLS fix (finding 1) before cloud use, receipts must stay under the storage quota, and two officer devices can still race on the fine-charge bridge (mitigated by deterministic charge ids `fine-<fineId>`).
- **Verify:**
  1. Exec (Treasurer) → Standards → issue a $25 fine to m4. `/dues` shows a "Fine" charge for m4 only.
  2. Reload. There is still exactly one charge.
  3. Waive the fine and the charge zeroes out.
  4. A member submits a $300 reimbursement with a receipt. The Treasurer approves it, and it stays submitted with "Awaiting President".
  5. The President approves it and it becomes approved.
  6. A requester who is also Treasurer cannot approve their own request.
  7. The audit trail shows every step with actor and time.

---

## 6. Required order of work (recommendation)
1. **RLS hardening migration (blocking for any cloud integrity):**
   - Prevent self-assigned role and arbitrary chapter join. Membership inserts should go only through `resolve_join_code`/`claim_or_create_chapter`.
   - Add `is_chapter_officer()`.
   - Split `chapter_kv` write policies so officer-only keys (roster, dues, governance, positions, features, points ledger, check-in sessions) need the officer role. Member-writable keys (rsvps, excuses, study logs) would ideally move to per-row tables later.
2. Register `chapter-os-chapter-meeting` in `STORAGE_KEYS`. Fix the `/j-board` link and `Dues.tsx:269`. These are one-line fixes for whoever owns those files.
3. Slice 1 local, then the Slice 1 cloud RPC.
4. Slice 2 local, then the voting RPC. Hand the `BidVotePanel` props (§4.3) to the coordinator for PNMProfile.
5. Slice 3.

## 7. Files outside Agent 3 ownership that the plan touches
- `src/context/MembersContext.tsx` (sync signature)
- `src/pages/MemberDashboard.tsx`, `src/pages/MyProfile.tsx`, `src/pages/MemberProfile.tsx`, `src/pages/MemberManagement.tsx` (only if computing at read time instead of via the roster bridge; the bridge approach avoids most of these)
- `src/pages/Dues.tsx` and `src/pages/ExcuseApprovals.tsx` (Slice 3 bug fixes)
- `src/context/ChapterResourcesContext.tsx` (key registration)
- Sidebar and MemberBottomNav (append-only nav entries)
- `PNMProfile.tsx` is **not** touched. The coordinator mounts `BidVotePanel`.
