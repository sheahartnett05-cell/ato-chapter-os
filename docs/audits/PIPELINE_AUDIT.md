# Recruitment / Pipeline Audit (Agent 1)

Branch `agent/pipeline` @ `df6d591` (agora-merged). Audit only. **No source changes were made.**
All line refs are against that commit. Severity scale: **S1** blocks a real rush semester or loses data ·
**S2** wrong or misleading behaviour a chair will hit · **S3** polish / missing nicety.

## 0. Headline

The pipeline is a single flat `Prospect[]` in localStorage with an `archived` flag. Add, drag, and
clear work for a demo, but a real semester runs into three things first:

1. **Accepted → roster promotion is broken past the first drop (S1).** Moving a PNM from Accepted to
   New Member fails with "Already on roster" and snaps back. A PNM with no email gets a duplicate
   roster member on every drop.
2. **There are no rush cycles (S1).** "Fall 2026" is subtitle copy only. Clear cycle *deletes* the
   prospects, so last semester's history can't be kept.
3. **Mobile can't move PNMs between stages (S2).** The board shows one column at a time, and there's
   no stage control on either the card or the profile.

Also: the follow-up header is hardcoded ("By Aug 26"), clear cycle has no permission gate, and the
whole prospects blob, notes included, can be read by every chapter member through `chapter_kv` RLS.

## 1. End-to-end trace (guest preview)

| Step | What happens | Evidence | Verdict |
|---|---|---|---|
| Enter demo | `enterGuestPreview` → `seedGuestDemo()` writes `relativizeDemo(DEMO_PROSPECTS)` + activities | `src/lib/enterGuestPreview.ts:41`, `src/lib/demoSeed.ts:166-167` | OK |
| Reload | `main.tsx:14` `ensureGuestDemoFresh()` re-seeds **only** when the stored version ≠ `DEMO_SEED_VERSION` ('3') | `src/lib/demoSeed.ts:194-204`, `src/lib/demoRelativeDates.ts:13` | OK. No re-seed trap on a normal reload |
| Provider init | Reads the stored array; `[]` is truthy, so an empty board persists; demo fallback only if the key is missing | `src/context/RecruitmentContext.tsx:115-125` | OK |
| Dashboard counts | 8 stage tiles + "Active prospects" + "Bids / accepted", filtered `!archived` | `src/pages/RecruitmentDashboard.tsx:22-34,76-105` | OK, but "Bids / accepted" sums two stages into one number; there's no response tracking |
| Pipeline drag | dnd-kit; `handleDragEnd` resolves the stage from the column or the card it lands on | `src/pages/RecruitmentPipeline.tsx:157-198` | Works on desktop; see bugs B1, B3 |
| Clear cycle | Deletes every non-archived prospect and its activities; persists `[]` | `src/context/RecruitmentContext.tsx:239-245` | Works. Destructive, with no archive (gap 6) |
| Empty persists | `[]` stored; version unchanged → no re-seed | as above | OK. **Caveat:** any future `DEMO_SEED_VERSION` bump will re-seed every guest and bring back a cleared demo. That's intended for guests, and worth knowing |
| Add PNM | Template form → `addProspectFromForm` → prepended, with a "Referral" activity | `src/components/recruitment/AddProspectModal.tsx:159-170`, `RecruitmentContext.tsx:144-167` | OK. No duplicate check (gap 8) |
| → Accepted | Drop on Accepted/New Member → `promoteProspectToMember` → status update | `RecruitmentPipeline.tsx:177-196`, `src/context/MembersContext.tsx:750-800` | First drop OK; see B1/B2 |
| Roster | New Member record, role `NewMember`, `pledgeClass: 'Spring 2026'` hardcoded | `MembersContext.tsx:780` | B4 |

## 2. Bugs found

