# Test Strategy

## Objectives
- Verify public-only gating, pending/blocked handling, and project-only purge.

## Test Levels
- Unit:
  - Remote parsing + canonicalization.
  - GitHub verification response handling.
  - Project state transitions (pending/blocked/public).
  - Purge scope isolation (project-only).
- Integration:
  - CLI parser emits project buckets only when public.
  - Uploader sends project buckets only when public.
  - Ingest rejects non-public payloads.
- Regression:
  - System totals unaffected by project purge.
- Performance:
  - N/A (no runtime-critical path changes beyond small API checks).

## Test Matrix
- Public verification -> Unit + Integration -> CLI/lib + ingest -> test files
- Pending/blocked -> Unit -> CLI/lib -> new tests
- Purge isolation -> Unit + Integration -> CLI/lib + local data -> new tests

## Environments
- Local Node test runner (existing test harness).

## Automation Plan
- Add unit tests to `test/` for rollout project gating and purge.
- Add ingest validation tests if existing harness supports it.

## Entry / Exit Criteria
- Entry: Updated design + OpenSpec deltas approved.
- Exit: All new tests pass; existing suite unaffected.

## Coverage Risks
- GitHub API live behavior not tested; use deterministic fixtures.
