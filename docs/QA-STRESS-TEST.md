# Agora — Multi-Chapter QA Stress Test

Comprehensive manual QA plan for **Agora Chapter OS**. Use this to validate three distinct fraternity chapters end-to-end, document bugs, and capture product gaps.

---

## Before you start

| Requirement | Detail |
|-------------|--------|
| **App** | `npm run dev` → typically `http://localhost:5173` |
| **Storage** | No backend — all state is **localStorage** (`chapter-os-*` keys) |
| **One chapter per browser profile** | Do **not** run three chapters in one profile; data will overwrite |
| **Profiles** | Use 3 Chrome/Edge profiles, or 3 incognito windows with **Clear site data** between runs |
| **Crests** | Every org has `/public/crests/{id}.svg`; Wikimedia PNGs where mapped (see `scripts/wikimedia-crest-map.json`) |

### Three test chapters

| Run | Organization | Chapter | University | Config |
|-----|--------------|---------|------------|--------|
| **Alpha** | Alpha Tau Omega (`ato`) | Alpha Chapter | UWF | All features ON; full Standards setup |
| **Beta** | Sigma Chi (`sigma-chi`) | Beta Chapter | Alabama | Disable House + Exec Slides; VP-heavy exec team |
| **Gamma** | Kappa Sigma (`kappa-sigma`) | Gamma Chapter | UAB | Minimal: Calendar, Roster, Announcements only |

---

## Bootstrap checklist (each chapter)

1. Clear site data **or** use a fresh browser profile.
2. Enter via **`/onboarding`** (preferred) or **`/preview`** (guest demo).
3. Complete onboarding as **President** (locks chapter for org).
4. **Chapter Setup** (`/chapter-setup`):
   - Set designation + university
   - Create positions: President, VP, Treasurer, Secretary, Recruitment, Standards, Chaplain, Social, Philanthropy
   - Assign roster members to seats
   - Toggle feature flags per table above
   - Assign **editor capabilities** to a non-officer; verify access
5. **Standards Setup** (`/standards/setup`):
   - Alpha: 24h lead time, attachment required, full category list
   - Beta: 48h lead time, no attachment
   - Gamma: 12h lead time, 2 categories only
6. **Settings → Invites**: create 2 codes; redeem one in a second tab if testing invite flow.
7. Confirm **org crest** appears in onboarding picker, sidebar logo, and chapter header (not just letter badge).

---

## Personas

| Persona | Entry | Home |
|---------|-------|------|
| President / Exec | Onboarding or Guest Exec (`m1`) | `/home` |
| Active Member | Guest Member (`m5`) or member onboarding | `/my-dashboard` |
| Treasurer | Assign Treasurer role / position | `/dues`, `/budget` |
| Standards Chair | `JBoardChair` | `/standards`, `/excuses` |
| Chaplain | Assign Chaplain position | `/calendar` (event create?) |
| Social Chair | Assign Social position | Announcements, calendar points |

---

## Test matrix

### Session & routing
- [ ] `/` → `/preview` when not onboarded; home when onboarded
- [ ] `/preview` always reachable; guest link opens **new tab**
- [ ] Guest ↔ real session switch shows warning
- [ ] Refresh preserves RSVPs, excuses, dues, governance, budget
- [ ] Disabled feature: hidden in sidebar **and** direct URL redirects (`FeatureRoute`)

### Announcements (`/announcements`)
- [ ] Create post, poll, signup; pin/unpin
- [ ] Member votes / joins signup
- [ ] Permission: non-editor blocked; editor capability grant works

### Roster (`/members`, `/members/:id`, `/profile`)
- [ ] Search, sort, add member, edit profile
- [ ] Dues + attendance % visible; exec vs self profile

### Calendar & events (`/calendar`, `/events/:id`)
- [ ] Create required/optional events with points, dress code
- [ ] Chaplain / Social / Philanthropy can edit when positioned
- [ ] RSVP Accept / Decline persists
- [ ] Required decline → excuse modal with **Standards categories**, lead time, attachment rules
- [ ] Event page: RSVP list, attendance tab, points tab, table link

### Excuses (`/excuses`)
- [ ] Pending excuses appear from member submits
- [ ] Approve / deny; reviewer name saved
- [ ] Member sees status on event page
- [ ] Note: approved excuses update attendance; deny issues fine — **works**

### Tables (`/tables`)
- [ ] Create from template; **Sync guest list** uses live RSVPs
- [ ] Re-sync after RSVP changes

### Dues (`/dues`) — treasurer nav
- [ ] BillHighway config, charges, payments
- [ ] Roster balances sync (`DuesSyncBridge`)
- [ ] Member dashboard balance matches
- [ ] Members lack Dues nav — confirm if acceptable

