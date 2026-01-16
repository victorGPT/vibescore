# Acceptance Criteria

## Feature: NFT Identity & Controlled Mint

### Requirement: Public NFT page renders IdentityCard with masked handle and total usage
- Rationale: Provide a public identity view without leaking PII.

#### Scenario: Visitor opens a valid NFT page
- WHEN a user visits `/nft/:tokenId` for an issued token
- THEN the page renders IdentityCard styling with masked handle (first 3 chars + `***`)
- AND the Total Usage value shows a full number with thousands separators

### Requirement: Public NFT data endpoint returns sanitized display payload
- Rationale: Frontend reads from InsForge2 while keeping data minimal.

#### Scenario: Fetch by tokenId or wallet
- WHEN the public endpoint is called with `tokenId` OR a wallet address
- THEN it returns sanitized display fields (masked handle, total usage, tokenId, chain, issued_at)
- AND missing records return a not-found response used for CTA display

### Requirement: Wallet binding uses SIWE and enforces one-to-one mapping
- Rationale: Prevent wallet reuse and maintain auditability.

#### Scenario: Bind wallet and replace by admin
- WHEN a user signs SIWE and binds a wallet
- THEN the binding is created only if the wallet is unbound
- AND an admin replacement records an audit row

### Requirement: Controlled mint uses Merkle proof + voucher with 24h expiry
- Rationale: Enforce eligibility and pricing under login-bound wallets.

#### Scenario: Eligible user mints once
- WHEN a logged-in user presents a valid Merkle proof and a non-expired voucher
- THEN mint succeeds for the bound wallet
- AND the same user cannot mint again

### Requirement: Contract is SBT (non-transferable) and ERC-5192 locked
- Rationale: Preserve identity semantics and marketplace clarity.

#### Scenario: Transfer is rejected and tokenURI is static
- WHEN a user attempts to transfer the token
- THEN the transfer reverts
- AND the tokenURI points to static IPFS JSON with dynamic `external_url`

### Requirement: Lifetime total tokens are aggregated hourly with billable fallback
- Rationale: Provide stable lifetime totals without scanning full history per request.

#### Scenario: Hourly refresh updates lifetime totals
- WHEN the hourly aggregation job runs
- THEN `lifetime_total_tokens` is updated using `billable_total_tokens` when present
- AND the public NFT endpoint reflects the updated total
