# PR Review Cycle Retro Skill Test (2026-01-26)

## RED: Baseline (Current Skill Output)

### Baseline Prompt
Produce a project postmortem for PR #89.

### Baseline Output (Current Skill)
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

### RED: Failure Rationale (Why This Fails a Project Postmortem)
- Missing project-level impact: the output never states user/customer/system impact or operational consequences (it only says “repeat @codex review cycles”).
- No acceptance criteria or outcomes: there is no statement of what “success” was, what was accepted at merge, or what changed in the project (only stage causes).
- No timeline or narrative: it jumps straight to “Stage Attribution” without a “What happened / when / detection / resolution” sequence.
- Churn-only framing: the “Scope” and “Evidence Chain” are entirely about Codex review cycles rather than project outcomes.
- Lessons learned absent: “Preventive Actions” are limited to PR template/risk-layer gates and test additions; no broader project lessons are captured.
