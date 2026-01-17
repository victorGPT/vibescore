# Change: Paginate DETAILS (day/total) and trim unused history

## Why
- The DETAILS table currently paginates only `total` and still renders leading unused rows, which makes early history noisy and harder to scan.
- Users expect the DETAILS view to focus on actual usage and exclude empty history before their first activity, while still avoiding future data.

## What Changes
- Add pagination for DETAILS when period is `day` or `total` (12 rows per page).
- Trim leading buckets before the first collected month in DETAILS for `total` only.
- Keep day/hour buckets intact (missing or zero remain visible).
- Keep existing rule: do not display future buckets.

## Impact
- Affected specs: `vibeusage-tracker`
- Affected code: `dashboard/src/pages/DashboardPage.jsx`, new/updated detail-row helper (if introduced), dashboard tests under `test/`
- **BREAKING**: none

## Architecture / Flow
- Build DETAILS rows -> remove future buckets -> trim leading months before first non-zero usage (total only) -> sort -> paginate (12 rows).
- “First non-zero usage month” is inferred from monthly buckets because the API returns a fixed window with zero-filled months.

## Risks & Mitigations
- Risk: Fixed-window backfills may still include long zero stretches after the first collected bucket.
  - Mitigation: only trim leading months before the first collected bucket; keep interior gaps to signal unsynced/zero data.
- Risk: time-zone boundaries may shift the first usage bucket.
  - Mitigation: rely on backend-provided buckets and existing `future` flags; compare by bucket order, not by new date arithmetic.

## Rollout / Milestones
- M1 Requirements & Acceptance
- M2 OpenSpec proposal + spec deltas
- M3 Unit tests for trimming/pagination helpers
- M4 Regression verification (dashboard details view)
