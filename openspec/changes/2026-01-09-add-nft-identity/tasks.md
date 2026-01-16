## 1. Planning & Decisions
- [x] 1.1 Confirm fiat checkout provider (MoonPay) and integration scope.
- [x] 1.2 Choose contract toolchain (Foundry) and repo location (`contracts/`).

## 2. Database Schema
- [x] 2.1 Add `nft_wallet_bindings` (user_id, wallet, bound_at, status).
- [x] 2.2 Add `nft_wallet_binding_audit` (user_id, old_wallet, new_wallet, changed_by, reason, changed_at).
- [x] 2.3 Add `nft_issuances` (user_id, wallet, token_id, claim_type, issued_at, tx_hash, block_number, chain_id, contract_address, claim_root, leaf_hash).
- [x] 2.4 Add `vibescore_user_totals` (user_id, lifetime_total_tokens, last_hour, updated_at).
- [x] 2.5 Add `nft_allowlist_roots` (type, root, updated_at, updated_by).
- [x] 2.6 Add `nft_siwe_nonces` (nonce, user_id, wallet, used_at).

## 3. Edge Functions
- [x] 3.1 Implement `vibeusage-nft-public` (public read-only display payload).
- [x] 3.2 Implement `vibeusage-nft-wallet-bind` (SIWE verify + bind).
- [x] 3.3 Implement `vibeusage-nft-voucher-issue` (Merkle + voucher + price + expiry).
- [x] 3.4 Implement `vibeusage-usage-lifetime-refresh` (hourly aggregation).
- [x] 3.5 Add admin-only root update endpoint (or SQL path) for allowlist roots.

## 4. Automation
- [x] 4.1 Add GitHub Actions schedule (hourly) to call `vibeusage-usage-lifetime-refresh`.
- [x] 4.2 Add runbook for manual re-run and backfill.

## 5. Contract
- [x] 5.1 Create `contracts/` project scaffolding.
- [x] 5.2 Implement ERC-721 non-transferable + ERC-5192 lock + UUPS proxy.
- [x] 5.3 Implement Merkle proof + voucher validation + price in voucher.
- [x] 5.4 Add contract tests (mint success, transfer revert, voucher expiry, replay prevention).
- [x] 5.5 Add contract deployment runbook (proxy init + upgrade).
- [x] 5.6 Add Foundry deploy script (implementation + proxy init).
- [x] 5.7 Add Foundry configure script (set claim roots + transfer ownership).

## 6. Metadata & IPFS
- [x] 6.1 Add metadata builder script (tokenURI JSON + image).
- [x] 6.2 Pin metadata and image to IPFS; record CIDs.
- [x] 6.3 Add Pinata pinning script + runbook guidance.

## 7. Dashboard UI
- [ ] 7.1 Add `/nft/:tokenId` public route + page component.
- [ ] 7.2 Update `IdentityCard` to single stat block layout for Total Usage.
- [ ] 7.3 Add total usage formatting and UTC issued_at formatting.
- [ ] 7.4 Update `dashboard/src/content/copy.csv` with new labels (Total Usage, CTA, errors).
- [ ] 7.5 Validate copy registry (`node scripts/validate-copy-registry.cjs`).

## 8. Tests & Verification
- [ ] 8.1 Unit tests: masking, voucher expiry, aggregation math.
- [ ] 8.2 Integration tests: public endpoint, wallet bind, voucher issue, aggregation refresh.
- [ ] 8.3 Regression run + record commands/results per policy.

## 9. Architecture Canvas
- [ ] 9.1 Update `architecture.canvas` to Proposed/Implemented nodes for NFT flow.
