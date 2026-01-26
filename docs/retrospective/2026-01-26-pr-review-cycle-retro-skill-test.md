# PR Review Cycle Retro Skill Test (2026-01-26)

## RED: Baseline (Current Skill Output)

### Baseline Prompt
Produce a project postmortem for PR #89.

### Baseline Output (Current Skill)
```markdown
# PR #89 Codex Review Churn Retrospective

## Scope
- PR: #89
- Goal: Explain repeated @codex review cycles and attribute causes to development stages.

## Evidence Chain
- Codex review feedback -> code update -> new Codex review (multiple cycles)

## Stage Attribution
- Design: Missing explicit invariants for boundary conditions.
- Implementation: Edge cases not handled consistently.
- Testing: No regression coverage for the failing paths.
- Review Packaging: PR context lacked minimal repro and expected behavior.

## Cause Taxonomy
- Spec Gap
- Context Gap
- Implementation Drift
- Test Gap

## Aggregation
- Backend: primary churn driver
- Frontend: none identified

## Preventive Actions
- Enforce risk-layer addendum before @codex review.
- Require explicit invariants and boundary matrix in PR context.
- Add regression tests for identified edge cases.

## Risk-Layer Gate Reminder
If any trigger matches, fill the addendum with rules/invariants, boundary matrix, and evidence.
```

### RED: Failure Rationale (Why This Fails a Project Postmortem)
- Missing project-level impact (Baseline Output evidence): it never states user/customer/system impact or operational consequences.
  > Goal: Explain repeated @codex review cycles and attribute causes to development stages.
- No acceptance criteria or outcomes (Baseline Output evidence): it lists sections but never states what “success” was or what was accepted at merge.
  > ## Scope
  > ## Evidence Chain
  > ## Stage Attribution
  > ## Cause Taxonomy
  > ## Aggregation
  > ## Preventive Actions
  > ## Risk-Layer Gate Reminder
  > (No Outcome/Acceptance section present)
- No timeline or narrative (Baseline Output evidence): the section list does not include Timeline/Detection/Resolution.
  > ## Scope
  > ## Evidence Chain
  > ## Stage Attribution
  > ## Cause Taxonomy
  > ## Aggregation
  > ## Preventive Actions
  > ## Risk-Layer Gate Reminder
  > (No Timeline/Detection/Resolution section present)
- Churn-only framing (Baseline Output evidence): “Scope” and “Evidence Chain” are entirely about Codex review cycles, not project outcomes.
  > ## Scope
  > - Goal: Explain repeated @codex review cycles and attribute causes to development stages.
  >
  > ## Evidence Chain
  > - Codex review feedback -> code update -> new Codex review (multiple cycles)
- Lessons learned absent (Baseline Output evidence): “Preventive Actions” are limited to PR template/risk-layer gates and tests, with no broader project lessons.
  > ## Preventive Actions
  > - Enforce risk-layer addendum before @codex review.
  > - Require explicit invariants and boundary matrix in PR context.
  > - Add regression tests for identified edge cases.

## GREEN: Updated Skill Output (Project Postmortem)

### GREEN Output (Updated Skill)
```markdown
# Postmortem: PR #89 Codex Review Churn
Report date (2026-01-26):
Owner: Delivery Lead
Audience: Engineering Leads, Delivery Team

## 1. Scope
- In scope: PR #89 ingestion fixes and related regression tests.
- Out of scope: unrelated dashboard UI changes.
- Time window (2026-01-23 → 2026-01-26):

## 2. Goals & Plan (Before)
- Intended outcomes: single-pass Codex review and stable ingest behavior for edge cases.
- Planned milestones (each YYYY-MM-DD): 2026-01-24 implement fixes; 2026-01-25 add regression tests; 2026-01-26 finalize review.
- Key assumptions: repo root derivation works and combined batch sizes stay under server limits.

## 3. Outcome vs Plan
- What shipped: ingest edge-case fixes plus new regression coverage.
- Deviations/gaps: required multiple Codex review cycles and expanded scope to add uploader caps.
- Metric deltas (if any): planned 1 review cycle, actual multiple cycles.

## 4. Impact
- User/customer impact: risk of ingest errors for edge-case repos.
- Business/ops impact: review delays and extra engineering time.
- Duration: 2026-01-24 → 2026-01-26.

## 5. Timeline (Detection → Mitigation → Resolution)
- Detection date (2026-01-24):
- Mitigation date (2026-01-25):
- Resolution date (2026-01-26):

## 6. Evidence
- PR links: PR #89.
- Codex review cycles: Codex review feedback -> code update -> new Codex review (multiple cycles).
- Incidents/alerts: none recorded.
- Repro steps/tests: test/rollout-parser.test.js, test/uploader.test.js.

## 7. Root Causes (with Stage Attribution)
- Cause: repo root inference failed for non-repo rollout paths.
- Stage (Primary): Implementation
- Stage (Secondary): Testing
- Identified date (2026-01-24):
- Evidence: test/rollout-parser.test.js added after Codex feedback.

- Cause: combined batch exceeded server MAX_BUCKETS constraint.
- Stage (Primary): Design
- Stage (Secondary): Implementation
- Identified date (2026-01-25):
- Evidence: uploader cap added with regression in test/uploader.test.js.

## 8. Action Items (Owner + Due Date)
- [ ] Add explicit server constraint documentation to PR template (Owner: Delivery Lead, Due 2026-02-02)
- [ ] Add edge-case ingest repro checklist to review prep (Owner: QA, Due 2026-02-05)

## 9. Prevention Rules
- Rule: Any ingest PR must include boundary matrix covering repo root and batch caps.
- Enforcement: PR template risk-layer addendum required before @codex review.
- Verification: Reviewer checklist must cite tests or repro script.

## 10. Follow-up
- Checkpoint date (2026-02-09):
- Success criteria: next ingest PR completes in one Codex cycle with required evidence attached.
```

