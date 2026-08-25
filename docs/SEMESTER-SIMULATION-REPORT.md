# Agora Chapter OS — Full-Semester Simulation Report

Generated: 2026-08-25T02:28:28.614Z
Chapter: **Mu Omega Simulation** @ Northwood State University
Roster: **50** members · **24** events · **78** excuses

## Semester timeline (abbreviated)

| Week | Persona | Action |
|------|---------|--------|
| 0 | QA | Clear site data and begin Phase 1 |
| 1 | President (founder) | Programmatic founding fallback (UI onboarding failed) |
| 1 | Recruitment Chair | Added 12 PNMs to pipeline |
| 15 | Simulation | 24 events, 78 excuses, 30 fines |
| 1 | Simulation seed | Injected 50-member roster + 15-week semester dataset |
| 4 | Treasurer | Accessed /dues via UI as Treasurer persona |
| 4 | Member-at-Large | Correctly denied Add dues CTA on /dues |
| 6 | Standards Chair | Reviewed /excuses queue via UI |
| 3 | Social Chair | Accessed /calendar (position boost grants event tools) |
| 7 | President | Exec turnover: Social Chair reassigned to Isabella Moore |

## Phase 3 consistency checks

| # | Check | Result |
|---|-------|--------|
| 1 | Member attendancePct matches hand-tally from attendance ledger | **PASS** |
| 2 | Dues balance agrees across roster / profile / treasurer view | **FAIL (42 mismatches)** |
| 3 | Fines from denied excuses appear in member standards history | **FAIL (fines not persisted — GovernanceContext in-memory only)** |
| 4 | Budget income/expense totals match line items | **PASS** |
| 5 | Table guest lists match final event RSVP/attendance state | **FAIL (syncGuestListFromEvent reads mock demoRsvps, not live data)** |
| 6 | Exec turnover: permissions transfer correctly | **PASS (new social chair reaches calendar)** |
| 7 | Calendar renders full semester (~20–30 events) | **PASS** |
| 8 | Roster search/sort at ~50 members | **PASS** |
| 9 | Hard refresh — all numbers unchanged | **PASS** |
| 10 | localStorage size reasonable; console clean | **PASS (~133 KB)** |

## Findings — Blocker (2)

### B1. Standards fines lost on refresh
- **Repro:** Deny excuse on /excuses → fine appears → hard refresh → fine gone
- **Notes:** GovernanceContext cases/fines are in-memory; chapter-os-governance never read back

### B2. Table guest-list sync uses demo mock RSVPs
- **Repro:** Social Chair: create table → Sync guest list from event → wrong/empty guests
- **Notes:** ChapterTablesContext.tsx line ~225: demoRsvps from mockData.ts, not chapter-os-rsvps or form RSVPs

## Findings — Major (1)

### M1. Onboarding UI flow failed — fell back to programmatic founding
- **Repro:** Week 0 / President / full onboarding wizard
- **Notes:** locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /^continue$/i })
    - locator resolved to <button disabled type="button" class="btn-primary ml-auto disabled:cursor-not-allowed disabled:opacity-40">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    57 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms


## Findings — Polish (1)

### P1. Could not complete house task form UI test
- **Repro:** Week 8 / House Manager / house task modal
- **Notes:** 

## Simulation methodology

- **Phase 1:** Playwright-driven founding President onboarding UI + injected 50-member roster with 14 exec seats and realistic name edge cases.
- **Phase 2:** Programmatic semester seed (~15 weeks of events, attendance, excuses, dues, study hours, recruitment, budgets, committees) matching localStorage shapes the app contexts expect. Privileged actions spot-checked via persona switching (rewrite `chapter-os-onboarding` + reload).
- **Phase 3:** Independent audit functions mirroring `attendanceSync.ts` and `duesSync.ts`, run against post-refresh localStorage snapshot.

## Recommended fix-pass priority

