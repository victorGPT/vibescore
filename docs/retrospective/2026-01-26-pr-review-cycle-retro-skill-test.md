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
- Missing project-level impact (Baseline Output evidence): it never states user/customer/system impact or operational consequences; it only says “repeat @codex review cycles”.
- No acceptance criteria or outcomes (Baseline Output evidence): it lists “Stage Attribution” and “Cause Taxonomy” but never states what “success” was or what was accepted at merge.
- No timeline or narrative (Baseline Output evidence): it jumps straight to “Stage Attribution” with no “What happened / when / detection / resolution”.
- Churn-only framing (Baseline Output evidence): “Scope” and “Evidence Chain” are entirely about Codex review cycles, not project outcomes.
- Lessons learned absent (Baseline Output evidence): “Preventive Actions” are limited to PR template/risk-layer gates and tests, with no broader project lessons.
