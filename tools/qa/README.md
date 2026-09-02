# QA / dev-only scripts

These scripts are **not** wired into `package.json` or CI. They are kept for local stress-testing and coverage audits during development.

| Script | Purpose |
|--------|---------|
| `scripts/pipeline-coverage.mjs` | End-to-end pipeline audit against a running dev server |
| `scripts/semester-simulation.mjs` | Playwright semester simulation (requires `npm run dev`) |
| `scripts/fetch-missing-crests.mjs` | One-off crest asset fetch helper |

**Playwright** remains a devDependency because `scripts/smoke-test.mjs` and `scripts/seed-supabase-chapter.mjs` use it.

Companion docs: `docs/QA-STRESS-TEST.md`, `docs/SEMESTER-SIMULATION-REPORT.md` (historical reports).
