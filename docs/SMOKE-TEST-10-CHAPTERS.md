# Agora Chapter OS — Full Smoke Test (10 Chapters)

Senior QA end-to-end plan for **Agora (Chapter OS)**, a Greek-life chapter operations web app. Test like a real chapter officer and member — not like a developer clicking random buttons.

> **Related:** See also [`QA-STRESS-TEST.md`](./QA-STRESS-TEST.md) for a lighter 3-chapter stress pass.

---

## Environment

| Requirement | Detail |
|-------------|--------|
| **App** | Run locally with `npm run dev` (typically `http://localhost:5173`) or a deployed preview URL |
| **Browsers** | Use at least **2 browsers or 2 incognito profiles** (Browser A = founder, Browser B = joiner) for cross-device tests |
| **Supabase** | If cloud sync / join codes are enabled, confirm migration `supabase/migrations/20260328000000_join_code_lookup.sql` has been applied |
| **Storage** | Clear `localStorage` between chapters unless testing persistence. Use unique emails per account (`chapter{N}-role@test.local`) |
| **Record** | For each chapter, log PASS/FAIL/BLOCKED, screenshots on failure, and exact steps to reproduce |

### Session hygiene (between chapters)

1. Sign out or clear site data for the origin.
2. Confirm empty state: `/onboarding` loads with no stale roster.
3. Use distinct emails: `alpha-pres@test.local`, `alpha-treas@test.local`, etc.

### Account switching

The app is **localStorage/session-based** — there is no multi-user login server. To test multiple roles:

- Use **separate browsers/incognito profiles**, or
- Re-onboard with a new email and assign roles in Chapter Setup, or
- Reassign roles in `/chapter-setup` on the same browser (fastest for the permission matrix)

---

## Feature inventory

All modules must be exercised across the 10 chapters.

| Module | Route(s) | Feature flag |
|--------|----------|--------------|
| Executive home | `/home` | — |
| Announcements | `/announcements` | `announcements` |
| Roster | `/members`, `/members/:id` | `roster` |
| Calendar | `/calendar`, `/events/:id` | `calendar` |
| Excuse approvals | `/excuses` | `calendar` |
| Library / study hours | `/library-hours` | `studyHours` |
| Dues | `/dues` | `dues` |
| Budgets | `/budgets`, `/budgets/:id` | `budgets` |
| Forms / tables | `/tables`, `/tables/:id` | `tables` |
| Recruitment | `/recruitment`, `/recruitment/pipeline`, `/recruitment/pnm/:id` | `recruitment` |
| Standards / J-Board | `/standards`, `/standards/setup` | `standards` |
| Committees | `/committees`, `/committees/:id` | `committees` |
| House | `/house` | `house` |
| Bylaws | `/bylaws` | `bylaws` |
| Exec slides | `/exec-slides` | `execSlides` |
| Chapter setup | `/chapter-setup` | President / Treasurer / admin |
| Settings | `/settings` | account / position / invites |
| Member dashboard | `/my-dashboard` | member view |
| My profile | `/profile` | — |
| Guest preview | `/preview`, `/login` | demo mode |
| Onboarding | `/onboarding` | create + join flows |

### Codebase notes (avoid false failures)

**Disabled features redirect — no gate page.** `FeatureRoute` redirects to the user's default home (`/home` for exec, `/my-dashboard` for members), not a dedicated "feature disabled" screen.

**Sidebar visibility ≠ route access.** Several nav items require permissions in addition to feature flags:

| Nav item | Also requires |
|----------|----------------|
| Members | `canManageRoster` |
| Library Hours | `canVerifyStudyHours` |
| Excuses | `canAccessExecTools` |
| Budgets | exec permissions + `budgets` feature |

Active members log study hours from **`/my-dashboard`**, not necessarily via a Library Hours sidebar link.

