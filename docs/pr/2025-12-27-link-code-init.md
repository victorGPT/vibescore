# PR Template (Minimal)

## PR Goal (one sentence)
Make link code exchange atomic via RPC, prevent dashboard retry loop, and add regression coverage.

## Commit Narrative
- feat(edge): exchange link code via atomic RPC and return server used_at.
- fix(ui): guard link code issue effect against tight retry loop.
- test(edge): add RPC exchange regression cases.
- test(ui): add dashboard link code retry regression test.
- docs(pr): add PR gate record for this change.

## Rollback Semantics
Reverting this PR removes the RPC-based exchange and restores the previous non-atomic exchange behavior.

## Hidden Context
- Requires `public.vibescore_exchange_link_code` RPC to be deployed.
- Exchange still requires service role key in edge runtime.

## Regression Test Gate
### Most likely regression surface
- Link code exchange single-use semantics and device/token issuance.
- Dashboard link code issue effect (retry behavior).

### Verification method (choose at least one)
- [x] Existing automated tests did not fail: `node --test test/edge-functions.test.js` (pass)
- [x] Existing automated tests did not fail: `node --test test/dashboard-link-code-retry.test.js` (pass)
- [ ] New minimal test added (link or describe)
- [x] Manual regression path executed: `node scripts/acceptance/link-code-exchange.cjs` (ok: true)

### Uncovered scope
- Manual CLI install flow still not re-verified end-to-end.

## Fast-Track (only if applicable)
- Not applicable.

## Notes
- High-risk modules touched: link code exchange (token issuance).
