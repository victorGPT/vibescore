## ADDED Requirements

### Requirement: Public dashboard share link
The system SHALL allow an authenticated user to issue a revocable public dashboard link, storing only a hash of the share token and enforcing a single active link per user.

#### Scenario: Issue and rotate share link
- **WHEN** an authenticated user requests a Public View link
- **THEN** the system SHALL return a new share token
- **AND** the previous token (if any) SHALL be invalidated
- **AND** only the token hash SHALL be stored

#### Scenario: Revoke share link
- **WHEN** an authenticated user revokes Public View
- **THEN** the active share token SHALL be marked revoked
- **AND** the revoked token SHALL be rejected on subsequent requests

### Requirement: Share token read-only access
The system SHALL accept valid share tokens for read-only usage endpoints and scope responses to the link owner only.

#### Scenario: Valid share token
- **WHEN** a request to a usage endpoint includes a valid share token
- **THEN** the response SHALL match the authenticated response shape
- **AND** data SHALL be scoped to the share-link owner

#### Scenario: Invalid or revoked share token
- **WHEN** a share token is invalid or revoked
- **THEN** the endpoint SHALL return an authorization error

### Requirement: Public View dashboard rendering
The dashboard SHALL render the full Public View layout at `/share/:token` without requiring sign-in, while hiding auth/installation prompts.

#### Scenario: Public viewer opens a valid link
- **WHEN** a user opens `/share/:token` with a valid token
- **THEN** the full dashboard layout SHALL render in read-only mode
- **AND** sign-in and install prompts SHALL be hidden

#### Scenario: Public viewer opens an invalid link
- **WHEN** a user opens `/share/:token` with an invalid or revoked token
- **THEN** the UI SHALL show an invalid-link state