**VP / Secretary are seat-based boosts.** Vice President and Secretary are **chapter positions**, not onboarding role picks. Assign seats in `/chapter-setup`; permission boosts come from `positionPermissions.ts`. Do not expect the Settings → Position tab to show "Vice President" unless the underlying role was explicitly set.

**Guest preview overwrites local state.** `/preview` calls `backupRealSession()`, `clearDemoData()`, and `seedGuestDemo()`. Run **Chapter 10 (Kappa) last**, or from a clean profile.

**Chapter 9 cross-device.** Mark **BLOCKED** (not FAIL) if Supabase env vars are missing or migration `20260328000000_join_code_lookup.sql` is not applied.

---

## Roles to exercise

President · Treasurer · JBoardChair · RecruitmentChair · ScholarshipChair · Chaplain · ActiveMember · NewMember · Vice President (seat) · Secretary (seat)

---

## 10-chapter test matrix

Create **10 isolated chapters**. Each gets a unique designation + university. Use different national orgs where possible (fraternity, sorority, NPHC, MGC) to verify branding/theming.

| # | Chapter name | Primary purpose | Feature config | Minimum accounts |
|---|--------------|-----------------|----------------|------------------|
| 1 | **Alpha — Full Stack** | Happy-path everything ON | All 13 features enabled | President + 6 officers + 3 actives |
| 2 | **Beta — Core Only** | Minimal chapter | Only announcements, roster, calendar ON; rest OFF | President + 2 actives |
| 3 | **Gamma — Rush Cycle** | Recruitment deep dive | recruitment ON; others default | President, RecruitmentChair, 2 actives |
| 4 | **Delta — Accountability** | Standards + excuses + fines | standards + calendar ON | President, JBoardChair, 2 actives |
| 5 | **Epsilon — Treasury** | Dues + budgets | dues + budgets ON | President, Treasurer, 3 actives |
| 6 | **Zeta — Scholarship** | Study hours | studyHours ON | President, ScholarshipChair, 2 actives |
| 7 | **Eta — Operations** | House + committees + forms | house + committees + tables ON | President, 2 actives, committee chair |
| 8 | **Theta — Governance docs** | Bylaws + exec slides | bylaws + execSlides ON | President, Secretary seat |
| 9 | **Iota — Cross-device** | Cloud join + data sync | All ON; **2 browsers required** | Browser A: President founder; Browser B–D: 3 joiners |
| 10 | **Kappa — Sorority Full Build** | Real ZTA chapter from scratch | All features ON | President + Treasurer + Recruitment + 2 actives |

### Real chapter build order (every chapter)

Do **not** use `/preview` guest mode or `seedGuestDemo()` for chapters 1–10. Each chapter is built like a founding president would:

1. **Clear browser profile** — fresh `localStorage`.
2. **`/onboarding` → Create my profile → Founding president** — pick a real national org, enter designation + university.
3. **Settings → Invites** — copy the auto-generated `CHAPTER-JOIN-*` code (share with members later).
4. **`/members` → Add Member** — president manually adds brothers/sisters to the roster (or share join code for self-service join on another device).
5. **`/chapter-setup`** — save chapter profile, toggle features via switches, assign officer **seats** to roster members.
6. **Live content** — post announcement, schedule event, add study location, etc. through the normal UI.
7. **Officers use their seats** — Treasurer opens `/dues`, Recruitment Chair opens pipeline, etc.

Chapter **Iota** additionally validates **join-code onboarding** in a second browser after steps 1–6.

Chapter **Kappa** is a full sorority build (ZTA) — not guest preview.

### Suggested execution schedule

| Day | Chapters | Est. time |
|-----|----------|-----------|
| 1 | Phase 0 + Chapter 1 (full Phase 2) | 3–4 hrs |
| 2 | Chapters 2–5 | 2–3 hrs |
| 3 | Chapters 6–8 | 2 hrs |
| 4 | Chapter 9 + Phase 4 permissions | 2 hrs |
| 5 | Chapter 10 + Phase 5 persistence/mobile | 1 hr |

---

