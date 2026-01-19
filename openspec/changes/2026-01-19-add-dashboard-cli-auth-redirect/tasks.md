## 1. Design alignment
- [ ] Confirm loopback-only redirect validation (http, localhost/127.0.0.1/[::1]).
- [ ] Update `architecture.canvas` before implementation to reflect CLI → dashboard → loopback flow (proposed).

## 2. Tests (RED)
- [ ] Add unit tests for redirect parsing/building in dashboard (valid/invalid loopback, preserve query, single-use).
- [ ] Add CLI auth flow test to ensure dashboardUrl is used as entry and redirect param is included.

## 3. Implementation (GREEN)
- [ ] Dashboard: parse `redirect` from query, persist if valid, redirect after session established.
- [ ] Dashboard: add helper module for redirect validation/building.
- [ ] CLI: use dashboardUrl as auth entry when configured, append `redirect` to local callback.

## 4. Verification
- [ ] `node --test test/browser-auth.test.js`
- [ ] `node --test test/dashboard-auth-redirect.test.js`

## 5. Documentation
- [ ] Update docs if auth flow behavior is described (if needed).
- [ ] Update `architecture.canvas` after implementation to mark nodes/flow implemented.