1. Persist dues + governance (cases/fines) in their contexts — blocks refresh fidelity.
2. Fix `syncGuestListFromEvent` to read live RSVPs.
3. Recompute attendancePct default for members with zero recorded events (or roll-call all members).
4. Exec turnover: verify position-boost permissions update without re-onboarding.


## Round 2 — Full Pipeline Coverage

Generated: 2026-08-25T02:29:57.046Z

### Onboarding Continue-button diagnosis

Invite path CHAPTER-FOUNDER enables Continue. Create-path: Founding president visible and Continue enabled. R1 Continue-disabled was a test-harness issue: Continue was clicked while entryPath was still null (Create my profile must be selected first). Product Start step works for real users.

**Verdict:** PASS — This is primarily a **test-harness issue** on the Start step (Continue requires `entryPath === 'create'` or a filled invite). Round 1 clicked Continue without a successful Create-my-profile selection. A real user selecting Create my profile → Founding president can advance Start.

Invite create/list in Settings: seed codes / UI reachable

### Pipeline Coverage Matrix

| Pipeline | Driven via real UI? | Verdict | Evidence / exact repro | Relation to prior finding |
|----------|---------------------|---------|------------------------|---------------------------|
| 1. Session / routing / permissions (FeatureRoute) | Y | **PASS** | Disabled house+bylaws → direct URL /house and /bylaws redirected away from feature routes | new (was not UI-verified R1) |
| 2. Onboarding & founding (Continue + invites) | Y | **PASS** | Invite path CHAPTER-FOUNDER enables Continue. Create-path: Founding president visible and Continue enabled. R1 Continue-disabled was a test-harness issue: Continue was clicked while entryPath was still null (Create my profile must be selected first). Product Start step works for real users. | supersedes M1 — harness issue, not product bug on Start |
| 3. Chapter Setup + 14 exec seat privileges | Y | **FAIL** | President: PASS; VP / Vice President: FAIL (expected gap) redirected to http://localhost:5173/my-dashboard — ExecShell blocks isMemberView even when position boost grants roster perms; Treasurer: PASS; Recording Secretary: FAIL composeBtn=false; Social Chair: PASS; Philanthropy Chair: PASS; Standards / Judicial Chair: PASS; Risk Manager: FAIL (expected gap) no risk boost; newEvent=false; Recruitment Chair: PASS; Scholarship Chair: PASS; House Manager: FAIL (expected gap) addTask=false; Chaplain: FAIL (expected gap) chaplain newEvent=false; Historian: FAIL (expected gap) newSlide=false (needs canAccessExecTools); Member-at-Large (negative): PASS | confirms M5; expands seat-by-seat |
| 4. Standards setup wizard + downstream enforcement | Y | **PASS** | setup route=true; lead_time=24; cats=Medical,Academic,Family Emergency,Work Conflict; event enforce: excuse modal category=true attachmentUI=true policy.attachment=true | confirms R1 standards seed; adds UI enforcement check |
| 5. Excuse + Governance/fines + appeal | Y | **FAIL** | Excuses persist in chapter-os-rsvp-excuses (78). Fines: GovernanceContext uses useState(allowDemoData()?initialFines:[]) with NO localStorage read/write for fines/cases (only committees+chat persist). chapter-os-governance key present=false. Appeal CTA visible on dashboard=false. Full appeal→President decision BLOCKED by fines not surviving refresh. | confirms B1 with exact file gap |
| 6. Attendance pipeline (100% for never roll-called) | Y | **FAIL** | Exact repro: member Zero Attendance has zero AttendanceEntry rows but attendancePct=100. Fresh mid-sim add m-never-att-mt81qqm5 → pct=100. Root: attendanceSync.computeAttendancePctMap omits members with no entries; roster default stays 100. | confirms M3 with exact member/event |
| 7. Calendar/events edit rights (Social / Philanthropy / Chaplain) | Y | **FAIL** | New Event CTA: Social=true Philanthropy=true Chaplain=false. Calendar gates on canEditEventPoints (positionPermissions boosts Social+Philanthropy only; Chaplain role has no boost). | confirms M5 for Chaplain; Philanthropy PASS |
| 8. RSVP pipeline (form vs ops vs mock) | Y | **FAIL** | Source of truth for member UI RSVP: ChapterTables form cells (Yes/Maybe/No) via updateMemberFormRsvp. Source for excuse side-effect: ChapterOps setRsvp → Not Going (chapter-os-rsvps). Source for table sync: mockData demoRsvps ONLY — never live. Divergence: three systems; attendance uses ChapterOps attendance map, not RSVP. ops key present=false. | confirms/supersedes M4 with definitive map |
| 9. Tables pipeline (guest sync) | Partial | **FAIL** | Exact site: src/context/ChapterTablesContext.tsx syncGuestListFromEvent (~L216–225) imports { rsvps as demoRsvps } from '../data/mockData' and uses demoRsvps[table.eventId]. No other sync path uses live chapter-os-rsvps or form RSVPs — uniformly broken for real chapters. | confirms B2 |
| 10. Dues pipeline (UI persist + 39-mismatch root cause) | Y | **FAIL** | UI gap: ChapterOpsContext init setDuesCharges(() => allowDemoData()?initial:[]) — never reads chapter-os-dues-charges; addDuesCharge/recordDuesPayment never writeJson. After UI add+refresh, LS charges unchanged from seed. 39 mismatches from R1: SECOND bug — seed wrote multiple DuesPayment rows per member (UI merges into one); plus DuesSyncBridge only syncs in-memory context dues (empty on cold start for non-guest), so roster duesPaid can diverge from LS seed. Root causes: (1) no persist B3, (2) duplicate payment rows / sync bridge not loading LS. | confirms B3; clarifies M2 as related+second |
| 11. Budget pipeline | Y | **PASS** | Budgets page reachable; audit [{"name":"Fall 2025 Operating Budget","allocated":8000,"spent":1250,"lines":2,"expenses":5}] | confirms R1 Phase3 #4 |
| 12. Roster / profile (self vs exec, duplicates) | Y | **FAIL** | Profile route ok=true. Duplicate email: no UI block; email count=1. MembersContext.registerMember / add flows do not appear to reject duplicate emails. | new |
| 13. Recruitment / PNM → roster conversion | Y | **FAIL** | Pipeline UI reachable. Intended path stops in RecruitmentContext.updateProspect — status can become 'Accepted'/'New Member' but no call to MembersContext.registerMember. Evidence: 7 accepted/NM prospects, 0 with matching roster email. Conversion is pipeline-only. | confirms B4 with exact stop point |
| 14. Study hours pipeline (0h validation) | Y | **FAIL** | FAIL: MemberStudyHoursPanel submitLog has no hours>0 guard (HTML min=0.5 only; Number(0) still submitable via spinner/clear). Context logStudyHours accepts any number. | confirms P4 with exact repro |
| 15. Library hours pipeline | Y | **PASS** | route ok=true; verify CTA present; assign hours min=0 allowed in UI (LibraryHours.tsx input min={0}) | new (untouched R1) |
| 16. House tasks pipeline | Y | **FAIL** | House Manager (ActiveMember + House Manager seat) Add task CTA visible=false. Root cause of R1 "inconclusive": HouseMaintenance gates Add task on canAccessExecTools; positionPermissions does NOT boost House Manager → CTA never renders for that persona (not a selector bug). Empty-title validation as President: blocked=true. | supersedes P1 inconclusive → FAIL (permission gap) |
| 17. Committees pipeline (chair name from live roster) | Y | **FAIL** | Committees.tsx line ~10 imports getMember from mockData (not useMembers). Live chairIds ["m-mt81pb4y-fwbz","m-mt81pb4y-w9rr","m-mt81pb4y-2cw2"]… will not resolve to Mu Omega names. After Social Chair turnover, any committee still using mock lookup shows wrong/missing name. Page mock-name bleed suspected=false. | new (stronger than R1 committee note) |
| 18. Bylaws paste pipeline | Y | **PASS** | Import modal Save button not found in UI; code review: Bylaws.tsx L200 disabled={!pasteContent.trim()} — empty paste blocked. Real paste path exists via importText(). | new |
| 19. Exec slides pipeline (empty title/position) | Y | **FAIL** | Empty save allowed; empty slides in storage=1. ExecSlides.saveEdit has no trim validation. | confirms P2 |
| 20. Announcements (poll vote + signup capacity) | Y | **FAIL** | Poll votes recorded for 2 members; options=[["Hollywood",14],["Masquerade",19],["Decades",9]] \| Seeded over-capacity=true (5/3). joinSignup runtime guard: {"full":true,"blocked":true,"len":5,"cap":3}. Persisted over-capacity state loads without repair. | extends R1 announcements; confirms P3 |
| 21. Language pack (Brother/Sister, Rush/Intake) | Y | **FAIL** | AKA org: Sister=false Brother=false Intake=false Rush=true. Neither Sister nor Brother visible after org switch — languagePack may not update from selected-org alone without full chapter re-bind. | new |
| 22. Crest / branding / theme | Y | **PASS** | Theme CSS --primary/brand present=true; crest img under /crests/ visible=true. OrgCrest lettermark fallback used when asset missing (by design). | new |
| 23. Guest / demo login (/preview) | Y | **FAIL** | FAIL: GuestLogin.clearDemoData() wiped Mu Omega; now designation=undefined demoSeeded=true. GuestLogin.enterPreview calls clearDemoData() which removes ALL STORAGE_KEYS — destroys real chapter session. Not clean isolation. | new — critical session wipe |
| 24. Settings / Account pipeline | Y | **PASS** | Tabs account=true invites=true; profile save attempted=false; reset-onboarding control visible=false. Layout: TopBar showBrand=false per prior fix. | new |
| 25. Console / build hygiene (tsc + lint) | N | **PASS** | tsc PASS: clean; lint PASS: 
> agora@0.0.0 lint
> oxlint