# PHASE 0 — Global onboarding tests (once, before Chapter 1)

### 0.1 Create chapter (founder path)

1. Go to `/onboarding`.
2. Choose **Create a chapter** (not invite).
3. Complete: Profile (valid email, photo optional) → Organization → Chapter designation + university → Role **President**.
4. Land on `/home`.
5. **Verify:** Chapter join code visible in Settings → Invites; launch checklist visible on exec dashboard; sidebar shows enabled modules.

### 0.2 Join chapter (invite path)

1. Fresh browser/incognito → `/onboarding`.
2. Choose **Join with invite**; paste join code from Chapter 1 founder.
3. Complete profile; accept default **Active Member** role (join codes should NOT auto-grant President).
4. **Verify:** Same chapter designation/university; roster includes founder + joiner; data hydrates from cloud (if Supabase configured).

### 0.3 Validation edge cases

- [ ] Invalid join code → clear error, no crash
- [ ] Invalid email on onboarding → blocked
- [ ] Disabled feature route (Chapter 2) → navigating to `/dues` **redirects** to home/dashboard (no crash, no dedicated gate UI)

---

# PHASE 1 — Per-chapter bootstrap (repeat for Chapters 1–10)

## 1A. Founder setup (Browser A)

- [ ] Create or join chapter per matrix above
- [ ] `/chapter-setup`: edit chapter designation + university; save
- [ ] Add custom position (e.g. "Social Chair"); assign member; reassign seat → prior holder reverts to Active Member
- [ ] Toggle features per matrix; confirm sidebar updates immediately
- [ ] Assign editor capabilities to a non-officer active member (e.g. `editCalendar`)
- [ ] Assign **Vice President** and **Secretary** seats; verify permission boosts (Secretary → roster/invites/study verify; VP → exec tools)
- [ ] `/settings` → Invites: copy primary join code

## 1B. Invite officers

Join or assign at minimum:

- [ ] Treasurer
- [ ] JBoardChair (Standards)
- [ ] RecruitmentChair
- [ ] ScholarshipChair
- [ ] Chaplain (onboarding or seat assignment → exec chrome, event points edit)
- [ ] 2× ActiveMember
- [ ] 1× NewMember (optional)

## 1C. Launch checklist (`/home`)

Complete until checklist auto-hides:

- [ ] Schedule first event (Calendar)
- [ ] Add study location (Library Hours)
- [ ] Post announcement
- [ ] Invite ≥1 additional member (roster count > 1)
- [ ] Configure standards (`/standards/setup` wizard — run as JBoardChair or President)

---

# PHASE 2 — Module test scripts

Run **fully on Chapter 1**; spot-check on other chapters per matrix.

## 2.1 Executive Dashboard (`/home`) — President

- [ ] Stats: members, attendance %, dues total, recruitment count
- [ ] Quick actions: Post, Excuses badge, Library, Setup
- [ ] Upcoming events list (empty state → populated)
- [ ] Announcements preview (empty → populated)
- [ ] Live alerts reflect excuses / recruitment follow-ups

## 2.2 Announcements (`/announcements`) — Exec + assigned editor

**Feed tab**

- [ ] Create text announcement; pin it; appears at top
- [ ] Edit announcement (title/body); save
- [ ] Delete announcement
- [ ] Non-editor active member: cannot create (if not in editor list)

**Polls tab**

- [ ] Create poll (≥2 options, close date); vote as 2 different members; tallies update

**Signups tab**

- [ ] Create sign-up sheet with slots; member claims slot; capacity enforced

**Templates tab**

- [ ] Apply template; tokens substituted in composer

## 2.3 Roster (`/members`, `/members/:id`) — President / Secretary

- [ ] Member list loads; search/filter if present
- [ ] Open member profile; tabs: Overview, Attendance, Dues, Events, Points
- [ ] Attendance tab shows real event attendance (not placeholder)
- [ ] Dues tab shows charges/payments
- [ ] Points tab sums attendance points
- [ ] Direct URL `/members/invalid-id` → graceful not found
- [ ] With roster feature OFF (Chapter 2): route redirects away
- [ ] Plain ActiveMember: Members nav hidden; note whether direct URL `/members` loads or redirects