| ID | Sev | Bug | Evidence |
|---|---|---|---|
| **B1** | S1 | **Accepted → New Member is impossible for any PNM that has an email.** Both stages call `promoteProspectToMember`. The second call hits the existing-email check, returns "Already on roster.", and the handler reverts the status. The same thing happens when re-accepting after moving a PNM back to Bid. | `RecruitmentPipeline.tsx:177-194`; `MembersContext.tsx:769-771` |
| **B2** | S1 | **Duplicate roster members for PNMs without an email.** The synthetic email embeds a random `memberId` suffix, so the duplicate check never matches and every drop on Accepted/New Member adds another roster row. | `MembersContext.tsx:765-771` |
| B3 | S2 | **Duplicate dnd-kit IDs.** The mobile column (`md:hidden`) and the desktop columns are both mounted in the same `DndContext`, so `useDroppable({id: stage})` and `useSortable({id: prospect.id})` register twice. A `display:none` copy (zero rect) can win registration. That makes drops on mobile unreliable, and in places on desktop. Fix: render one layout based on a media query. | `RecruitmentPipeline.tsx:249-275`, `:101`, `:35` |
| B4 | S2 | Promoted members get `pledgeClass: 'Spring 2026'` hardcoded, which is wrong every other term. `addMemberToRoster` correctly uses `currentTermLabel()` (`:732`). | `MembersContext.tsx:780` |
| B5 | S2 | "Follow-ups due" header is hardcoded to `By Aug 26`. The list itself correctly uses `<= today`, but there's no overdue/today/upcoming split and no date on each row. | `RecruitmentDashboard.tsx:110-115`, `:36-41` |
| B6 | S2 | Clear cycle, Add PNM, Archive, and Delete have **no permission check**. `/recruitment*` sits behind `ExecShell`, which admits *any* exec-capable role (Treasurer, Scholarship…). Only the sidebar link is gated by `canManageRecruitment`. | `src/components/routing/AppShells.tsx:136-137`; `Sidebar.tsx:186`; `ClearCycleButton.tsx:14-21`; `App.tsx:209-237` |
| B7 | S3 | Officer Home `rush_pipeline` tile, Action Ledger, and live alerts count **archived** prospects (no `!archived` filter). "Bid day in Nd" comes from a stub, not chapter data. | `src/lib/dashboard/dashboardTileCompute.ts:181-189`; `actionLedgerTasks.ts:76-81`; `liveAlerts.ts:71-76` |
| B8 | S3 | Demo inconsistency: seed prospects Cole Bennett (Accepted) and Dylan Archer (New Member) aren't on the demo roster, so the dashboard says "accepted" and the roster disagrees. | `src/data/demoFixtures.ts` p7/p8; absent from `demoRosterExpansion.ts` |
| B9 | S3 | Profile: clearing the assignee writes `undefined` into a `string` field. The fallback activity date is a hardcoded `'2025-08-01'` (not relativized). | `src/pages/PNMProfile.tsx:242`, `:70` |
| B10 | S3 | Profile has no editor for stage, rating, follow-up date, or contact fields. Rating and follow-up can only be set by the intake form or seed data. | `PNMProfile.tsx` (whole file; read-only `dl` at `:234-267`) |
| B11 | S3 | Individually archived PNMs have no list view. Once archived, the only way back is the direct `/recruitment/pnm/:id` URL. | `RecruitmentPipeline.tsx:144`; `RecruitmentDashboard.tsx:22` |

## 3. §4N gap matrix

