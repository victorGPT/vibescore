## ADDED Requirements

### Requirement: Public NFT identity page
The system SHALL provide a public NFT identity page at `/nft/:tokenId` without requiring authentication.

#### Scenario: Public viewer opens a valid NFT page
- **WHEN** a viewer visits `/nft/:tokenId` for an issued token
- **THEN** the page renders IdentityCard styling with a masked handle and total usage

### Requirement: Public NFT display payload is sanitized
The system SHALL expose a public read-only endpoint that returns only sanitized NFT display fields.

#### Scenario: Fetch display payload by tokenId or wallet
- **WHEN** the endpoint is called with a `tokenId` or wallet address
- **THEN** it returns masked handle, total usage, tokenId, chain, and issued_at
- **AND** missing records return a not-found response used for CTA display

### Requirement: Wallet binding is SIWE-verified and one-to-one
The system SHALL bind wallets to users via SIWE and enforce a one-to-one mapping with audit history.

#### Scenario: Bind wallet and replace by admin
- **WHEN** a user signs a valid SIWE message
- **THEN** the wallet is bound if not already assigned
- **AND** admin replacement records an audit entry

### Requirement: Controlled mint uses allowlist roots plus voucher
The system SHALL gate minting with Merkle proofs (member-free/invite/purchase) and a signed voucher with 24h expiry.

#### Scenario: Eligible user mints once
- **WHEN** a logged-in user submits a valid Merkle proof and non-expired voucher
- **THEN** mint succeeds for the bound wallet
- **AND** a second mint attempt for the same user is rejected

### Requirement: NFT contract is SBT and ERC-5192 locked
The system SHALL implement a non-transferable ERC-721 token that reports ERC-5192 locked status.

#### Scenario: Transfer attempt fails
- **WHEN** a token transfer is attempted
- **THEN** the transaction reverts

### Requirement: Lifetime totals are aggregated and served
The system SHALL maintain a `lifetime_total_tokens` aggregate and serve it for NFT display.

#### Scenario: Hourly refresh updates totals
- **WHEN** the hourly aggregation job runs
- **THEN** `lifetime_total_tokens` is refreshed using billable totals when present