## 2.4 Calendar & Events (`/calendar`, `/events/:id`)

**Calendar — exec**

- [ ] Create event: name, type, date, time, location, **dress code**, description, points, required flag, RSVP required
- [ ] Event appears on calendar grid; color matches type
- [ ] Click through to event page

**Event page — member**

- [ ] RSVP: Yes / No / Maybe (all options)
- [ ] Submit excuse for required event (within policy); status pending
- [ ] Excuse blocked if inside lead-time window (verify message)

**Event page — exec**

- [ ] Take attendance roll: Present / Excused / Absent
- [ ] Edit points for attendees
- [ ] Linked form/table visible if created

## 2.5 Excuse Approvals (`/excuses`) — President / exec

- [ ] Pending excuse listed with member + event
- [ ] **Approve** → member attendance = Excused; no fine
- [ ] Submit second excuse → **Deny** → attendance = Absent; fine auto-issued
- [ ] Denied fine appears in Standards → Fines

## 2.6 Library / Study Hours (`/library-hours`)

**ScholarshipChair**

- [ ] Add location (name + address); empty state gone
- [ ] Rename location; edit address; disable/enable location
- [ ] Set chapter-wide hour requirement; assign per-member hours (include exempt member)
- [ ] Configure reset period (weekly/semester)

**Active member** (`/my-dashboard` study panel)

- [ ] Log hours at approved location; shows Pending
- [ ] Log with no locations → warning shown

**ScholarshipChair verify**

- [ ] Pending queue shows log; **Verify** → counts toward total
- [ ] Second log → **Deny** → shows Denied; excluded from pending count
- [ ] Member panel shows Verified / Pending / Denied badges

## 2.7 Dues (`/dues`) — Treasurer

- [ ] Create charge (label, amount, due date, semester)
- [ ] Record partial payment for member
- [ ] Record full payment; balance → 0
- [ ] Bill Highway URL field saves
- [ ] Empty charges list shows empty state
- [ ] Member view: sees own balance on `/my-dashboard`

## 2.8 Budgets (`/budgets`, `/budgets/:id`) — Treasurer / exec

- [ ] Create budget (name, semester, description)
- [ ] Add line items (category, allocated, spent)
- [ ] Totals: allocated, spent, remaining update
- [ ] Non-exec member: read-only or hidden create button

## 2.9 Forms / Tables (`/tables`, `/tables/:id`)

- [ ] Create spreadsheet form (standalone)
- [ ] Create event-linked guest list form
- [ ] Add/edit rows; data persists on reload
- [ ] Event RSVP sync: RSVP on event page reflects in form table

## 2.10 Recruitment — RecruitmentChair

Routes: `/recruitment`, `/recruitment/pipeline`, `/recruitment/pnm/:id`

**Dashboard**

- [ ] Stage counts; top prospects; follow-up overdue list
- [ ] Archived PNMs excluded from stats

**Pipeline**

- [ ] Add PNM via modal (all template fields; **invalid email blocked**)
- [ ] Drag PNM across stages: New → Contacted → Met → Interested → Invited → Bid
- [ ] Drag to **Accepted**: promotes to roster; member appears in `/members`
- [ ] Force duplicate email promote → error banner; stage reverts
- [ ] Archived PNMs hidden from pipeline

**PNM Profile**

- [ ] Upload photo; add note; activity timeline updates
- [ ] Assign brother/sister via roster dropdown
- [ ] Archive → disappears from pipeline; Unarchive restores
- [ ] Delete → removed; navigates back to pipeline

## 2.11 Standards / J-Board (`/standards/setup`, `/standards`)

**Setup wizard — JBoardChair**

