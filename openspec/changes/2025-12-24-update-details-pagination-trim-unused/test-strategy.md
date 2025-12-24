# Test Strategy

## Objectives
- Verify DETAILS pagination for `day` and `total` (12 rows per page).
- Verify future buckets are excluded.
- Verify months before first non-zero usage are trimmed for `total` only.
- Verify missing/zero buckets are preserved within collected ranges.

## Test Levels
- Unit:
  - Trim leading-unused logic on synthetic hourly/monthly rows.
  - Pagination slicing with page size 12.
- Integration:
  - Dashboard details row pipeline (filter → sort → paginate) via pure helper or module-level function.
- Regression:
  - Node test that reproduces the “pre-usage history visible” bug and validates the fix.

## Test Matrix
- Pagination day/total -> Unit -> `test/details-pagination.test.js` -> node:test output
- Trim pre-collection months (total) -> Unit -> `test/details-trim.test.js` -> node:test output
- Preserve missing/zero buckets -> Unit -> `test/details-trim.test.js` -> node:test output
- Future exclusion -> Unit -> `test/details-trim.test.js` -> node:test output

## Environments
- Local node:test (no browser dependency).

## Automation Plan
- Add node:test cases under `test/` using ESM dynamic imports of dashboard helpers.

## Entry / Exit Criteria
- Entry: OpenSpec change approved; helper function location decided.
- Exit: New tests pass and regression scenario covered.

## Coverage Risks
- If DETAILS logic stays inline in `DashboardPage.jsx`, testing may be harder without a helper.
