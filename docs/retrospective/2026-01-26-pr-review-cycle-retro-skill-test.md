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

### GREEN Prompt
Generate a project postmortem for PR #89 using the updated template.

### GREEN Output (Updated Skill, Subagent-Generated)
```markdown
# Postmortem: PR #89 Rollout/Upload Reliability Fixes
Report date (YYYY-MM-DD): 2026-01-26
Owner: Victor
Audience: Delivery Team, Eng Leads

## 1. Scope
- In scope: PR #89 (rollout projectKey repo-root inference, uploader batch limit MAX_BUCKETS, regression tests)
- Out of scope: payment/webhook systems, unrelated rollout features
- Time window (YYYY-MM-DD → YYYY-MM-DD): 2026-01-12 → 2026-01-22

## 2. Goals & Plan (Before)
- Intended outcomes: correct projectKey inference at repo root; enforce uploader batch limit; prevent regression via tests
- Planned milestones (each YYYY-MM-DD): design 2026-01-13; implementation 2026-01-16; tests 2026-01-18; merge 2026-01-19
- Key assumptions: existing uploader paths cover large bucket batches; rollout inference already normalized

## 3. Outcome vs Plan
- What shipped: projectKey inference fix; MAX_BUCKETS enforced; regression tests added
- Deviations/gaps: merge delayed for test coverage review; additional edge-case handling added post-review
- Metric deltas (if any): none recorded (no metric captured)

## 4. Impact
- User/customer impact: failed rollouts for repo-root projects; uploader errors with large bucket batches
- Business/ops impact: support tickets and manual retries; delayed rollout adoption
- Duration: 2026-01-14 → 2026-01-20

## 5. Timeline (Detection → Mitigation → Resolution)
- Detection date (YYYY-MM-DD): 2026-01-14
- Mitigation date (YYYY-MM-DD): 2026-01-16
- Resolution date (YYYY-MM-DD): 2026-01-20

## 6. Evidence
- PR links: https://github.com/victorGPT/vibeusage/pull/89
- Codex review cycles: PR #89 review comments by @codex
- Incidents/alerts: none recorded
- Repro steps/tests: `test/rollout-parser.test.js`, `test/uploader.test.js`

## 7. Root Causes (with Stage Attribution)
- Cause: repo-root inference logic assumed subdir layout
- Stage (Primary): Implementation
- Stage (Secondary): Testing
- Identified date (YYYY-MM-DD): 2026-01-15
- Evidence: `test/rollout-parser.test.js`

- Cause: batch uploader lacked enforced MAX_BUCKETS boundary
- Stage (Primary): Design
- Stage (Secondary): Implementation
- Identified date (YYYY-MM-DD): 2026-01-16
- Evidence: `test/uploader.test.js`

## 8. Action Items (Owner + Due Date)
- [ ] Add metrics for rollout inference failures and batch size rejections (Owner: Alice, Due 2026-02-05)
- [ ] Expand uploader regression suite to include boundary and overflow cases (Owner: Victor, Due 2026-02-02)

## 9. Prevention Rules
- Rule: Any rollout inference change must include repo-root and subdir regression tests
- Enforcement: CI gate requiring inference test suite for rollout-related PRs
- Verification: CI job `rollout-inference-regression` must pass on PR

## 10. Follow-up
- Checkpoint date (YYYY-MM-DD): 2026-02-12
- Success criteria: zero repo-root inference failures; no uploader batch overflow incidents for 14 days
```

### GREEN: PASS Rationale
- Goals, outcomes, impact, timeline, evidence, root causes (with stage + identified date), action items, prevention rules, and follow-up are present.
- The report follows the updated template and uses required date formats.
- @codex churn is documented as a signal under Evidence, not treated as the root cause.
- Residual gaps: none identified in the template coverage.