- [ ] Complete 3-step wizard: terminology, fine matrix, excuse/appeals policy
- [ ] Redirects to `/standards`; launch checklist step completes

**Judicial Board**

- [ ] Overview tab: stats + recent activity
- [ ] **File violation**: must select member (no default); category, fine, note → case + fine created
- [ ] **Direct fine**: member + amount + reason
- [ ] Cases tab: empty state → populated
- [ ] Fines tab: filter All/Unpaid/Appealed/Paid; Waive / Mark Paid
- [ ] Member view: case visibility respects privacy setting

## 2.12 Committees (`/committees`, `/committees/:id`) — President

- [ ] Create standing committee (name, chair, members, private flag)
- [ ] Create subgroup under committee
- [ ] Committee detail — **Chat tab**: post message; appears for members
- [ ] **Members tab**: add/remove member
- [ ] **Feed tab**: committee-specific announcement
- [ ] Non-member active: committee hidden unless private rules say otherwise
- [ ] Chats index tab lists threads with activity

## 2.13 House (`/house`) — exec or assigned editor

- [ ] **Cleanup tab**: create task, assign member, mark complete
- [ ] **Maintenance tab**: log issue, set priority/status

## 2.14 Bylaws (`/bylaws`) — Secretary / exec

- [ ] Import via paste (.txt content)
- [ ] Search highlights matching lines
- [ ] Delete document

## 2.15 Exec Slides (`/exec-slides`) — exec

- [ ] Create slide (position, title, responsibilities, talking points)
- [ ] Edit slide; enter present mode
- [ ] Copy slide text to clipboard
- [ ] Delete slide

## 2.16 Settings (`/settings`)

**Account tab — all users**

- [ ] Edit profile fields; photo; save persists on reload

**Position tab — officers**

- [ ] Role-specific dashboard panels render (Treasurer, JBoard, Recruitment, Admin)

**Invites tab — President/Secretary**

- [ ] Primary join code displayed
- [ ] Toggle invite code active/inactive
- [ ] Copy code; validate on new browser

## 2.17 Member experience (`/my-dashboard`, `/profile`)

Log in as **ActiveMember** (not exec):

- [ ] Member dashboard loads (not exec home)
- [ ] See pinned announcements, polls, signups
- [ ] RSVP to upcoming events inline
- [ ] Study hours panel: log hours, see status
- [ ] Dues balance visible
- [ ] Fines visible (if any) per privacy rules
- [ ] `/profile` edits save
- [ ] Sidebar hides exec-only items (Excuses, Budgets, Chapter Setup)
- [ ] Assigned editor can access their module (e.g. calendar) without exec role

---

# PHASE 3 — Chapter-specific deep tests

### Chapter 2 (Beta — Core Only)

- [ ] `/dues`, `/budgets`, `/standards`, `/recruitment` all redirect when feature disabled
- [ ] Core trio works: announcements, roster, calendar

### Chapter 9 (Iota — Cross-device) — CRITICAL

**Browser A (President):**

1. Create chapter; complete full setup with 2 events, 1 announcement, 1 study location, 1 PNM.
2. Copy join code.

**Browser B (ActiveMember joiner):**

3. Join via code; verify chapter name, events, announcement, locations appear after hydrate.
4. Log study hours; RSVP to event.

**Browser A:**

5. Verify joiner's RSVP and study log appear (cloud sync).
6. Verify study log; approve.

**Browser C (Treasurer joiner):**

7. Join; assign Treasurer in Chapter Setup; verify treasurer settings access.

**Pass criteria:** No "code was invalid"; joiner never overwrites founder cloud data; roster count correct on both sides after refresh.

**If Supabase/migration unavailable:** mark entire chapter **BLOCKED**.

### Chapter 10 (Kappa — Sorority full build)

1. Fresh profile → onboard as **Founding president** for **Zeta Tau Alpha**.
2. Add roster members via `/members` → Add Member.
3. Assign Treasurer + Recruitment Chair seats in `/chapter-setup`.
4. Post announcement, schedule event, add study location.
5. Confirm exec dashboard and member-facing routes work with sorority branding.