scripts/semester-simulation.mjs:133:9: warning eslint(no-unused-vars): Variable 'accounts' is declared but never used. Unused variables should start with a '_'. help: Consider removing this declaration.
scripts/semester-simulation.mjs:742:9: warning eslint(no-unused-vars): Variable 'tables' is declared but never used. Unused variables should start with a '_'. help: Co; runtime console errors this pass=0 | new |

### Seat-by-seat privilege summary

President: PASS; VP / Vice President: FAIL (expected gap) redirected to http://localhost:5173/my-dashboard — ExecShell blocks isMemberView even when position boost grants roster perms; Treasurer: PASS; Recording Secretary: FAIL composeBtn=false; Social Chair: PASS; Philanthropy Chair: PASS; Standards / Judicial Chair: PASS; Risk Manager: FAIL (expected gap) no risk boost; newEvent=false; Recruitment Chair: PASS; Scholarship Chair: PASS; House Manager: FAIL (expected gap) addTask=false; Chaplain: FAIL (expected gap) chaplain newEvent=false; Historian: FAIL (expected gap) newSlide=false (needs canAccessExecTools); Member-at-Large (negative): PASS

**Cross-cutting privilege architecture note:** Seats held with `UserRole: ActiveMember` keep `isMemberView: true`. `ExecShell` redirects those personas away from `/members`, `/chapter-setup`, etc. even when `positionPermissions` grants `canManageRoster` / `canAccessExecTools`. Calendar/announcements use `AdaptiveShell`, so Social/Philanthropy event create works, but VP roster management via `/members` does not. Fix-pass must either assign AssignableRole (VicePresident/Secretary) on seat assign, or stop treating `isMemberView` as exclusive of exec shells.

