# PR Template (Minimal)

## PR Goal (one sentence)
Revert /auth/callbak compatibility now that the correct redirect path is configured.

## Commit Narrative
- revert(auth): drop /auth/callbak callback path
- test(auth): keep auth callback parsing regression coverage
- docs(pr): record regression command and result

## Regression Test Gate
### Most likely regression surface
- Auth callback parsing and session restore.

### Verification method (choose at least one)
- [x] `node --test test/dashboard-session-expired-banner.test.js` => PASS

### Uncovered scope
- Real Insforge login redirect in production.