| # | Gap | Exists today | Missing | Sev |
|---|---|---|---|---|
| 1 | Bid voting / quorum / anon / COI / legacy | Nothing. `Prospect` has no vote, legacy, or COI fields (`src/types/index.ts:107-131`) | All of it. **Agent 3 owns the voting primitive.** Pipeline side needs data fields only: `legacy?: boolean`, `legacyRelation?`, `conflictMemberIds?: string[]` | S2 (owned by Agent 3) |
| 2 | Configurable rubric | Single `rating: number` 0–5, shown as stars (`PNMProfile.tsx:168-178`); no way to edit it in the UI (B10) | Rubric definition per chapter, per-rater scores, aggregation. Ties into voting → Agent 3 | S2 (Agent 3) |
| 3 | PNM check-in / bid card / bid acceptance tracker | `Bid` and `Accepted` stages only. Demo note text "Awaiting response by Friday" is free text (`demoFixtures.ts` p6) | `bid: { extendedAt, deadline, response: 'pending'\|'accepted'\|'declined', respondedAt }`; dashboard summary (out / accepted / declined / overdue); PNM event check-in (needs Agent 3 attendance) | **S1** for the tracker |
| 4 | IFC registration export | No CSV export anywhere in recruitment | Client-side CSV of the active cycle (name, email, phone, major, grad year, hometown, stage, bid status) | S2 |
| 5 | Kanban usability | `overflow-x-auto` row, columns `md:w-72 shrink-0` (`RecruitmentPipeline.tsx:271,106`). Headers aren't `truncate`d in the current code, but at 1280px only about 3 of the 8 columns show, with no hint that more exist | Edge fades, ◀ ▶ scroll buttons, collapsible columns (with counts), compact card mode, sticky headers. Remove the `templates` info grid that pushes the board down (`:233-241`) | S2 |
| 6 | Cycle lifecycle | Clear only (destructive). Season is copy only: `currentTermLabel()` in the subtitle (`RecruitmentDashboard.tsx:52`) | First-class `RushCycle {id,label,startedAt,archivedAt?,bidDay?}`, `Prospect.cycleId`, archive → new cycle, read-only view of past cycles, migration for stored prospects | **S1** |
| 7 | Follow-ups use live dates | List filter is live (`<= localTodayIso()`) | Hardcoded header (B5); overdue/today/upcoming buckets; due date per row; set or snooze from the profile (B10) | S2 |
| 8 | Duplicates / merge / DNC / confidential notes | None. `addProspectFromForm` doesn't check for duplicates (`RecruitmentContext.tsx:144-167`) | Match on normalized name, phone digits, or email at add time → merge or keep; `doNotContact` flag (hide from follow-ups, badge on card); `confidentialNotes` editor-only (see risk R3) | S2 |
| 9 | Pipeline ↔ rush events ↔ attendance | Demo event `e2` "Fall Recruitment Cookout" type `Recruitment` exists, but there's no link to PNMs. Activities of type `Event` are free text | PNM check-in at events (depends on Agent 3 attendance module); `Prospect.eventsAttended?: string[]` | S3 (blocked on Agent 3) |
| 10 | Mobile stage picker | `<select>` with counts, one column at a time (`RecruitmentPipeline.tsx:249-268`) | No way to move a PNM on mobile (drag within one column is meaningless, and B3 makes it flaky). Needs a "Move to…" action on the card and the profile; segmented chips instead of a select | S2 |
| 11 | Permissions | Sidebar gated by `canManageRecruitment` (incl. president-assigned `editRecruitment` editors, `AuthContext.tsx:248-252`) | Route and action gating (B6). **RLS:** `chapter_kv` policies are `is_chapter_member` for all CRUD (`supabase/migrations/20260326000000_auth_membership_rls.sql:115-129`), so any member's client can read or overwrite `chapter-os-prospects` | S2 (UI) / **S1 for confidential data** |
| 12 | Accepted → NME handoff | Promotion creates a `NewMember` roster row. `p-nme` position + `nmRequirements` dashboard stub exist (`demoSeed.ts:131-136`) | Link `Prospect.rosterMemberId` ↔ `Member`; hand-off checklist and notification to the NME; pledge class = cycle label. The NME program itself is Agent 3 (§7) | S2 |

## 4. Implementation plan (prioritized)

Ownership: Agent 1 owns `src/pages/Recruitment*.tsx`, `PNMProfile.tsx`, `src/components/recruitment/**`,
`RecruitmentContext.tsx`, `pipelineStages.ts`, `rushFormTemplates.ts`, `src/lib/recruitment/**`.
Edits outside that set are listed per step and should stay minimal.

### P1. Fix promotion correctness (B1, B2, B4): small and urgent
- **Model:** `Prospect.rosterMemberId?: string`.
- **Logic** (new `src/lib/recruitment/promotion.ts`, called from the pipeline and a new profile button):
  1. If `rosterMemberId` is set and that member still exists → no-op, success.
  2. Else, if a roster member matches the email (case-insensitive) → link it, success.
  3. Else → `promoteProspectToMember`, store the returned id.
  Do the status change and the `rosterMemberId` write in **one** `updateProspect` call. Two calls in
  the same tick overwrite each other through the stale closure in `persistProspects`.
- **Outside ownership:** `MembersContext.tsx`: add an optional `pledgeClass` param to
  `promoteProspectToMember` (default `currentTermLabel()`). Don't call `updateMemberDetails` right after
  promotion in the same tick: it closes over the old `roster` and would drop the new member.
- Profile: an "Add to roster" button for Accepted/New Member PNMs with no link. This also fixes B8 on demand.

