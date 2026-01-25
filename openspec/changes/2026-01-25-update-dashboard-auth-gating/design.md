## Context
The dashboard currently derives auth token readiness in multiple locations. Soft-expired sessions can still expose an auth token in some paths, leading to inconsistent behavior across hooks.

## Goals / Non-Goals
- Goals:
  - Single source of truth for dashboard auth token gating.
  - Soft-expired sessions always operate in guest mode (no auth token injection).
  - All data hooks and entry points share the same gating logic.
- Non-Goals:
  - Changing backend auth rules or token issuance.
  - Adding new UX flows outside the existing banner/soft-expired UI.

## Decisions
- Decision: Add a unified auth token state helper that outputs `authTokenAllowed`, `guestAllowed`, `isAccessTokenReady`, and `effectiveToken`.
- Decision: Gate all dashboard data hooks and entry points on the helper output; resolve tokens per request while allowing guest flow for soft-expired sessions. If a token provider exists, it is authoritative (prefer `getAccessToken` over static `accessToken`).
- Alternatives considered:
  - Per-hook logic (rejected: violates single source of truth).
  - Compatibility dual-paths for legacy behavior (rejected: disallowed by policy).

## Risks / Trade-offs
- Risk: Missing a hook or entry point leaves a bypass path.
  - Mitigation: Central helper + tests that assert hooks include `guestAllowed` gating and per-request resolution.
- Risk: Soft-expired sessions appear “logged out” for data.
  - Mitigation: keep banner messaging, continue guest data flow without auth token.

## Migration Plan
1. Introduce helper without changing behavior.
2. Switch DashboardPage and hooks to the helper output.
3. Remove direct token reads and re-run regression.

## Open Questions
- None.
