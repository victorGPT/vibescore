# 2025-12-24-update-details-pagination-trim-unused 任务清单

## 1. Spec & Planning
- [x] 1.1 Confirm definition of “unused” (total trims before first non-zero month; day keeps missing/zero).
- [x] 1.2 Finalize OpenSpec proposal + spec delta.
- [x] 1.3 Run `openspec validate 2025-12-24-update-details-pagination-trim-unused --strict`.

## 2. Implementation
- [x] 2.1 Add helper to trim leading unused rows and paginate by page size (12).
- [x] 2.2 Apply pagination to DETAILS for `day` and `total` in `DashboardPage.jsx`.
- [x] 2.3 Ensure future buckets stay excluded in DETAILS.
- [x] 2.4 Reset page index on period/sort changes for both `day` and `total`.

## 3. Tests
- [x] 3.1 Add unit tests for trimming logic (future + leading unused).
- [x] 3.2 Add unit tests for pagination slicing (12 rows per page).
- [x] 3.3 Run `node --test test/details-*.test.js` and record results.

## 4. Docs & Evidence
- [x] 4.1 Update `openspec/specs/vibeusage-tracker/evidence.md` with implementation + verification.