### P2. First-class rush cycles (gap 6, B7)
- **Types** (`src/lib/recruitment/types.ts`): `RushCycle { id; label; startedAt; archivedAt?; bidDay? }`.
  `Prospect.cycleId?: string`, which needs a one-line optional addition in `src/types/index.ts`
  (outside ownership; the alternative is an intersection type, which spreads through every consumer).
- **Storage:** add `rushCycles: 'chapter-os-rush-cycles'` to `STORAGE_KEYS` in `src/lib/demoSeed.ts`
  (outside ownership, and required). That one line automatically puts the key in
  `clearDemoData`, `backupRealSession`/`restoreRealSession`, and `CLOUD_SYNC_KEYS`
  (`src/lib/chapterCloud.ts:19-20`). **If it's skipped, entering the demo silently loses a real chapter's cycles.**
- **Migration** (in the provider initializer, idempotent):
  if there are no stored cycles, create `{id: 'cycle-'+slug(currentTermLabel()), label: currentTermLabel()}`.
  Then give every prospect without a `cycleId` the active cycle's id. Write back only if something
  changed. No prospect is ever dropped.
- **Context API:** `allProspects`, `prospects` (= active cycle ∧ `!archived`), `cycles`, `activeCycle`,
  `archiveAndStartCycle(label)`, `renameCycle`, `prospectsInCycle(id)`. Defining `prospects` as the scoped
  set means Officer Home tiles, the ledger, and alerts (Agent 3 files, B7) scope correctly with **no edits**.
  `getProspect` searches all.
- **UI:** a cycle switcher on the dashboard and pipeline (`Fall 2026 · active` / archived cycles). Archived
  view is read-only (no drag, no add, banner). "Archive & start new cycle" modal with a label defaulting to the
  next term. Clear cycle stays, scoped to the active cycle, behind `canManageRecruitment`.
- **Seed:** cycle id/label authored as `Fall 2025` in fixtures so `relativizeDemo` rewrites it to the current
  term (`demoRelativeDates.ts:51-58`). Optionally add a past cycle with 2–3 archived PNMs; compute its label
  in code rather than relying on the "2025 → current year" rewrite, which would collide in spring.
  Write in `seedGuestDemo` and bump `DEMO_SEED_VERSION` to `'4'` (coordinate the bump with Agents 2/3, since
  one bump is enough).

### P3. Kanban usability and mobile (gap 5, gap 10, B3)
- `src/components/recruitment/PipelineBoard.tsx`: a single DnD tree rendered by `matchMedia('(min-width:768px)')`
  (fixes B3). Scroller ref with left/right gradient fades and ◀ ▶ buttons (scroll by one column width;
  hide at the ends; `aria-label`). Collapsed columns become a 44px vertical rail with the stage name and count,
  persisted per user in localStorage. A compact toggle switches cards to name + rating on one line. Headers
  `whitespace-nowrap`, with the full name in `title`.
- Mobile: horizontal chip strip of stages (scrollable, with counts) replacing the `<select>`, plus a
  "Move to…" menu on each card that uses the same promotion path as a drop.
- Move the intake-template info grid into the Add PNM modal.

### P4. Live follow-ups (gap 7, B5, B10)
- `src/lib/recruitment/followUps.ts`: `followUpState(date, today) → 'overdue'|'today'|'upcoming'|'none'`.
- Dashboard card: group by state; show relative due text per row ("2d overdue", "Today", "Thu Nov 5");
  the header shows the live count, with no fixed date.
- Profile: editable follow-up date, quick snooze buttons (+1d / +3d / +1w), plus stage and rating editors.

### P5. Bid acceptance tracker (gap 3, gap 12)
- **Model:** `Prospect.bid?: { extendedAt: string; deadline?: string; response: 'pending'|'accepted'|'declined'; respondedAt?: string }`.
- Moving to `Bid` without a `bid` sets `{extendedAt: today, deadline: cycle.bidDay ?? today+3, response: 'pending'}`.
- Setting the response to `accepted` sets status `Accepted` and runs **P1 promotion** (idempotent). `declined` keeps
  the PNM, shows a "Declined" badge, and moves them out of active counts.
- Dashboard "Bids" card: extended / accepted / declined / pending, with overdue pending (deadline < today) highlighted.
- Seed: give demo p6 a pending bid with a deadline 2 days ahead, p7 accepted, and add one declined.