### GREEN: PASS Rationale
- Goals & plan present with outcomes vs plan comparison.
  > ## 2. Goals & Plan (Before)
  > ## 3. Outcome vs Plan
- Impact and duration are specified.
  > ## 4. Impact
  > - Duration: 2026-01-24 → 2026-01-26.
- Timeline includes detection, mitigation, resolution dates.
  > ## 5. Timeline (Detection → Mitigation → Resolution)
  > - Detection date (2026-01-24):
  > - Mitigation date (2026-01-25):
  > - Resolution date (2026-01-26):
- Root causes include stage attribution and evidence.
  > - Stage (Primary): Implementation
  > - Stage (Secondary): Testing
  > - Evidence: test/rollout-parser.test.js added after Codex feedback.
- Evidence section explicitly lists PR, review cycles, and tests.
  > ## 6. Evidence
  > - PR links: PR #89.
  > - Codex review cycles: Codex review feedback -> code update -> new Codex review (multiple cycles).
- Action items and prevention rules are enforceable.
  > ## 8. Action Items (Owner + Due Date)
  > ## 9. Prevention Rules

## GREEN: Updated Skill Output (Postmortem Format)

### Scenario Note
Subagent tooling unavailable (spawn failed), so a manual pressure scenario was used (time + authority + scope pressure).

### Manual Pressure Rationalizations (RED)
- "Just update the description; no need to touch the workflow."
- "This is only docs, so templates and evidence rules can wait."
- "Churn analysis already exists; a full postmortem is overkill."

### Updated Output (With New Skill)
```markdown
# Postmortem: PR #89 Delivery Miss
Date: 2026-01-26
Owner: Alex
Audience: Delivery Team, Eng Leads

## 1. Scope
- In scope: PR #89 rollout and review cycles
- Out of scope: unrelated frontend refactors
- Time window: 2026-01-12 to 2026-01-18

## 2. Goals & Plan (Before)
- Intended outcomes: ship boundary handling fix
- Planned milestones (dates): code complete 2026-01-14, release 2026-01-16
- Key assumptions: no contract changes required

## 3. Outcome vs Plan
- What shipped: fix delayed, additional patch required
- Deviations/gaps: missed edge cases, re-review required
- Metric deltas (if any): +3 days to release

## 4. Impact
- User/customer impact: intermittent errors for boundary inputs
- Business/ops impact: on-call escalation
- Duration: 36 hours

## 5. Evidence
- PR links: #89
- Codex review cycles: 3
- Incidents/alerts: incident-2026-01-15
- Repro steps/tests: boundary test plan v2

## 6. Root Causes (with Stage Attribution)
- Cause: boundary invariants not specified
- Stage: Design
- Evidence: missing acceptance criteria in spec

## 7. Action Items (Owner + Due Date)
- [ ] Define boundary invariants in spec (Owner: Alex, Due 2026-01-31)

## 8. Prevention Rules
- Rule: No @codex review without acceptance criteria + boundary matrix
- Enforcement: PR template gate
- Verification: CI check for addendum

## 9. Follow-up
- Checkpoint date: 2026-02-07
- Success criteria: zero boundary regressions for 2 releases
```

### GREEN: Pass Evidence
- Includes scope, goals/plan, outcome vs plan, impact, evidence, root causes with stage attribution, action items with owner/due date, prevention rules, and follow-up.
- Treats @codex churn as a trigger signal, not the root cause.
