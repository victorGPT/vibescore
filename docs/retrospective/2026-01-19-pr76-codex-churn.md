# PR Retrospective: #76 Soft Session Expiry Churn (2026-01-19)

## Summary
- Codex review surfaced multiple session-refresh edge cases: retry/backoff after refresh, soft-expired marking rules, dashboard routing for soft-expired sessions, and stale token retries after refresh.
- Fixes landed across multiple cycles to align refresh behavior with retryability and UI gating.

## Evidence
- Codex review thread comments (2026-01-19) on:
  - refresh retry/backoff handling
  - soft-expired marking scope
  - dashboard gate for soft-expired sessions
  - stale token reuse after refresh
- Fix commits:
  - `6ac1c89` retry after refresh retry errors.
  - `02d3080` guard soft-expired after refresh.
  - `24e72ab` keep soft-expired users in dashboard.
  - `895c523` reuse refreshed token for retries.

## Stage Attribution
- Primary: Implementation
- Secondary: Testing

## Cause Taxonomy
- Implementation Drift: refresh retry path diverged from standard retry/backoff and token handling, and UI gate missed soft-expired state.
- Test Gap: missing regression coverage for refresh-success + retryable failure paths and soft-expired routing.

## Preventive Actions
- Encode refresh + retry invariants in tests (refresh success + 5xx retry, soft-expired routing).
- Keep a single active token source for all retries after refresh.
- Include refresh/soft-expired edge cases in PR risk-layer addendum when touching auth flows.

## Notes
- Codex review cycle count: 5 (initial review → fixes → re-review cycles).
