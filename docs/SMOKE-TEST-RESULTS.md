# Smoke Test Results

**Run:** 2026-09-02T17:54:38.500Z  
**Mode:** Real chapter build (no demo seed / no localStorage feature hacks)  
**Supabase:** yes (SMOKE_WITH_SUPABASE=1)  
**Base URL:** http://localhost:5174  
**Summary:** 11 PASS · 2 FAIL · 0 BLOCKED · 13 total

## Phase 0 — Validation

| Test | Status | Detail |
|------|--------|--------|
| Invalid join code rejected | PASS |  |

## Iota — Cross-device

| Test | Status | Detail |
|------|--------|--------|
| Clear storage + start onboarding | PASS |  |
| Found chapter as President | PASS | http://localhost:5174/home |
| Primary join code issued | PASS | CHAPTER-JOIN-KKPMCC |
| Invite link prefills onboarding | PASS | CHAPTER-JOIN-KKPMCC |
| Chapter setup (profile, features, seats) | PASS |  |
| Post announcement | PASS |  |
| Schedule event | PASS |  |
| Add study location | PASS |  |
| Visit announcements | PASS | http://localhost:5174/announcements |
| Data persists after refresh | PASS |  |
| Joiner Jordan (cross-browser) | FAIL | Join code not in cloud — enable Anonymous auth in Supabase or sign in during onboarding |
| Joiner Taylor (cross-browser) | FAIL | Join code not in cloud — enable Anonymous auth in Supabase or sign in during onboarding |

## Failures

- **Iota — Cross-device** — Joiner Jordan (cross-browser): Join code not in cloud — enable Anonymous auth in Supabase or sign in during onboarding
- **Iota — Cross-device** — Joiner Taylor (cross-browser): Join code not in cloud — enable Anonymous auth in Supabase or sign in during onboarding
