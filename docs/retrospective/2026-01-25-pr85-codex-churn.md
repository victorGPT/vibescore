# PR Retrospective: #85 Frontend UI Guardrails Churn (2026-01-25)

## Summary
- Codex review surfaced multiple guardrail gaps: duplicate JSX ids in `SimpleForm`, missing architecture canvas sync, and UI hardcode scanner blind spots.
- The hardcode scanner only counted matches and only captured ASCII letters, allowing in-node text edits and non-Latin/numeric text to bypass guardrails.
- Follow-up commits introduced token-level diffing, Unicode-aware text detection, regression tests, and completed the planned design doc.

## Evidence
- Codex review feedback (local review cycle) flagged:
  - `skills/public/frontend-ui-functional/assets/snippets/form.tsx` duplicate id usage.
  - `architecture.canvas` missing node sync.
  - `scripts/ops/validate-ui-hardcode.cjs` count-only logic and ASCII-only text regex.
  - Missing regression test for `validate:ui-hardcode`.
  - Missing `docs/plans/2026-01-24-frontend-ui-functional-design.md`.
- Fix commits:
  - `39fcc66` avoid duplicate `SimpleForm` ids.
  - `4cc275c` sync architecture canvas.
  - `773ed11` tighten ui hardcode guardrails + regression tests + design doc.

## Stage Attribution
- Primary: Testing
- Secondary: Implementation

## Cause Taxonomy
- Test Gap: no automated regression coverage for guardrail logic, so bypasses were undetected.
- Implementation Drift: regex and counting strategy missed non-Latin/numeric text and in-node edits.
- Spec Gap: design summary doc listed in plan but not delivered in initial change set.

## Preventive Actions
- Add regression tests for guardrail scripts with token-diff assertions.
- Treat Unicode/non-Latin copy as first-class in scanner rules.
- Require plan-doc completion before closing guardrail PRs.

## Notes
- Codex review cycle count: multiple (local review → fixes → re-review).
