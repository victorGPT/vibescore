# Postmortem: PR92 codex review churn
Report date (YYYY-MM-DD): 2026-01-31
Owner: codex
Audience: delivery team, engineering leads

## 1. Scope
- In scope: PR #92 (project usage summary fixes + dashboard project card adjustments)
- Out of scope: unrelated graph auto-index changes already in main
- Time window (YYYY-MM-DD -> YYYY-MM-DD): 2026-01-27 -> 2026-01-31

## 2. Goals & Plan (Before)
- Intended outcomes:
  - Fix project_hourly ingest test expectations.
  - Keep project usage summary accurate (ordering + billable totals).
  - Avoid canary data pollution in default summary results.
- Planned milestones (each YYYY-MM-DD):
  - 2026-01-27: initial PR created and tests updated.
  - 2026-01-31: address review feedback and merge.
- Key assumptions:
  - project usage summary table columns match filter helpers.
  - billable totals are present or safely fallback only when missing.

## 3. Outcome vs Plan
- What shipped:
  - Project usage summary ordering by billable totals, billable fallback only on null.
  - Billable totals computed for project_hourly ingest rows.
  - Source-only canary filter to avoid invalid model filter.
  - Dashboard project usage cards adjusted to GitHub-style layout.
- Deviations/gaps:
  - Multiple review cycles to correct data contract and canary filtering.
- Metric deltas (if any):
  - Review cycles: 6 @codex review requests before final thumbs-up.

## 4. Impact
- User/customer impact:
  - Interim risk of incorrect project usage ranking or 500s on summary queries.
- Business/ops impact:
  - Review churn increased cycle time and required extra verification.
- Duration:
  - 2026-01-31 (same-day resolution).

## 5. Timeline (Detection -> Mitigation -> Resolution)
- Detection date (YYYY-MM-DD): 2026-01-31 (P1/P2 review threads opened)
- Mitigation date (YYYY-MM-DD): 2026-01-31 (code changes + tests)
- Resolution date (YYYY-MM-DD): 2026-01-31 (PR merged)

## 6. Evidence
- PR link: https://github.com/victorGPT/vibeusage/pull/92
- Codex review cycles: multiple @codex review comments + final thumbs-up
- Review threads:
  - Order by billable totals, preserve real zero billable totals
  - Exclude canary source rows
  - Remove model filter for project usage table
- Tests run (local):
  - node --test test/*.test.js (earlier verification in PR context)
  - npm test -- src/ui/matrix-a/components/__tests__/ProjectUsagePanel.test.jsx

## 7. Root Causes (with Stage Attribution)
- Cause: project usage summary ordering and billable totals not aligned with data contract (billable default 0 vs real totals).
  - Stage (Primary): Design
  - Stage (Secondary): Testing
  - Identified date (YYYY-MM-DD): 2026-01-31
  - Evidence: review threads on billable ordering + fallback behavior
- Cause: applyCanaryFilter assumed a model column exists for project usage table.
  - Stage (Primary): Implementation
  - Stage (Secondary): Testing
  - Identified date (YYYY-MM-DD): 2026-01-31
  - Evidence: review thread noting missing model column and 500 risk

## 8. Action Items (Owner + Due Date)
- [ ] Add contract test for project usage summary ordering and billable fallback (Owner: codex, Due 2026-02-05)
- [ ] Add schema-aware canary filter helper (Owner: codex, Due 2026-02-05)
- [ ] Add regression test for project usage summary when source is absent (Owner: codex, Due 2026-02-05)

## 9. Prevention Rules
- Rule: Any usage-summary query must assert table columns used in filters.
  - Enforcement: test helper that fails fast on missing columns
  - Verification: CI test covers project usage summary query
- Rule: Billable totals fallback only when null, never when zero.
  - Enforcement: unit test for resolveBillableTotal behavior
  - Verification: tests in edge-functions suite

## 10. Follow-up
- Checkpoint date (YYYY-MM-DD): 2026-02-05
- Success criteria:
  - Contract tests added and passing
  - No new Codex churn on similar summary endpoints
