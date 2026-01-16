# Module Brief: NFT Identity + Controlled Mint

## Scope
- IN: Public NFT display page and API, SIWE wallet binding, allowlists + voucher mint, lifetime totals aggregation, SBT contract.
- OUT: Season resets, multi-chain support, marketplace optimization, advanced analytics.

## Interfaces
- Public API: `GET /functions/vibeusage-nft-public?tokenId=...|wallet=...` (no auth).
- Auth API: `POST /functions/vibeusage-nft-wallet-bind`, `POST /functions/vibeusage-nft-voucher-issue` (auth required).
- Admin API: allowlist root update endpoint (service role).
- Contract: ERC-721 + ERC-5192 + UUPS proxy; mint requires Merkle proof + voucher.
- Fiat checkout: MoonPay (card-based mint flow).

## Data Flow and Constraints
- Public viewer → public endpoint → InsForge2 DB (sanitized fields only).
- User login → SIWE → binding table + audit.
- Allowlist root + voucher → contract mint.
- Aggregation job → `vibescore_user_totals` hourly.
- Trust boundaries: public endpoint is read-only; mint requires auth + binding.
- Tokens/keys: voucher signing key stored server-side; SIWE nonce stored server-side.

## Non-Negotiables
- All UI copy sourced from `dashboard/src/content/copy.csv`.
- Wallet binding is one-to-one with audit trail.
- SBT is non-transferable; ERC-5192 locked state is true.
- Voucher expiry is 24 hours.
- Public endpoint returns masked handle only.

## Test Strategy
- Unit: masking, voucher expiry, aggregation math.
- Integration: binding, voucher issuance, public endpoint.
- Contract: mint success, transfer revert, replay prevention.
- Regression: dashboard homepage usage summary unchanged.

## Milestones
- M1: Requirements + acceptance.
- M2: OpenSpec proposal validated.
- M3: DB + edge + unit tests.
- M4: Contract + integration tests.
- M5: End-to-end mint + public display verified.

## Plan B Triggers
- Mint failure rate > 2% in testnet or production.
- Wallet binding collisions detected in audit.
- Public endpoint latency > 2s uncached.

## Upgrade Plan (disabled by default)
- Keep-warm upgrade path for UUPS; enable only after two successful testnet upgrades.
