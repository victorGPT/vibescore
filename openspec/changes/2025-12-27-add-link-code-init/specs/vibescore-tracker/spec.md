## ADDED Requirements

### Requirement: Link code issuance for device token bootstrap
The system SHALL allow a signed-in dashboard session to issue a short-lived, single-use link code for device token bootstrap. The server MUST store only a hash of the link code and MUST expire it after a fixed TTL (10 minutes).

#### Scenario: Issue link code
- **WHEN** a signed-in user requests a link code
- **THEN** the system returns `link_code` and `expires_at`

#### Scenario: Link code storage is hashed
- **WHEN** a link code is issued
- **THEN** the server stores only the hash and expiry metadata

### Requirement: Link code exchange issues a device token
The system SHALL accept a valid link code exchange request and issue a device token for the associated user, marking the code as used. The system MUST reject expired or previously-used codes.

#### Scenario: Exchange succeeds
- **WHEN** the CLI submits a valid, unexpired link code with device metadata
- **THEN** the system issues a device token and marks the code as used

#### Scenario: Exchange rejects invalid codes
- **WHEN** the link code is expired or already used
- **THEN** the system rejects the exchange and does not issue a device token

### Requirement: CLI init supports link code bootstrap
The CLI `init` command SHALL accept `--link-code` to exchange for a device token without browser auth, and SHALL fall back to browser auth when the exchange fails unless `--no-auth` is set.

#### Scenario: CLI init uses link code
- **WHEN** a user runs `npx --yes @vibescore/tracker init --link-code <code>`
- **THEN** the CLI stores the device token and does not open a browser

#### Scenario: CLI init falls back on failure
- **WHEN** link code exchange fails and `--no-auth` is not set
- **THEN** the CLI initiates browser auth

### Requirement: Dashboard install command copy and masking
The dashboard SHALL display an install command that includes the link code, mask the link code in the visible UI, and provide a copy action that copies the full command. Visible text MUST be sourced from the copy registry.

#### Scenario: Masked display with copy
- **WHEN** the install command is rendered
- **THEN** the visible command masks the link code (ellipsis)
- **AND** the copy action writes the full command to clipboard
