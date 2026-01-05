## 1. Spec & design
- [x] Confirm Module Brief approval and OpenSpec change approval
- [x] Update delta spec and run `openspec validate 2026-01-02-add-usage-rollup --strict`

## 2. Database schema & rollup
- [x] Add SQL: create `vibescore_tracker_daily_rollup` with indexes + unique constraint
- [x] Add SQL: trigger + function to apply rollup deltas on `vibescore_tracker_hourly`
- [x] Add SQL: backfill/rebuild function for rollup safety
- [x] Add rollback SQL for the new table/trigger/function

## 3. Backend logic
- [x] Add rollup query helpers (full-day rollup + boundary-hour sums)
- [x] Update `vibescore-usage-summary` to use rollup strategy and log `agg_hit`
- [x] Update `vibescore-usage-daily` to include backend `summary` and use rollup for UTC path

## 4. Frontend
- [x] Update `useUsageData` to use backend summary when daily data is present
- [x] Remove local summary aggregation from the dashboard hot path

## 5. Tests & docs
- [x] Add acceptance test for rollup summary correctness
- [x] Update `docs/dashboard/api.md` and `BACKEND_API.md`
- [x] Run regression commands and record results

Notes:
- 2026-01-02: `node scripts/acceptance/usage-summary-hourly.cjs` (pass)
- 2026-01-02: `node scripts/acceptance/usage-daily-summary.cjs` (pass)
