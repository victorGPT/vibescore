# Postmortem: PR-95 Rolling Usage Churn
Report date (YYYY-MM-DD): 2026-02-01
Owner: codex
Audience: delivery team, engineering leads

## 1. Scope
- In scope: rolling usage summary (last_7d/last_30d/avg_day), active day logic, rollup/hourly mixing, timezone handling
- Out of scope: unrelated UI modules, non-rolling usage endpoints
- Time window (YYYY-MM-DD -> YYYY-MM-DD): 2026-01-26 -> 2026-01-31

## 2. Goals & Plan (Before)
- Intended outcomes: ship rolling usage metrics with correct local-day behavior and tests
- Planned milestones (each YYYY-MM-DD):
  - 2026-01-26: plan + design docs finalized
  - 2026-01-31: implement, test, PR review, merge
- Key assumptions:
  - Rolling windows respect tz/tz_offset_minutes like the rest of summary
  - Active days align with local day boundaries

## 3. Outcome vs Plan
- What shipped: rolling usage summary with local-day windowing, active-day fixes for rollup/hourly, and regression tests
- Deviations/gaps: multiple Codex review cycles required to cover timezone/rollup edge cases
- Metric deltas (if any): review churn cycles = 6 @codex requests on the PR

## 4. Impact
- User/customer impact: none
- Business/ops impact: review latency and engineering time to address edge cases
- Duration: ~2 hours on 2026-01-31

## 5. Timeline (Detection -> Mitigation -> Resolution)
- Detection date (YYYY-MM-DD): 2026-01-31 (first Codex feedback on rolling window tz)
- Mitigation date (YYYY-MM-DD): 2026-01-31 (iterative fixes + tests added)
- Resolution date (YYYY-MM-DD): 2026-01-31 (Codex approval + merge)

## 6. Evidence
- PR links: https://github.com/victorGPT/vibeusage/pull/95
- Codex review cycles: review thread comments with timestamps 2026-01-31T19:04Z -> 2026-01-31T20:57Z
- Incidents/alerts: none
- Repro steps/tests: node --test test/edge-functions.test.js --test-name-pattern="rolling"

## 7. Root Causes (with Stage Attribution)
- Cause: Rolling window bounds and active-day bucketing initially assumed UTC day boundaries for rollups and hourly data.
- Stage (Primary): Implementation
- Stage (Secondary): Testing
- Identified date (YYYY-MM-DD): 2026-01-31
- Evidence: Codex review threads on tz window bounds, active-day bucketing, rollup/hourly fallback handling

## 8. Action Items (Owner + Due Date)
- [ ] Add non-UTC tz boundary cases to Risk Layer Addendum and testing checklist (Owner: codex, Due 2026-02-05)
- [ ] Add a rolling-usage preflight note: "active_days must be local-day aligned" in PR template or checklist (Owner: codex, Due 2026-02-05)
- [ ] Add a regression test template for rollup-empty hourly fallback (Owner: codex, Due 2026-02-05)

## 9. Prevention Rules
- Rule: Any rolling window feature must include local-day alignment tests (tz_offset_minutes and IANA tz) and rollup/hourly fallback coverage.
- Enforcement: Risk Layer Addendum required for rolling/timezone changes.
- Verification: Presence of tests matching rolling tz and rollup fallback cases in test/edge-functions.test.js.

## 10. Follow-up
- Checkpoint date (YYYY-MM-DD): 2026-02-08
- Success criteria: new rolling/timezone changes pass with <=1 Codex cycle and no new timezone edge case feedback.
