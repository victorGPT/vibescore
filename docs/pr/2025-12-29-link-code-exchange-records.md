# PR Template (Minimal)

## PR Goal (one sentence)
Replace link code exchange RPC calls with direct records API operations to avoid 404s on the InsForge gateway.

## Commit Narrative
- Commit 1: `fix(edge): implement link code exchange via records api`

## Rollback Semantics
- Reverting this PR restores the RPC path, which is not exposed on the current gateway and will break link code exchange.

## Hidden Context
- InsForge gateway does not expose `/rpc` or `/api/database/rpc` for this function.
- Exchange now performs best-effort idempotency with compensation deletes when race conditions occur.

## Regression Test Gate
### Most likely regression surface
- Link code exchange -> device token issuance; CLI `init --link-code`.

### Verification method (choose at least one)
- [x] Existing automated tests did not fail (command: `node --test test/edge-functions.test.js` => PASS)
- [x] New minimal test added and executed (command: `node scripts/acceptance/link-code-exchange.cjs` => PASS)
- [ ] Manual regression path executed (steps + expected result)

### Uncovered scope
- Live exchange against a deployed backend using a real link code.

## Fast-Track (only if applicable)
- Statement: N/A.

## Notes
- High-risk modules touched: auth flow, device token issuance, database writes.