### P6. If time remains (gaps 4, 8)
- Duplicate detection in `AddProspectModal`: normalized email, phone digits (last 10), and lowercase first+last.
  On a match, offer "Open existing", "Merge into existing" (fill empty fields, union interests, append notes and
  activities), or "Keep both".
- `doNotContact?: boolean`: badge on card and profile; excluded from follow-ups, alerts, and export.
- `confidentialNotes?: string`: rendered only when `canManageRecruitment`. **This is UI-only hiding**; see R3.
- IFC CSV export (`src/lib/recruitment/ifcExport.ts`): active cycle, excludes DNC, Blob download, RFC 4180 quoting.

### Voting hand-off (do NOT build here)
Optional fields the pipeline may add to make Agent 3's `subjectType: 'pnm'` bid vote easier:
`legacy?: boolean`, `legacyRelation?: string`, `conflictMemberIds?: string[]` (members who must recuse),
and `cycleId` (ballots should be scoped per cycle). The vote outcome should feed P5 by setting `bid.extendedAt`
or moving the PNM to `Bid`. It must not write roster data directly. `<BidVotePanel prospectId>` is wired
into `PNMProfile.tsx` by the coordinator.

## 5. Risks

- **R1: Stale-closure overwrites.** Every context mutator closes over the current array and persists the whole
  thing. Two mutations of the same store in one event handler lose the first. Batch patches, or move to
  functional `setState` + write-through.
- **R2: Seed version churn.** Bumping `DEMO_SEED_VERSION` re-seeds every guest (and undoes a cleared demo once).
  Expected, but bump it exactly once across agents.
- **R3: Confidential data isn't confidential.** `chapter_kv` RLS lets any chapter member read and write the whole
  prospects blob. Real confidentiality needs a separate key/table with an editor-only policy (an Agent 3 / RLS
  migration). Until then, label the field "hidden from non-recruiters in the app" and never call it secure.
- **R4: Out-of-ownership edits.** `src/types/index.ts` (optional Prospect fields), `src/lib/demoSeed.ts`
  (one storage key, one write, seed version), `MembersContext.tsx` (pledgeClass param), demo fixtures.
  All additive; flag them in the handoff.
- **R5: Cloud hydration order.** `hydrateFromCloud` overwrites localStorage before render. The migration must run
  in the provider initializer (after hydration), not at import time.
- **R6: No runtime verification is possible here** (no vite, stubbed dnd-kit types). Drag behaviour and scroll
  affordances need a human click-through.

## 6. Manual verify steps (for after implementation)

1. **Fresh guest:** `/demo` → Exec → Recruitment chair. `/recruitment` shows `Fall 2026 · active`; stage tiles sum
   to the number of demo PNMs; the follow-ups card shows overdue/today/upcoming groups with no fixed date text.
2. **Bids card:** shows 1 pending (Garrett, due in 2d), 1 accepted, 1 declined.
3. **Kanban, 1280px:** ▶ visible on the right with a fade; clicking it scrolls one column; ◀ appears. Collapse
   "Contacted" → narrow rail with count; reload → still collapsed. Compact toggle shrinks cards.
4. **Drag** Hunter New → Contacted → reload → persists. Drag Garrett Bid → Accepted → roster `/members` shows one
   new New Member with pledge class `Fall 2026`. Drag Accepted → New Member → **no error, no second roster row**.
   Drag back to Bid and then to Accepted again → still one roster row.
5. **No-email PNM:** add a PNM without an email, drag to Accepted, then New Member → exactly one roster row.
6. **Mobile 375px:** stage chips scroll horizontally; "Move to…" on a card changes its stage; no layout overflow.
7. **Cycles:** Archive & start "Spring 2027" → empty board, Fall 2026 listed as archived; open it → read-only
   (no drag handles, no Add PNM); the Officer Home rush tile shows 0 active.
8. **Clear cycle:** on the new cycle, add 1 PNM → Clear cycle → board empty → reload → still empty (no re-seed);
   the archived cycle is untouched.
9. **Permissions:** preview as Treasurer, open `/recruitment` directly → read-only (no Clear/Add/Archive), and
   confidential notes are hidden. As President, all controls are present.
10. **Migration:** in a real (non-guest) session with pre-existing `chapter-os-prospects` and no cycles key →
    load `/recruitment` → all prior PNMs appear in the current-term cycle; `chapter-os-rush-cycles` now exists.
11. **Exit demo** → real session restored; real cycles key unchanged.
