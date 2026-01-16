# Change: Add NFT identity display and controlled mint

## Why
- Provide a brand-aligned NFT identity that reflects real usage while keeping privacy and eligibility controls.

## What Changes
- Add public NFT display route in the Dashboard (`/nft/:tokenId`) using IdentityCard styling.
- Add public read-only edge function for NFT display data (tokenId/wallet lookup).
- Add SIWE wallet binding with audit and one-to-one mapping.
- Add controlled mint flow with Merkle allowlists and voucher-based pricing/expiry.
- Add lifetime usage aggregation table + hourly refresh via GitHub Actions.
- Add ERC-721 SBT contract (non-transferable) with ERC-5192 lock and UUPS proxy.
- Add IPFS static tokenURI with dynamic external_url/animation_url.
- Select MoonPay as the fiat NFT checkout provider.
- Use Foundry as the contract toolchain.

## Impact
- Affected specs: `openspec/specs/vibescore-tracker/spec.md`
- Affected code:
  - `dashboard/src/pages/*` (new public page + routing)
  - `dashboard/src/ui/matrix-a/components/IdentityCard.jsx` (single stat slot)
  - `dashboard/src/content/copy.csv`
  - `insforge-src/functions/*` (public data, wallet bind, voucher, aggregation)
  - `insforge-functions/*` (build output)
  - `scripts/` (metadata/allowlist/aggregation helpers)
  - `contracts/` (new)
  - `.github/workflows/*` (hourly aggregation trigger)
- **BREAKING**: None

## Architecture / Flow
- Public route `/nft/:tokenId` → public edge function → sanitized display payload.
- Login + SIWE → wallet binding table (one-to-one) + audit log.
- Merkle allowlist (member-free / invite / purchase) + voucher (price + expiry) → contract mint.
- Hourly aggregation job updates `lifetime_total_tokens` for public display.
- TokenURI static on IPFS; dynamic display via external_url/animation_url.

## Risks & Mitigations
- Voucher replay or wallet hijack → enforce SIWE nonce + binding checks, short voucher TTL.
- Data leakage → strict field whitelist + handle masking on public endpoint.
- Cache staleness → 5-min CDN cache aligned to hourly aggregation.
- External provider downtime → retry/backoff + graceful UI fallbacks.

## Rollout / Milestones
- M1: Requirements + acceptance confirmed.
- M2: OpenSpec proposal + deltas validated.
- M3: DB + edge functions + unit tests.
- M4: Contract + integration tests + public page.
- M5: End-to-end mint + display verification.
