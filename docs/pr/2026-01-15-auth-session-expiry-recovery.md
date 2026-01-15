# PR Template (Minimal)

## PR Goal (one sentence)
Establish a first-principles auth session-expiry state machine and gating in the dashboard.

## Commit Narrative
- docs(auth): add session expiry recovery design
- docs(openspec): add session expiry recovery design
- docs(canvas): mark auth state machine responsibilities
- docs(pr): record regression command and result

## Regression Test Gate
### Most likely regression surface
- Auth state machine gating and revalidate path.

### Verification method (choose at least one)
- [x] `node --test test/dashboard-session-expired-banner.test.js` => PASS (2026-01-15)

### Uncovered scope
- Real Insforge hosted login flow in production.
