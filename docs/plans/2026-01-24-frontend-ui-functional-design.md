# Frontend UI Functional Skill Design Summary

## Scope
- Deliverable B only: reusable UI workflows, references, and snippets.
- No new runtime features; guardrails are enforcement for UI copy/tokens discipline.

## Module Boundaries
- **Skill Assets**: `skills/public/frontend-ui-functional/**`
  - `references/`: rules and workflows
  - `assets/snippets/`: composable React/TSX examples
- **Guardrails**: `scripts/ops/validate-ui-hardcode.cjs` + baseline
  - Enforces Copy Registry and token usage discipline

## Dependencies
- Copy Registry: `dashboard/src/content/copy.csv` is the single source of truth.
- UI tokens: `dashboard/tailwind.config.cjs` + `dashboard/src/styles.css`.
- Architecture reference: `skills.canvas` and `architecture.canvas`.

## Guardrails (Why)
- **Prevent regression** after frontend refactor.
- **Enforce copy discipline** so UI text never bypasses registry.
- **Detect hardcoded tokens** (colors/text) early in CI.

## Reuse Rules
- Prefer `dashboard/src/ui` and `dashboard/src/components` before adding new components.
- Keep snippet text placeholders; no hardcoded copy.
- A11y/perf checks are mandatory in workflow.
