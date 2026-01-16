# Requirement Analysis

## Goal
- Launch a VibeUsage SBT NFT with a public identity display powered by InsForge2, using controlled minting and lifetime usage totals.

## Scope
- In scope:
  - Public NFT page at `/nft/:tokenId` (no login required) with IdentityCard styling.
  - Read-only public edge function returning sanitized NFT display data.
  - Wallet binding via SIWE (one user ↔ one wallet) with audit trail.
  - Controlled mint flow with Merkle allowlists + backend voucher (price + expiry).
  - Member-free eligibility based on `auth.users.created_at < 2026-01-01`.
  - Lifetime usage aggregation table + hourly refresh via GitHub Actions.
  - ERC-721 non-transferable SBT + ERC-5192 lock + UUPS proxy.
  - IPFS static tokenURI JSON + dynamic `external_url`/`animation_url`.
  - Copy registry updates for all UI text.
- Out of scope:
  - Season resets or historical season browsing.
  - Multi-chain deployments.
  - Marketplace listing optimizations.
  - Custom analytics or secondary leaderboards.

## Users / Actors
- Public viewer (no auth)
- Authenticated user (insforge2 login)
- Admin/operator
- GitHub Actions scheduler
- Smart contract (Base mainnet)
- Fiat checkout provider (TBD)

## Inputs
- `tokenId` or wallet address
- SIWE signature + nonce
- Merkle proof + allowlist root
- Voucher (price, expiry, wallet, claim type)
- Usage aggregates (hourly rows)
- Registration timestamp (`auth.users.created_at`)

## Outputs
- Public NFT display JSON (sanitized)
- NFT public page rendering
- Minted SBT token (on-chain)
- DB rows for bindings, issuances, audit, totals

## Business Rules
- One user binds exactly one wallet; one wallet maps to one user.
- Each user can mint exactly one NFT; `tokenId` equals `issue_no`.
- SBT is non-transferable; ERC-5192 lock state is true.
- Voucher validity is 24 hours; price is defined in voucher.
- Member-free eligibility: `auth.users.created_at < 2026-01-01`.
- Allowlist roots are updatable (member-free / invite / purchase).
- `lifetime_total_tokens` uses `billable_total_tokens` when present, else `total_tokens`.
- Public display masks handle as first 3 chars + `***`.
- Total usage shows full number with thousands separators.

## Assumptions
- Base mainnet single contract and single contract address.
- IPFS pinning via Pinata or Web3.Storage.
 - Fiat checkout provider is MoonPay.
- Contract toolchain is Foundry.
- Dashboard homepage remains unchanged (NFT uses independent totals).

## Dependencies
- InsForge2 DB + edge functions
- GitHub Actions schedule
- Base RPC + block explorer
- SIWE library
- IPFS pinning service
- MoonPay checkout
- CDN caching for public endpoint

## Risks
- Voucher misuse or replay if binding checks are weak.
- Wallet binding hijack without strict SIWE + nonce validation.
- PII leakage if public endpoint returns raw handle.
- Caching staleness vs perceived “real-time” data.
- UUPS upgrade safety (admin key compromise).
- External provider downtime (IPFS pinning / fiat checkout).
