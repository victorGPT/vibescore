# Design: Daily rollup for usage summary

## Overview
Add a UTC daily rollup table derived from `vibescore_tracker_hourly` and use it to answer summary queries efficiently. Rollups are maintained by a Postgres trigger so totals remain correct after upserts. Summary queries combine rollup totals for full UTC days with boundary-hour sums, preserving half-hour freshness and exact correctness.

## Data model
**Table:** `vibescore_tracker_daily_rollup`

- `user_id` (uuid, not null)
- `day` (date, UTC, not null)
- `source` (text, not null)
- `model` (text, not null)
- `total_tokens` / `input_tokens` / `cached_input_tokens` / `output_tokens` / `reasoning_output_tokens` (bigint, not null)
- `updated_at` (timestamptz, not null default now())

Constraints:
- Primary key: (`user_id`, `day`, `source`, `model`)
- Index: (`user_id`, `day`), (`user_id`, `source`, `model`, `day`)

## Rollup maintenance (trigger)
- Trigger on `vibescore_tracker_hourly` **AFTER INSERT OR UPDATE OR DELETE**.
- Compute `delta = NEW - OLD` (or insert/delete equivalent).
- Apply `INSERT ... ON CONFLICT DO UPDATE` to add delta into rollup row for the UTC `day`.
- This keeps rollups idempotent and correct even when hourly buckets are upserted.

## Summary query algorithm
1) Convert requested local date range to UTC `startIso` and `endIso`.
2) If `startIso` and `endIso` are on the same UTC day: aggregate directly from hourly within `[startIso, endIso)`.
3) Otherwise:
   - Boundary A: `[startIso, startDay+1)` from hourly.
   - Boundary B: `[endDay, endIso)` from hourly.
   - Full days: `(startDay+1 .. endDay-1)` from rollup.
4) Sum all components to produce totals; compute `total_cost_usd` and pricing metadata as today.

## Daily endpoint behavior
- For UTC timezone requests, daily buckets can be read directly from the rollup table.
- For non-UTC, keep hourly scan for correct local day boundaries.
- Always include backend-computed `summary` in daily response so the dashboard never computes totals locally.

## Replay plan
- Provide a SQL function to rebuild rollups for a user/day range from the hourly fact table.
- This allows safe repair or backfill without changing the fact table.
