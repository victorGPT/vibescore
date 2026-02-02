# Postmortem: Project Usage Aggregate Query Failure
Report date (2026-02-02):
Owner: Victor
Audience: Delivery team, engineering leads, stakeholders

## 1. Scope
- In scope: `vibeusage-project-usage-summary` edge function; PostgREST aggregate query syntax.
- Out of scope: DB schema changes, CLI ingestion, unrelated dashboard modules.
- Time window (2026-02-02 → 2026-02-02):

## 2. Goals & Plan (Before)
- Intended outcomes: return project usage totals via aggregate query.
- Planned milestones (each YYYY-MM-DD):
  - 2026-01-31: introduce summary endpoint and aggregation logic.
  - 2026-02-02: stabilize and validate.
- Key assumptions:
  - PostgREST accepts `column.sum()` aggregation syntax.
  - Fallback triggers only on “aggregate functions is not allowed”.

## 3. Outcome vs Plan
- What shipped: aggregation query using `column.sum()` with fallback for blocked aggregates.
- Deviations/gaps: production rejected `column.sum()` with schema-cache relationship error; fallback did not cover this error signature.
- Metric deltas (if any): N/A (no telemetry provided).

## 4. Impact
- User/customer impact: Project usage summary endpoint returned 500 for affected requests; dashboard card could fail to render.
- Business/ops impact: support/debug time; delayed visibility.
- Duration: unknown; detected 2026-02-02, mitigated same day.

## 5. Timeline (Detection → Mitigation → Resolution)
- Detection date (2026-02-02):
- Mitigation date (2026-02-02): switch to `sum(column)` and extend fallback match.
- Resolution date (2026-02-02): deploy updated edge function via Insforge2 MCP.

## 6. Evidence
- Error signature: “Could not find a relationship between 'vibeusage_project_usage_hourly' and 'sum' in the schema cache”.
- Code path: `insforge-src/functions/vibeusage-project-usage-summary.js`.
- Tests: `test/edge-functions.test.js` (aggregate syntax + fallback coverage).

## 7. Root Causes (with Stage Attribution)
- Cause: Aggregate syntax assumption (`column.sum()`) incompatible with production PostgREST parser; fallback match too narrow.
- Stage (Primary): Implementation
- Stage (Secondary): Testing, Release/Integration
- Identified date (2026-02-02):
- Evidence: error signature + failing behavior in production + updated tests.

## 8. Action Items (Owner + Due Date)
- [ ] Add Insforge2 smoke test for `/functions/vibeusage-project-usage-summary` (Owner: Victor, Due 2026-02-05).
- [ ] Introduce shared helper for aggregate select strings and ban `column.sum()` usage (Owner: Victor, Due 2026-02-07).
- [ ] Document aggregate query contract and fallback error signatures in `AGENTS.md` (Owner: Victor, Due 2026-02-02).

## 9. Prevention Rules
- Rule: Aggregates must use `sum(column)` only.
- Enforcement: Unit test assertions + code review checklist + optional lint rule.
- Verification: CI test for select string and Insforge2 smoke check.

## 10. Follow-up
- Checkpoint date (2026-02-07):
- Success criteria: smoke test passes in production-like environment; no schema-cache aggregate errors observed.
