# Test Strategy

## Objectives
- Validate dashboard prefers `/functions` and safely falls back to `/api/functions` on 404.
- Prevent regressions where non-404 errors are masked by retry.
- Ensure backend probe reflects true availability.

## Test Levels
- Unit: resolver behavior + fallback policy.
- Integration: curl against gateway paths (401 vs 404 behavior).
- Regression: dashboard refresh path with a signed-in session or mock mode.
- Performance: Not applicable (single extra request only on 404).

## Test Matrix
- Prefer `/functions` + fallback on 404 -> Unit + Integration -> FE -> Node test + curl logs
- Non-404 errors do not fallback -> Unit -> FE -> Node test
- Probe uses same policy -> Regression -> FE -> dashboard refresh observation

## Environments
- Local dev (`vite`), and target gateway base URL used by dashboard.

## Automation Plan
- Add Node test for resolver behavior (`node --test`).
- Manual curl for gateway reachability to capture status codes.

## Entry / Exit Criteria
- Entry: Proposal approved; spec delta validated.
- Exit: Unit test passes; manual curl recorded; dashboard loads usage without 404 errors.

## Coverage Risks
- Gateway behavior may differ across regions; manual validation needed per environment.
