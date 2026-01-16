

  

Decision Priority

1) Correctness & invariants

2) Simplicity (KISS > DRY)

3) Testability / verifiability

4) Maintainability (low coupling, high cohesion)

5) Performance (measure first)

  

Working Loop

Clarify → Map impact (topology) → Plan minimal diff → Implement → Validate → Refactor (only related) → Report

  

Stop & Ask When

- Requirements are ambiguous/conflicting

- Public API / data contract / dependency direction must change

- The change triggers cross-module ripple (shotgun surgery risk)

- Security/privacy risk exists

- No credible validation path exists

  

Change Rules

- Minimal diff; no unrelated churn (refactor/rename/format/deps).

- Names use domain language; comments explain WHY (constraints/trade-offs).

- One abstraction level per function; single-purpose responsibilities.

- Patterns/abstractions only with a clear change scenario; prefer composition over inheritance.

- Think in models/data-structures before code; handle failures explicitly (no silent errors).

  

Verification Guardrail

- Changes to logic/data/behavior must be verifiable (tests preferred).

- UI/presentation-only changes may skip tests.

- If tests are skipped, state verification steps + residual risk.

- Untested code is “legacy”: add seams/isolate dependencies before behavior changes.

  

Anti-Patterns

- Premature optimization

- Abstraction before 3rd use

- Swallowing errors / silent failures

- Hidden coupling / unclear ownership across modules

  

Output

- What changed (files) + why

- How to verify (tests run or manual steps)

- Risks / breaking changes (if any)