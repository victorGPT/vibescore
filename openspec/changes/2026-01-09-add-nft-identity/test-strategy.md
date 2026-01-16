# Test Strategy

## Objectives
- Validate public NFT display without leaking sensitive data.
- Ensure wallet binding, voucher gating, and SBT constraints are enforced.
- Verify lifetime totals aggregation correctness and refresh cadence.

## Test Levels
- Unit:
  - Handle masking, total formatting, voucher expiry checks, aggregation math.
- Integration:
  - Public NFT endpoint (tokenId + wallet lookups).
  - SIWE wallet binding and audit insert.
  - Voucher issuance with Merkle proof validation.
  - Aggregation refresh writes `vibescore_user_totals`.
- Regression:
  - Dashboard homepage usage summary unchanged.
  - Existing usage endpoints remain stable.
- Performance:
  - Public endpoint latency under cached and uncached paths.

## Test Matrix
- Public NFT page render -> Integration -> Frontend -> Screenshot + response capture
- Public endpoint sanitization -> Integration -> Backend -> API response log
- Wallet binding one-to-one -> Integration -> Backend -> DB assertions
- Voucher mint gating -> Contract/Integration -> Web3 + Backend -> Test tx receipts
- Non-transferable SBT -> Contract -> Solidity tests -> Foundry/Hardhat report
- Lifetime totals refresh -> Integration -> Backend -> DB diff before/after

## Environments
- Local dev with InsForge2 + Base testnet fork (or testnet).
- CI with mocked signing keys and DB fixtures.

## Automation Plan
- Unit and integration tests on CI.
- Contract tests via Foundry.
- Manual end-to-end mint on testnet before production.

## Entry / Exit Criteria
- Entry: OpenSpec proposal approved, schema and endpoints designed.
- Exit: All tests green; manual mint + display verified; regression statement recorded.

## Coverage Risks
- MoonPay checkout integration may require manual validation.
- Chain RPC instability could affect test reliability.
