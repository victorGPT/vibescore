# Requirement Analysis

## Goal
- Add pagination to DETAILS for `day` and `total`, hide future buckets, and trim pre-collection months for `total` only.

## Scope
- In scope:
  - DETAILS table row filtering and pagination logic for `day` and `total` periods.
  - Trim leading months before the first collected bucket in `total`.
  - Unit/regression tests for detail-row trimming and pagination.
- Out of scope:
  - Backend API changes.
  - New UI copy strings (reuse existing pagination copy keys).
  - Changes to other periods (`week`, `month`) unless needed for consistency.

## Users / Actors
- Authenticated dashboard users viewing DETAILS.

## Inputs
- Dashboard period (`day`, `week`, `month`, `total`).
- DETAILS rows from `useUsageData` / `useTrendData`, including `missing`/`future` flags and token fields.

## Outputs
- DETAILS table rows (paged) and pagination controls.

## Business Rules
- Page size is 12 rows for `day` and `total`.
- Future buckets are never displayed.
- Only `total` trims leading months before the first collected bucket.
- `day` does not trim missing or zero buckets.
- Sort order remains effective, and page resets on period/sort changes.

## Assumptions
- `future` and `missing` flags are reliable for day-range rows; monthly/hourly rows may not include `missing`.
- “First collected month” is inferred as the first month with any non-zero token value, because monthly API returns a fixed window with zero-filled buckets.
- We only trim leading months before the first collected bucket, not interior gaps.

## Dependencies
- `dashboard/src/pages/DashboardPage.jsx`
- Detail sort utilities and any new helper for trimming/pagination
- Existing pagination copy keys in `dashboard/src/content/copy.csv`

## Risks
- Ambiguity of “unused” (zero vs missing). Could affect visible rows.
- Timezone boundary edge cases when identifying first usage bucket.
