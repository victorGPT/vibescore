# Verification Report

## Scope
- Public NFT display, wallet binding, controlled mint, lifetime totals aggregation.

## Tests Run
- `node --test test/edge-functions.test.js -t "usage-lifetime-refresh"` (2026-01-10)
- `node --test test/nft-identity-schema.test.js` (2026-01-10)
- `node --test test/usage-lifetime-refresh-workflow.test.js` (2026-01-10)
- `node --test test/nft-metadata-build.test.js` (2026-01-10)
- `source /Users/victor/.zshenv && cd contracts && forge test` (2026-01-10)
- `source /Users/victor/.zshenv && cd contracts && forge test` (2026-01-10, deploy script)
- `node --test test/edge-functions.test.js -t "vibeusage-nft"` (2026-01-10)
- `source /Users/victor/.zshenv && cd contracts && forge test` (2026-01-10, configure script)
- `node --test test/nft-identity-schema.test.js` (2026-01-10, rerun)
- `node --test test/edge-functions.test.js -t "allowlist-root-update"` (2026-01-10)
- `node --test test/nft-ipfs-pin.test.js` (2026-01-10)
- `node --test test/nft-ipfs-pin.test.js` (2026-01-10, post-pin)

## Results
- PASS (85 tests)
- PASS (1 test)
- PASS (1 test)
- PASS (1 test)
- PASS (5 tests)
- PASS (6 tests)
- PASS (85 tests)
- PASS (7 tests)
- PASS (1 test)
- PASS (87 tests)
- PASS (1 test)
- PASS (1 test)

## Evidence
- Local test run for lifetime aggregation.
- Local schema file validation.
- Local workflow file validation.
- Local metadata script validation.
- Local contract test run for voucher minting and non-transferability.
- Local contract deploy script test run (proxy initialization).
- Local edge function test run for NFT endpoints.
- Local contract configure script test run (claim roots + ownership).
- Local edge function test run for allowlist root update.
- Local IPFS pinning script test run (mocked Pinata).
- Pinned IPFS assets and recorded CIDs in docs/ops/nft-identity-ipfs-cids.json.

## Remaining Risks
- Fiat checkout provider integration pending.
- Contract deployment and upgrade process pending.
