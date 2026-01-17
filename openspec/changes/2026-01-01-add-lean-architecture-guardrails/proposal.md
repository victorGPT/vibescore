# Change: Add lean architecture guardrails

## Why
- The system needs explicit guardrails that fit a small team and low budget while preserving security and performance.

## What Changes
- Add architecture guardrail requirements to the tracker spec.
- Document PostgreSQL-first design principles and module boundaries.
- Define a TDD test strategy and milestones for enforcement.

## Impact
- Affected specs: `vibeusage-tracker`
- Affected code: documentation + future guardrail enforcement
- **BREAKING** (if any): none

## Architecture / Flow
- CLI (`src/`) -> Edge Functions (`insforge-src/`) -> PostgreSQL (InsForge) -> Dashboard (`dashboard/`).
- Data minimization and least privilege enforced at Edge Functions.

## Risks & Mitigations
- Risk: Guardrails slow iteration.
  - Mitigation: Keep requirements minimal and focused on high-impact safety/cost constraints.

## Rollout / Milestones
- Follow milestones in `docs/tdd/2026-01-01-add-lean-architecture-guardrails/milestones.md`.