### Budget (`/budget`)
- [ ] Position allotments from Chapter Setup
- [ ] Income/expense lines; totals
- [ ] Independent of dues ledger (by design today)

### Study hours (`/library-hours`)
- [ ] Log hours; verify; manage locations
- [ ] Dashboard progress updates

### House, Recruitment, Standards, Committees, Bylaws, Exec slides
- [ ] CRUD + persist after refresh for each module
- [ ] Standards: cases, fines, appeals from member dashboard
- [ ] Recruitment: pipeline stages, PNM activities
- [ ] Committees: chair names from live roster

### Chapter Setup & Settings
- [ ] President-only setup guard
- [ ] Position → permission boosts (VP, Secretary, Social, Philanthropy)
- [ ] Invite create / redeem / toggle

### Branding
- [ ] Org **crest** in onboarding list, logo, selected-org chip
- [ ] Theme colors change per org (IFC vs NPC vs NPHC vs MGC)
- [ ] Language pack (Brother/Sister, Rush vs Intake)

---

## Cross-chapter stress scenarios

1. **Permission matrix** — same action as President, VP-by-position, editor-capability member, plain member.
2. **Feature flag mid-session** — disable Calendar; member dashboard behavior?
3. **Volume** — 20 events, 10 charges, 15 posts; UI + localStorage size.
4. **Date edges** — events today vs past vs future; excuse lead time near boundary.
5. **Excuse loop** — submit → approve → verify RSVP still "Not Going" (expected today).
6. **Treasurer loop** — charge → partial pay → roster → exec dashboard dues stat.
7. **Table sync race** — RSVP while table open; sync twice.
8. **Profile isolation** — real chapter in Profile A; `/preview` in Profile B — no data bleed.

---

## Known limitations (updated 2026-08-24)

| Area | Current behavior |
|------|------------------|
| **Attendance taking** | Event page roll call (Present / Excused / Absent) for execs — **works** |
| **Attendance %** | Synced from recorded attendance via `attendanceSync.ts` — **works** |
| **Exec dashboard alerts** | Live Action Ledger from `liveAlerts.ts` — **works** |
| **Excuse → fine** | Deny on Excuse Approvals auto-issues a Standards fine draft — **works** |
| **Member "today"** | Uses `localTodayIso()` — **works** |
| **Multi-tab sync** | Last-write-wins on localStorage; no stale-tab indicator; second tab can clobber first |
| **localStorage quota** | Writes log `QuotaExceededError` to console; no in-app toast yet |
| **Error recovery** | `ErrorBoundary` catches render crashes; corrupt JSON in most contexts falls back to empty/demo |
| **BillHighway** | Config + pay link only; no payment processor |
| **Multi-user** | One browser session; guest preview is isolated; Supabase cloud sync optional when env configured |
| **Crests** | Real assets under `public/crests/` when available; lettermark fallback otherwise |
| **Realtime** | No live cross-device updates without refresh |
| **Scale** | 200+ roster / 100+ events not load-tested; may lag |

---

## Bug report template

```markdown
### [Alpha|Beta|Gamma] — Title
- **Severity**: blocker | major | minor | polish
- **Route**: /path
- **Persona**: Exec | Member | Treasurer | …
- **Steps**: 1. … 2. …
- **Expected**:
- **Actual**:
- **Screenshot**:
- **Suggestion**:
```

---

## Final deliverable sections

1. **Top 10 blockers**
2. **UX friction** (extra clicks, confusing copy, dead ends)
3. **Missing features** (expected in chapter OS but absent)
4. **Architecture limits** (localStorage, single session)
5. **Quick wins** vs **larger builds**

---

## Crest asset maintenance

```bash
# Regenerate heraldic SVG crests for all 87 orgs
node scripts/generate-org-crests.mjs

# Fetch Wikimedia coat-of-arms PNGs (manual map; rate-limited)
node scripts/enrich-org-crests-wikimedia.mjs --manual

# Optional: search Commons for remaining orgs (slow; 2.5s per org)
node scripts/enrich-org-crests-wikimedia.mjs
```

Add org → Wikimedia file mappings in `scripts/wikimedia-crest-map.json`. UI loads PNG/JPG first, falls back to SVG via `OrgCrest` component.

---

## Suggested smoke path (15 min)

1. `/preview` → Guest Exec → confirm crest + sidebar
2. Calendar → create required event → Guest Member → decline with excuse
3. Exec → Excuse Approvals → approve
4. Tables → sync guest list
5. Dues → add charge → record payment → check member dashboard balance
6. Refresh → confirm persistence
7. Chapter Setup → disable a feature → hit URL directly → redirect home
