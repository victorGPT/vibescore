# Change: Add weekly leaderboard MVP

## Ownership
- Owner: Victor
- Status: Proposal (not approved)

## Why
- Provide a lightweight weekly leaderboard experience to increase engagement without exposing PII.
- Align leaderboard token accounting with the existing GPT vs Claude standards and make the contract end-to-end verifiable.

## What Changes
- Database:
  - Extend `vibeusage_leaderboard_snapshots` to store `gpt_tokens` and `claude_tokens`.
  - Replace `vibeusage_leaderboard_source_week` to compute weekly totals from `vibeusage_tracker_hourly` (exclude `source='canary'`, exclude `model='unknown'`).
  - Update SECURITY DEFINER leaderboard functions/views to use the same hourly-based accounting.
  - Add an index on `vibeusage_tracker_hourly(hour_start)` to support weekly global scans.
- Backend:
  - Restrict `GET /functions/vibeusage-leaderboard` to `period=week` only.
  - Add pagination via `limit` + `offset`, and include pagination metadata in the response.
  - Return `gpt_tokens`, `claude_tokens`, and `total_tokens` for `entries` and `me`.
  - Restrict `POST /functions/vibeusage-leaderboard-refresh` to `week` only and refresh only weekly snapshots.
- Dashboard:
  - Add a `/leaderboard` page with:
    - Sticky “My Rank” card (rank stays real rank even when injected).
    - Top 10 panel with `Top9 + Me` injection when the user is not in Top 10.
    - Paginated full table with columns: `Rank / User / Total / GPT Model / Claude Model`.
  - Add a header link to `/leaderboard`.
- Copy:
  - Register all new leaderboard UI strings in `dashboard/src/content/copy.csv`.

## Scope
IN:
- Signed-in weekly leaderboard (UTC calendar week, Sunday start) in the dashboard.
- Pagination (`limit` + `offset`) and `Top9 + Me` injection UX.
- GPT/Claude breakdown columns and total ordering by `total_tokens`.

OUT:
- Unauthenticated/public leaderboard pages.
- Social sharing / deep-linking to a specific rank.
- Multi-period selector beyond `week`.
- Leaderboard privacy toggle UI (backend setting endpoint remains supported).

## Open Questions
- Should the UI label the week basis explicitly as `UTC (Sunday start)` to avoid confusion with dashboard usage periods?
- Should we later add a “previous week” picker, or keep MVP strictly “current week only”?

## Impact
- Affected specs: `vibeusage-tracker`
- Affected code: `insforge-src/functions/vibeusage-leaderboard.js`, `insforge-src/functions/vibeusage-leaderboard-refresh.js`, `dashboard/src/**`, `dashboard/src/content/copy.csv`
- Risks:
  - Week boundary/timezone confusion -> mitigate by displaying `from/to` (UTC) and a clear label.
  - Privacy leakage -> enforce a strict allowlist of output fields and avoid rendering any PII in the UI.
  - Performance regression on refresh -> mitigate by adding `hour_start` index and using snapshots for reads.
