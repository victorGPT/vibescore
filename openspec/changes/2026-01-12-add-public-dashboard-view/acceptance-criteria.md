# Acceptance Criteria

## Feature: Public View (Dashboard Share Link)

### Requirement: Public share link can be issued, revoked, and rotated
- Rationale: Allow users to share the dashboard safely and regain control if links leak.

#### Scenario: Issue a new share link
- WHEN an authenticated user requests a Public View link
- THEN the system returns a new share token
- AND the token is stored only as a hash
- AND any previous token becomes invalid

#### Scenario: Revoke the share link
- WHEN an authenticated user revokes Public View
- THEN the current token is marked revoked
- AND subsequent requests using that token are rejected

### Requirement: Public View renders the full dashboard in read-only mode
- Rationale: Provide a complete view without sign-in while preventing write actions.

#### Scenario: Public viewer opens a valid link
- WHEN a user visits `/share/:token` with a valid token
- THEN the full dashboard layout is rendered
- AND install/sign-in prompts are hidden
- AND sign-out actions are not shown

### Requirement: Usage endpoints accept share tokens for read-only access
- Rationale: Public View must read the same data without user JWTs.

#### Scenario: Fetch usage data with share token
- WHEN a request includes a valid share token in `Authorization: Bearer <token>`
- THEN the usage endpoints return the same shape as authenticated responses
- AND data is scoped to the share-link owner only

#### Scenario: Invalid or revoked token
- WHEN a share token is invalid or revoked
- THEN the usage endpoints return an authorization error
- AND the Public View UI shows an invalid-link state

### Requirement: Public View does not expose private identifiers
- Rationale: Prevent PII leakage.

#### Scenario: Identity card rendering
- WHEN Public View renders identity
- THEN it does not display email addresses or private identifiers
- AND it uses the existing anonymous fallback when needed
