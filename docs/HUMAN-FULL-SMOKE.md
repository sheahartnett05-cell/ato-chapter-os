# Human full-feature smoke (then wipe clean)

**Paste the prompt below into a fresh agent chat** (or follow it yourself).  
**Target:** https://chapteramanager.com (or `npm run dev` for local).  
**Brand:** Chaptera · branch `sprint-fixes` · Supabase `qfurjvkdbvjpvezsrddf` only.

Use **two browsers** (A = President founder, B = joiner). Prefer a **throwaway chapter** designation you will wipe.

---

```text
You are running Chaptera’s HUMAN FULL-FEATURE SMOKE, then wiping the test chapter clean.

Repo: c:\Users\tjunk\ato-chapter-os
Prod: https://chapteramanager.com
Canonical Supabase: qfurjvkdbvjpvezsrddf only.

Rules:
- Prefer executing / guiding the human click-path over essays.
- Log PASS / FAIL / BLOCKED per checklist item into docs/SMOKE-TEST-RESULTS.md (append a dated section).
- FAIL = product bug. BLOCKED = env (Resend DNS, OTP, Docker, missing permission) — say exactly why.
- Do NOT use /demo or /preview for the main chapter (guest demo pollutes localStorage). Run guest demo as a SEPARATE mini-pass at the end, then exit demo before wipe.
- After all feature checks: wipe clean (section Z). Never leave orphan cloud memberships for the smoke emails.
- Do NOT force-push. Do NOT run Gate A against production.
- If OTP email never arrives (Resend DNS pending), mark auth steps BLOCKED and continue with whatever local/guest paths still work; still attempt wipe.

════════════════════════════════════════
A) PREFLIGHT
════════════════════════════════════════
- Confirm https://chapteramanager.com loads (or local :5173).
- Browser A + Browser B (incognito OK).
- Pick unique smoke identity:
  · Designation: Smoke-{YYYYMMDD}-{HHMM}
  · University: Smoke Test U
  · Emails: smoke-pres+{stamp}@… and smoke-member+{stamp}@… (real inboxes if OTP required)
- Confirm VITE_SUPABASE points at qfurjvk… (not retired project).
- npm run verify-supabase (join RPCs) — note PASS/FAIL.

════════════════════════════════════════
B) FOUNDING + AUTH (Browser A)
════════════════════════════════════════
1. Clear site data for the origin (or fresh profile).
2. /onboarding → Create chapter as President → org + designation + university.
3. Complete OTP / sign-in email from Chaptera <auth@chapteramanager.com>.
   · PASS only if code arrives and lands in chapter.
   · BLOCKED if Resend DNS still pending (document).
4. Land on /home (exec). Note join code: Settings → Invites.

════════════════════════════════════════
C) SECOND DEVICE JOIN (Browser B)
════════════════════════════════════════
1. Fresh profile → /join/{code} or onboarding Join.
2. OTP if required; role must NOT become President by default.
3. Verify same chapter designation; roster shows founder + joiner.
4. FAIL if joiner can self-assign President via Settings without seat.

════════════════════════════════════════
D) CHAPTER SETUP + FEATURE FLAGS (Browser A)
════════════════════════════════════════
/chapter-setup:
- [ ] Edit designation/university; save
- [ ] Ensure ALL features ON for this pass:
      announcements, roster, calendar, recruitment, standards, dues, budgets,
      studyHours, house, tables, committees, bylaws, execSlides, attendancePoints
- [ ] Assign seats: Treasurer, Recruitment Chair, Scholarship Chair (or closest),
      J-Board / Standards chair if available; VP + Secretary seats if listed
- [ ] Assign one editor capability (e.g. editCalendar) to the Browser B member
- [ ] Copy join code again from Settings → Invites

Then briefly toggle ONE feature OFF (e.g. house), hit /house → must redirect home (no crash), turn it back ON.

════════════════════════════════════════
E) EVERY FEATURE — EXEC HAPPY PATH (Browser A)
════════════════════════════════════════
Work top-to-bottom. Create real rows; note IDs/names for later checks.

1. /home — exec dashboard loads; no console crash
2. /announcements — create post; optional poll or signup if UI allows
3. /members — add 2 roster members (Active + New Member); open /members/:id; edit a field
4. /calendar — create required event (points > 0) + optional social event
5. /events/:id — RSVP as founder; submit excuse path if shown; open Roll call; mark Present/Absent
6. /events/:id → QR check-in tab — Open QR check-in; confirm rotating code + QR image; leave session open for step F
7. /attendance — standing list loads; open latest meeting; QR CTA works
8. /excuses — approve or deny any pending excuse (create one from Browser B if empty)
9. /library-hours — add/verify a study location or log if officer tools exist
10. /dues — add a charge to a member; record a payment/link; member balance updates
11. /budgets — create/open a budget; add a line or expense if UI allows
12. /tables — create/open a form or guest list; edit a cell; sync if offered
13. /recruitment — add a PNM; move stage on /recruitment/pipeline; open /recruitment/pnm/:id
14. /standards — open/create a case or note; /standards/setup if needed; /judicial-board if routed
15. /committees — create committee; add member; open /committees/:id
16. /house — create a chore/task; mark done
17. /bylaws — open/add document or section
18. /chapter-meeting or /exec-slides — open deck / meeting UI without crash
19. /settings — account save; Invites tab; Admin → confirm Wipe button visible (do NOT wipe yet)
20. /profile — edit display name; save
21. /my-dashboard + /chapter-room — member surfaces load for founder

════════════════════════════════════════
F) MEMBER PATH + QR (Browser B)
════════════════════════════════════════
- [ ] /my-dashboard loads as Active Member
- [ ] RSVP to calendar event
- [ ] Submit excuse if not already
- [ ] Log study hours from member UI if present
- [ ] Scan or open QR URL from founder’s check-in (code + ch= params) → /check-in/:eventId → Present recorded (source check_in)
- [ ] Confirm chapter mismatch: if ch= is wrong, error — no silent check-in
- [ ] Dues balance visible (pay link OK; not a card processor)
- [ ] Cannot access /chapter-setup destructive admin without permission

════════════════════════════════════════
G) GUEST DEMO ISOLATION (optional mini-pass)
════════════════════════════════════════
Browser A only after saving that wipe will restore path:
1. Note you are about to enter demo — prefer a third profile if possible.
2. /demo or /preview → enter guest → Officer Home loads (no seat-key crash).
3. Spot-check calendar + attendance in demo.
4. Exit demo / leave guest preview.
5. Confirm real smoke chapter still present (not wiped by demo). FAIL if real chapter data gone.

════════════════════════════════════════
H) PERSISTENCE
════════════════════════════════════════
- Hard refresh Browser A — roster, event, announcement, dues charge still present.
- Browser B refresh — still in same chapter.

════════════════════════════════════════
Z) WIPE CLEAN (REQUIRED)
════════════════════════════════════════
Goal: no leftover smoke chapter data in this browser; leave cloud memberships for smoke users.

Browser A (President):
1. Settings → Admin → **Wipe test chapter data** (calls wipeLocalAndLeaveCloudChapters + leave_all_chapters RPC).
2. Confirm redirect to /onboarding and empty local chapter state.
3. Sign out if still authenticated (Settings → Sign out) when testing fully cold start.

Browser B:
1. Same wipe OR sign out + clear site data for the origin.
2. Confirm /onboarding empty; join code from smoke chapter no longer hydrates this browser.

Optional cloud hygiene (agent with SUPABASE_ACCESS_TOKEN, only if smoke created cloud rows):
- Do NOT delete unrelated chapters.
- If a smoke chapter row remains and you have a documented admin SQL path, remove ONLY designation matching Smoke-* after confirming id. Prefer leave_all_chapters via UI wipe first.
- Re-run: npm run verify-supabase

Record wipe PASS/FAIL in SMOKE-TEST-RESULTS.md.

════════════════════════════════════════
DONE WHEN
════════════════════════════════════════
- Checklist logged with PASS/FAIL/BLOCKED
- Every feature route in section E touched
- Join + QR member path attempted
- Wipe clean completed on A and B
- Report: counts of PASS/FAIL/BLOCKED, Resend/OTP status, top failures only

Start at A) PREFLIGHT now. Pause only for human OTP / DNS / click confirmation.
```

---

## Wipe reference (product)

| Action | Where |
|--------|--------|
| Wipe local + leave cloud memberships | Settings → Admin → **Wipe test chapter data** |
| Implementation | `wipeLocalAndLeaveCloudChapters()` in `src/lib/chapterCloud.ts` (`leave_all_chapters` RPC + clear `chapter-os-*` keys) |
| Guest demo exit | Exit demo / leave guest preview — must not destroy a real session backup |

## Related

- Longer matrix: [`SMOKE-TEST-10-CHAPTERS.md`](./SMOKE-TEST-10-CHAPTERS.md)
- Pilot blockers: [`PILOT-READY.md`](./PILOT-READY.md)
