# PR Template (Minimal)

## PR Goal (one sentence)
Allow dashboard auth callback to be processed when Insforge redirects to the root path.

## Commit Narrative
- fix(auth): accept auth callback params on root path
- test(auth): cover root path auth callback parsing
- docs(pr): record regression command and result

## Regression Test Gate
### Most likely regression surface
- Auth callback parsing and session restore.

### Verification method (choose at least one)
- [x] `node --test test/dashboard-session-expired-banner.test.js -t "useAuth accepts auth callback on root path"` => PASS

### Uncovered scope
- Real Insforge login redirect in production.
