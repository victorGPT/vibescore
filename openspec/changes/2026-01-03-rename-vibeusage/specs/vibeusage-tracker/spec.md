## MODIFIED Requirements

### Requirement: Public naming and identifiers
The system SHALL expose public naming that reflects **VibeUsage** across CLI, dashboard, domains, and documentation.

#### Scenario: Brand shown in UI and docs
- **WHEN** a user views dashboard pages or public documentation
- **THEN** the visible product name is VibeUsage

### Requirement: CLI naming compatibility
The system SHALL provide `vibeusage` as the primary CLI name and preserve legacy CLI commands for 90 days.

#### Scenario: Legacy CLI still works
- **WHEN** a user runs a legacy CLI command
- **THEN** the command executes the same logic as the `vibeusage` CLI without user-visible warnings

### Requirement: API path compatibility
The system SHALL expose `/functions/vibeusage-*` as the primary Edge Function paths and transparently proxy legacy `/functions/vibescore-*` paths for 90 days.

#### Scenario: Old API path still works
- **WHEN** a client calls a legacy `/functions/vibescore-*` endpoint
- **THEN** the response matches the equivalent `/functions/vibeusage-*` endpoint

### Requirement: Local storage migration
The system SHALL migrate local data from `~/.vibescore` to `~/.vibeusage` and preserve compatibility for 90 days.

#### Scenario: Migration is idempotent
- **WHEN** the migration runs multiple times
- **THEN** no data is lost and the resulting state remains valid

## ADDED Requirements

### Requirement: Package publish strategy
The system SHALL publish the primary package as `vibeusage` (fallback `@vibeusage/tracker` if unavailable) and keep legacy packages functional for 90 days.

#### Scenario: Legacy package still works
- **WHEN** a user installs the legacy package
- **THEN** it installs and routes to the same runtime behavior as the new package
