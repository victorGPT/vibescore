# Verification Report

## Scope
- Default max-day guardrail change to 800 days.
- Documentation updates and regression coverage.

## Tests Run
- `node --test test/edge-functions.test.js --test-name-pattern="getUsageMaxDays defaults to 800 days"` (PASS)
- `npm test` (PASS)
- `curl -s -H "Authorization: Bearer <REDACTED>" "https://5tmappuk.us-east.insforge.app/functions/vibescore-usage-summary?from=2024-02-01&to=2026-01-01"` (200)
- `curl -s -H "Authorization: Bearer <REDACTED>" "https://5tmappuk.us-east.insforge.app/functions/vibescore-usage-summary?from=2023-01-01&to=2026-01-01"` (400)

## Results
- Default max-day test passed after updating `getUsageMaxDays()` to 800.
- Full test suite passed locally.
- Production acceptance checks passed:
  - 24-month range returned `200` with totals.
  - Oversized range returned `400` with `max 800 days` error.

## Evidence
- Local test output recorded in CLI session (2026-01-01).
- Test command log: `npm test` exit code 0.
- Production curl outputs captured in CLI session (2026-01-01).

## Remaining Risks
- Larger default range may increase query latency on production workloads.
- Monitor for increased query latency under peak load; reduce `VIBESCORE_USAGE_MAX_DAYS` via env override if needed.
