# PR Template (Minimal)

## PR Goal (one sentence)
Adopt InsForge hosted auth routes and SDK-managed session gating for the dashboard.

## Commit Narrative
- test(auth): assert hosted auth router wiring
- feat(auth): add insforge auth client wrapper
- feat(auth): route landing to hosted auth
- chore(dashboard): add insforge react-router deps
- feat(auth): gate dashboard by insforge session
- fix(auth): pass insforge baseUrl to hosted routes
- fix(auth): refresh insforge session to catch token rotation
- fix(auth): resolve insforge access token via provider

## Regression Test Gate
### Most likely regression surface
- Hosted auth redirect routing and session gating.

### Verification method (choose at least one)
- [x] Manual: hosted auth redirect flow (see below)
- [x] `node --test test/dashboard-session-expired-banner.test.js` => PASS
  - Re-run 2026-01-15: `node --test test/dashboard-session-expired-banner.test.js` => PASS
  - Re-run 2026-01-15: `node --test test/dashboard-session-expired-banner.test.js` => PASS (token provider)

### Manual hosted-auth flow (cold)
1. Open `https://www.vibeusage.cc/` in an incognito window.
2. Click “Login” and confirm hosted `/sign-in` route loads.
3. Complete OAuth login and ensure you land back on `/` with the dashboard visible.
4. Confirm dashboard requests include `Authorization: Bearer <accessToken>` from InsForge session.

### Uncovered scope
- None.
