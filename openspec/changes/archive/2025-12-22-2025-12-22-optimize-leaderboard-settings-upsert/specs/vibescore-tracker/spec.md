## ADDED Requirements
### Requirement: Leaderboard settings update SHOULD prefer single upsert
The system SHALL attempt a single upsert when updating leaderboard privacy settings, and SHALL fall back to the legacy select/update/insert flow if the upsert is unavailable.

#### Scenario: Upsert succeeds
- **WHEN** a signed-in user updates `leaderboard_public`
- **THEN** the system SHALL perform a single upsert to persist the change
- **AND** the response payload SHALL remain unchanged

#### Scenario: Upsert unsupported
- **WHEN** the upsert attempt fails due to unsupported constraints
- **THEN** the system SHALL fall back to the legacy select/update/insert flow
