# ATO Chapter Operating System — Product Requirements Document
### Phased Build Plan for Cursor

This PRD breaks the full prototype spec into build phases for a Cursor agent, following the same PRD → Cursor phase-by-phase workflow used for FieldInvoice. Every feature from the original spec is accounted for below, mapped to a phase. Nothing is dropped — items are sequenced, not cut.

**Suggested stack** (mirrors FieldInvoice): React + TypeScript + Vite, Supabase (Postgres + Auth + Storage), Tailwind, Vercel for hosting.

---

## 0. Foundation (build before any feature phase)

**Goal:** shell that every later phase plugs into.

- App shell: sidebar nav (per Section 27), top bar, role-based routing
- Auth via Supabase (email/password to start; roles stored on user record)
- Role system: President, Vice President, Treasurer, Recruitment Chair, Other Officer, Regular Member, Advisor (read-only) — Section 2
- Core data model (tables): `members`, `roles`, `events`, `attendance`, `dues`, `forms`, `form_responses`, `chapter_tables`, `chapter_table_rows`, `projects`, `tasks`, `documents`, `prospects` (PNMs), `prospect_activity`, `polls`, `poll_responses`, `announcements`, `messages`
- Design system: dark navy / white / gold-orange theme (per your ATO logo reference), card components, table components, status pill component, modal component — reusable across every phase below
- Global "connected data" principle baked into the data layer from day one: attendance writes should be able to update points and analytics without duplicate entry (Section 8's "one piece of information entered once" — this is a data-model decision, not a UI decision, so it has to be right before Phase 2)

---

## Phase 1 — Executive Dashboard + Member Management
*(Sections 3, 4)*

**Executive Dashboard**
- Personalized greeting, chapter identity (Alpha Tau Omega — UWF, semester/year)
- Quick stats: Active Members, Attendance, Dues Collected/Expected, Active Recruitment Prospects, Outstanding Tasks
- Chapter health widgets: Recruitment, Finances, Attendance, Events, Brotherhood, Officer Tasks
- Upcoming section: Chapter Meeting, Recruitment Event, Philanthropy, Executive Meeting
- Alerts: outstanding dues, attendance deficiencies, overdue officer tasks, PNMs needing follow-up

**Member Management**
- Central roster table — fields: Member, Class, Status, Dues, Attendance, Points
- Filters: Active, New Member, Alumni, Exec, Dues Status, Attendance, Class, Committee
- Member profile: picture, phone, email, major, graduation year, Big, Little, class, emergency contact, shirt size, birthday, chapter-specific info
- Profile tabs: Overview | Attendance | Dues | Events | Points | Tasks | Forms

---

## Phase 2 — Attendance, Points, Events, Calendar
*(Sections 6, 7, 12)*

**Attendance + Points**
- Attendance dashboard (chapter meeting, event, brotherhood, philanthropy % breakdowns)
- Individual attendance history
- Attendance points ledger (event, date, status, points) with automatic point totals

**Event Management**
- Create Event form: Name, Type, Date/Time, Location, Description, Required?, Points, Dress Code, Transportation, Guest Allowed?, RSVP Required?, Check-in Method
- Event types: Chapter, Brotherhood, Social, Philanthropy, Recruitment, Intramural, Executive, Other
- Check-in methods: QR Code, Manual, Self Check-in (QR mockup per Section 26)
- Event page connects RSVPs, attendance, points, member lists, assignments, payments, event-specific chapter tables

**Calendar**
- Unified calendar with filters: All | Chapter | Brotherhood | Social | Philanthropy | Recruitment | Exec
- Event cards: name, date/time, location, required status, points
- Clicking an event opens its full event page

---

## Phase 3 — Dues & Financials
*(Section 5)*

- Financial dashboard: Total Expected, Collected, Outstanding
- Statuses: Paid, Partially Paid, Payment Plan, Outstanding, Overdue
- Individual member financial profile
- Payment history, deadlines, balances
- Exec-only access enforcement (role gate on top of Phase 0's role system)

---

## Phase 4 — Chapter Tables (Data Hub)
*(Section 8)*

This is the differentiator feature — build it as a genuinely reusable table engine, not one-off tables.

- Generic table builder: add/remove columns, column types (text, dropdown, checkbox, date, number, member reference, event reference, assignment/owner)
- Sort, filter, search, export, duplicate table
- Sharing/permissions per table (specific members/officers)
- Seed example tables: Fall Formal (Member, RSVP, Guest, Paid, Transportation, Table), Philanthropy (Member, Attending, Role, Hours, Points), Intramural Soccer (Member, Position, Jersey, Paid, Attendance), Formal Committee (Task, Assigned To, Due, Status)
- Wire at least one table's data to auto-update a real system (e.g., Philanthropy hours row updates points ledger) to demonstrate the "connected data" principle live

---

## Phase 5 — Forms, Polls/Voting
*(Sections 9, 10)*

**Forms**
- Form builder with field types: Short answer, Long answer, Multiple choice, Checkbox, Dropdown, Date, Number, File upload, Member selection
- Seed form templates: Event RSVP, Absence/Excuse, Officer Interest, Committee Sign-Up, Brotherhood RSVP, Formal Guest, Philanthropy Volunteer, New Member Information, Feedback Survey, Recruitment Referral, Big/Little Preferences, Executive Board Application, Elections Ballot
- Responses render as a spreadsheet-style table (reuse Phase 4's table component), exportable

**Polls / Voting**
- Multiple-choice poll creation
- Response counts/totals display
- Confidential mode (for elections)

---

## Phase 6 — Communication Center
*(Section 11)*

- Announcements feed
- Direct messages, group messages
- Targeting: chapter-wide, executive, pledge-class, committee, custom/targeted
- Event reminders and action-required notifications (tie into Phase 2 events and Phase 3 dues alerts)

---

## Phase 7 — Tasks, Projects, Officer Hub, Documents
*(Sections 13, 14, 15)*

**Task / Project Management**
- Projects (e.g., Fall Formal, Recruitment Week, Philanthropy Event, Initiation) with overall progress bar
- Tasks: assigned member, due date, status, files, notes, chat
- Seed example: Fall Formal tasks (Reserve venue, Order decorations, Collect RSVPs, Finalize transportation, Confirm DJ)

**Officer Hub**
- Executive Board + all officer positions listed
- Officer page: responsibilities, current tasks, upcoming deadlines, progress
- Example: Recruitment Chair responsibilities (pipeline, rush events, PNM assignment, follow-ups, reporting)
- Design for institutional memory — this page's structure should look like something a new officer inherits, not something built from scratch each term

**Document Center**
- Folders: Constitution, Bylaws, Risk Management, Recruitment, Philanthropy, Financial, Officer Resources, National ATO Documents, Event Documents
- Permission levels: Everyone, Exec Only, Officer, Recruitment Team

---

## Phase 8 — Recruitment CRM (Core)
*(Sections 16, 17, 18, 19)*

Treat this as its own major nav area, separate design language allowed within the same theme — ChapterBuilder is the benchmark.

- Recruitment Dashboard: Prospects, Contacted, Met, Interested, Invited, Bids, Accepted metrics
- Pipeline board (drag-and-drop): New → Contacted → Met → Interested → Invited → Bid → Accepted → New Member
- PNM Database: table with Name, Status, Assigned Brother, Last Contact, Next Step, Rating; filters by Status, Assigned Brother, Event, Tag, Major, Graduation Year, Last Contact, Rating
- PNM Profile (build this one with the most visual polish): personal info (Name, status, rating, main contact, major, year, phone, Instagram, hometown), Interests, Notes, Activity timeline, Next task/follow-up
- Recruitment Referral form: public/QR-accessible "Refer a Potential Member" form (Name, Phone, Email, How they know him, Why he'd fit) — submission auto-creates a prospect record in the CRM

---

## Phase 9 — Recruitment Events, Tasks, Analytics
*(Sections 20, 21, 22, 23)*

- Recruitment Events: create rush events, invite PNMs + brothers, track RSVP/attendance, assign follow-ups, link attendance back to prospect profiles
- Recruitment Tasks: per-PNM tasks (call, text, invite, follow up, schedule meeting); Recruitment Chair view surfaces overdue follow-ups and uncontacted prospects
- Recruitment Analytics: prospects by source (Member Referral, Rush Event, Instagram, IFC, Website, Friend), conversion rate, prospects per brother, event attendance, follow-up activity, bids, acceptance rate, weekly performance
- Regular Member Recruitment View: scoped-down "My Recruitment" — My Prospects, prospect statuses, my recruitment tasks, recruitment events, Add Prospect

---

## Phase 10 — Reports
*(Section 24)*

- Roster report, Dues report, Attendance report, Points report, Recruitment report, Event attendance report, Philanthropy hours report, Member participation report, Outstanding balances report, Officer task completion report
- CSV/Excel export on all of the above (reuse Phase 4's export logic)

---

## Phase 11 — Settings / Admin
*(Section 25)*

- Chapter settings, member permissions, officer positions, attendance rules, point system config, dues structure config, event types config, recruitment statuses config, tags, forms admin, notification settings, branding

---

## Phase 12 — Mobile Pass + Polish
*(Sections 26, 28, 29)*

- Full responsive pass across every phase above — bottom nav: Home | Calendar | Events | Recruitment | More
- QR check-in interaction demo (ties to Phase 2)
- Visual QA pass against Section 28 requirements: no generic-SaaS-template look, dark navy/white/gold consistent throughout, realistic sample data everywhere, working modals/dropdowns/search/filters, clickable (not static) profiles
- Assemble the presidential demo flow end to end per Section 29: Executive Dashboard → Attendance → Member Profile → Event → Chapter Table → Forms → Recruitment Dashboard → PNM Pipeline → PNM Profile → Recruitment Event → Recruitment Analytics → Regular Member View

---

## Cross-cutting principles (apply in every phase, not just their "home" phase)

From Section 30 — build these into the architecture from Phase 0, not bolted on later:

1. **One piece of information entered once.** Attendance updates points + member profile + exec analytics automatically. Design the data layer so this is structural, not a UI trick.
2. **Exec sees the chapter; regular members see themselves.** Every screen needs a regular-member-scoped variant, not just an exec variant.
3. **Recruitment is a first-class system**, not a bolt-on — separate nav, separate visual rhythm, ChapterBuilder-level polish.
4. **Every task/responsibility has an owner, deadline, and visible status** — this should be a shared UI pattern (status pill + assignee + due date) reused across Tasks, Officer Hub, Chapter Tables, and Forms.
5. **Institutional memory** — Officer Hub and Documents should look like something that outlives a single term.

---

## What's intentionally sequenced late (not cut)

Everything from the original 32-section spec is in a phase above. If you want to compress for a faster demo, the safe phases to defer past an initial presidential-speech demo are:

- Phase 6 (Communication Center)
- Phase 10 (Reports)
- Phase 11 (Settings/Admin)
- Phase 12's full mobile pass (a partial responsive pass is enough for a live demo)

Everything else (Phases 0–5, 7–9) is what makes the "chapter management + recruitment CRM in one platform" story land.
