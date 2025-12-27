# Acceptance Criteria

## Feature: Dashboard function path compatibility

### Requirement: Prefer `/functions` and fallback on 404
- Rationale: Browser clients must call `/functions`, with `/api/functions` only as a 404 fallback.

#### Scenario: 404 triggers legacy retry
- WHEN the dashboard requests `usage-summary` via `/functions/vibescore-usage-summary`
- AND the gateway responds with HTTP 404
- THEN the dashboard SHALL retry once using `/api/functions/vibescore-usage-summary`
- AND the response data SHALL be used if the legacy path succeeds

### Requirement: Non-404 errors do not fallback
- Rationale: Unauthorized or server errors should surface without hidden retries.

#### Scenario: 401 does not retry
- WHEN the dashboard requests `usage-summary` via `/functions/vibescore-usage-summary`
- AND the gateway responds with HTTP 401
- THEN the dashboard SHALL NOT retry `/api/functions/...`
- AND the original error SHALL be surfaced

### Requirement: Backend probe follows the same path policy
- Rationale: Health checks should not report false-down due to path mismatch.

#### Scenario: Probe succeeds after fallback
- WHEN the backend probe receives HTTP 404 from `/functions/vibescore-usage-summary`
- AND the legacy path `/api/functions/vibescore-usage-summary` succeeds
- THEN the probe SHALL report status `active`