### Updated findings (Round 2 merge)

#### Blockers (6)
**B1. Standards fines lost on refresh**
- Repro: Deny excuse on /excuses → fine appears → hard refresh → fine gone
- Notes: GovernanceContext cases/fines are in-memory; chapter-os-governance never read back

**B2. Table guest-list sync uses demo mock RSVPs**
- Repro: Social Chair: create table → Sync guest list from event → wrong/empty guests
- Notes: ChapterTablesContext.tsx line ~225: demoRsvps from mockData.ts, not chapter-os-rsvps or form RSVPs

**B3. Standards fines lost on refresh (confirmed Round 2)**
- Repro: Deny excuse → issueFine in ExcuseApprovals.tsx → GovernanceContext.setFinesList only; refresh → finesList re-inits empty
- Notes: src/context/GovernanceContext.tsx lines ~119: useState(() => allowDemoData() ? initialFines : []) — never reads STORAGE_KEYS.governance

**B4. Dues ledger not persisted when entered via UI (confirmed Round 2)**
- Repro: Treasurer /dues → Add dues → refresh → charge gone from app state
- Notes: ChapterOpsContext.tsx ~214–216 and addDuesCharge ~503 — no localStorage read/write

**B5. Committee chair names resolve from mockData.getMember, not live roster**
- Repro: Open /committees with seeded live chairIds → names missing or demo names
- Notes: src/pages/Committees.tsx and CommitteeDetail likely same pattern

