# Change: Add daily rollup for backend usage summary

## Why
- Move total token aggregation to the backend while keeping half-hour freshness.
- Reduce summary query load for large date ranges (e.g., 365 days).
- Preserve correctness by deriving totals from the hourly fact table.

## What Changes
- Add a UTC daily rollup table keyed by `user_id + day + source + model`.
- Maintain rollups via database-triggered, idempotent delta updates on the hourly fact table.
- Compute `GET /functions/vibescore-usage-summary` using rollup rows plus boundary-hour sums.
- Extend `GET /functions/vibescore-usage-daily` to return backend-computed `summary` so the dashboard never computes totals locally.
- Update dashboard data hook to use backend totals exclusively.
- Update API docs and specs to reflect the new contract.

## Impact
- Affected specs: `vibeusage-tracker`
- Affected code:
  - `insforge-src/functions/vibescore-usage-summary.js`
  - `insforge-src/functions/vibescore-usage-daily.js`
  - `dashboard/src/hooks/use-usage-data.js`
- Database:
  - New table `vibescore_tracker_daily_rollup`
  - Trigger + function to keep rollups in sync
  - Backfill/rebuild procedure