### Optional: Guest preview (separate from 10-chapter matrix)

Run only when explicitly testing demo mode — **not** as a chapter substitute:

1. Visit `/preview` → Exec guest / Member guest.
2. Confirm demo loads without crash.
3. Run **last** — it replaces local session data.

---

# PHASE 4 — Permission matrix spot-check (Chapter 1)

Log in separately as each role (or reassign in Chapter Setup); verify key gates:

| Role | Post announcements | Manage roster | Verify study hours | Manage fines | Chapter setup |
|------|---------------------|---------------|-------------------|--------------|---------------|
| President | ✅ | ✅ | ✅ | ✅ | ✅ |
| Treasurer | ❌ | ❌ | ❌ | ✅ | ✅ |
| JBoardChair | ❌ | ❌ | ❌ | ✅ | ❌ |
| RecruitmentChair | ❌ | ❌ | ❌ | ❌ | ❌ |
| ScholarshipChair | ❌ | ❌ | ✅ | ❌ | ❌ |
| Chaplain | ❌* | ❌ | ❌ | ❌ | ❌ |
| ActiveMember | ❌ | ❌ | ❌ | ❌ | ❌ |
| Secretary (seat) | ✅ | ✅ | ✅ | ❌ | ❌ |
| VP (seat) | ❌ | ❌ | ❌ | ❌ | ❌** |

\* Chaplain gets exec chrome and event-points edit via seat boost, not announcement posting by default.

\*\* VP gets exec tools + J-Board case view via seat boost, not chapter setup.

---

# PHASE 5 — Persistence & regression

For Chapter 1 and Chapter 9:

- [ ] Hard refresh browser → all data persists
- [ ] Close tab, reopen → session restored
- [ ] Dates use **today** (no hardcoded 2025-08-23 demo dates in new records)
- [ ] No console errors on primary flows
- [ ] Mobile width (375px): sidebar, modals, pipeline horizontal scroll usable

---

# Deliverables

Produce a test report with:

1. **Summary table:** 10 chapters × major modules → PASS / FAIL / BLOCKED
2. **Bug list:** severity (P0–P3), steps, expected vs actual, screenshot, chapter #
3. **Coverage checklist:** every `ChapterFeatureId` and every onboarding role exercised
4. **Cross-device result:** Chapter 9 join/sync PASS, FAIL, or BLOCKED with details
5. **Recommended fixes:** ordered by user impact

## P0 definitions

- Cannot complete onboarding or join chapter
- Data loss on refresh
- Promote-to-roster creates duplicate or crashes
- Feature flag bypass (access disabled module without redirect)
- Cross-device join code invalid when migration applied

---

# Bug report template

```markdown
### BUG-XXX [P0|P1|P2|P3] — Short title
- **Chapter:** Alpha / Iota / etc.
- **Role:** President / ActiveMember / etc.
- **Route:** /recruitment/pipeline
- **Steps:** 1… 2… 3…
- **Expected:** …
- **Actual:** …
- **Screenshot:** (attach)
- **Console:** (errors if any)
- **Persistence:** fails after refresh? yes/no
```

---

# Coverage checklist (sign-off)

## ChapterFeatureId

- [ ] `announcements`
- [ ] `roster`
- [ ] `calendar`
- [ ] `recruitment`
- [ ] `standards`
- [ ] `dues`
- [ ] `budgets`
- [ ] `studyHours`
- [ ] `house`
- [ ] `tables`
- [ ] `committees`
- [ ] `bylaws`
- [ ] `execSlides`

## Onboarding roles

- [ ] President
- [ ] Treasurer
- [ ] JBoardChair
- [ ] RecruitmentChair
- [ ] ScholarshipChair
- [ ] Chaplain
- [ ] ActiveMember
- [ ] NewMember

## Position seats (non-onboarding)

- [ ] Vice President
- [ ] Secretary