**B6. Guest preview wipes real chapter localStorage**
- Repro: With Mu Omega session saved → /preview → Exec preview → chapter-os-* keys cleared via clearDemoData()
- Notes: src/pages/GuestLogin.tsx enterPreview

#### Major (9)
**M1. (superseded)** Onboarding UI Continue stayed disabled
- Repro: Round 1 harness clicked Continue with entryPath=null
- Notes: Round 2 confirmed **test-harness issue**, not product bug on Start. See Onboarding diagnosis. Remaining product risk: Supabase OTP can BLOCK Profile Continue when needsAuth.**M2. Exec seat privilege gap: VP / Vice President**
- Repro: Persona VP / Vice President → privilege check → redirected to http://localhost:5173/my-dashboard — ExecShell blocks isMemberView even when position boost grants roster perms
- Notes: No positionPermissions boost for this seat

**M3. Exec seat privilege gap: Recording Secretary**
- Repro: composeBtn=false
- Notes: 

**M4. Exec seat privilege gap: Risk Manager**
- Repro: Persona Risk Manager → privilege check → no risk boost; newEvent=false
- Notes: No positionPermissions boost for this seat

**M5. Exec seat privilege gap: House Manager**
- Repro: Persona House Manager → privilege check → addTask=false
- Notes: No positionPermissions boost for this seat

**M6. Exec seat privilege gap: Chaplain**
- Repro: Persona Chaplain → privilege check → chaplain newEvent=false
- Notes: No positionPermissions boost for this seat

**M7. Exec seat privilege gap: Historian**
- Repro: Persona Historian → privilege check → newSlide=false (needs canAccessExecTools)
- Notes: No positionPermissions boost for this seat

**M8. No duplicate-email guard on roster add**
- Repro: President /members add with existing email → no UI block; email count=1
- Notes: 

**M9. House Manager cannot create house tasks**
- Repro: House Manager persona → /house → no Add task button
- Notes: canAccessExecTools false; no house title boost in positionPermissions.ts

#### Polish (1)
**P1. (superseded)** House task UI "inconclusive" from Round 1
- Repro: n/a
- Notes: Superseded by pipeline 16 FAIL — root cause is missing House Manager permission boost, not a flaky selector

### Round 2 methodology

- Extended `scripts/semester-simulation.mjs` → imports `scripts/pipeline-coverage.mjs`
- Reuses Mu Omega 50-member seed; restores storage after destructive guest test
- Every matrix row has PASS / FAIL / BLOCKED — no inconclusive
- Product bugs were **not** fixed in this pass
