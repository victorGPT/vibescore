## 1. Implementation
- [ ] 1.1 DB: extend `vibeusage_leaderboard_snapshots` with `gpt_tokens` + `claude_tokens` and backfill existing rows.
- [ ] 1.2 DB: add index `vibeusage_tracker_hourly(hour_start)` to support weekly refresh.
- [ ] 1.3 DB: replace `vibeusage_leaderboard_source_week` to compute weekly totals from `vibeusage_tracker_hourly` with GPT/Claude rules.
- [ ] 1.4 DB: update SECURITY DEFINER leaderboard functions and recreate weekly fallback views.
- [ ] 1.5 Backend: update `GET /functions/vibeusage-leaderboard` to `period=week` only, return `gpt_tokens/claude_tokens/total_tokens`, and support pagination (`limit` + `offset`) + metadata (`page/total_pages/...`).
- [ ] 1.6 Backend: update `POST /functions/vibeusage-leaderboard-refresh` to refresh `week` only and write the extended snapshot rows.
- [ ] 1.7 Dashboard: add `/leaderboard` page with sticky “My Rank” card, Top9+Me injection, and paginated table.
- [ ] 1.8 Dashboard: add header navigation link to `/leaderboard`.
- [ ] 1.9 Copy: add copy registry entries for the leaderboard UI.
- [ ] 1.10 Tests: update contract tests, acceptance scripts, and dashboard tests/mocks for the new leaderboard contract.

## 2. Verification
- [ ] 2.1 Run `openspec validate 2026-02-08-add-weekly-leaderboard-mvp --strict`.
- [ ] 2.2 Run unit tests: `npm test` (or the repo's canonical test command) and ensure green.
- [ ] 2.3 Run UI copy checks: `npm run validate:copy` and `npm run validate:ui-hardcode`.
- [ ] 2.4 Run acceptance scripts:
  - `node scripts/acceptance/leaderboard-limit.cjs`
  - `node scripts/acceptance/leaderboard-single-query.cjs`
  - `node scripts/acceptance/leaderboard-settings-replay.cjs`
- [ ] 2.5 Run InsForge smoke: `node scripts/smoke/insforge-smoke.cjs` and confirm `leaderboard.week` contract passes.
