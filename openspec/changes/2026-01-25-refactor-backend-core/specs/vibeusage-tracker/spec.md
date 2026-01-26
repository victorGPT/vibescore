## ADDED Requirements

### Requirement: Core-First Backend Architecture
The system SHALL centralize backend business rules in a shared core module, and Edge Function handlers SHALL be thin adapters that only perform request parsing, authentication, and delegation.

#### Scenario: Handler delegation
- **WHEN** a request hits any `/functions/vibeusage-*` endpoint
- **THEN** the handler delegates to the core module and does not implement business logic inline

### Requirement: Single DB Contract Surface
The system SHALL route all database reads/writes through a single db access layer (covering records API and SDK calls; no RPC) and SHALL NOT bypass the contract with ad-hoc queries.

#### Scenario: Query contract
- **WHEN** a usage endpoint reads aggregates for a user
- **THEN** the query is built through the db access layer with indexed predicates (e.g. `user_id + hour_start`)

### Requirement: RLS Helper Contract
RLS policies SHALL depend on a single helper function contract for device-token access checks, and policy logic SHALL NOT be duplicated across tables. The helper MUST be `vibeusage_device_token_allows_event_insert(device_token_id uuid, user_id uuid, device_id uuid)` and the select-by-hash policy MUST use `vibeusage_device_token_hash()`.

#### Scenario: Policy enforcement
- **WHEN** a device token attempts to insert into `vibeusage_tracker_hourly`
- **THEN** RLS uses `vibeusage_device_token_allows_event_insert(device_token_id, user_id, device_id)` to validate the request

### Requirement: Hard Cutover (No Dual Path)
The system SHALL NOT ship long-lived dual paths or versioned endpoints for backward compatibility; breaking changes MUST be executed via a coordinated migration window and a single release cutover.

#### Scenario: Breaking change deployment
- **WHEN** a breaking backend change is introduced
- **THEN** the release executes a single cutover within the migration window and removes any temporary dual-path logic

### Requirement: Idempotent, Replay-Safe Writes
The system SHALL make all user-triggered write operations idempotent and replay-safe, ensuring repeated requests do not create duplicate records. For device tokens, the system SHALL enforce one active token per `(user_id, device_id)` using a partial unique index on `revoked_at IS NULL` and MUST use UPSERT to return the existing token.

#### Scenario: Device token issue replay
- **WHEN** the same `user_id + device_id` request is repeated
- **THEN** the service returns the same token and does not create a duplicate row

#### Scenario: Ingest replay
- **WHEN** the same bucket payload (`user_id + device_id + source + model + hour_start`) is re-sent
- **THEN** the system does not create duplicate usage rows

### Requirement: Build Artifact Consistency
Deployable artifacts in `insforge-functions/` SHALL be generated from `insforge-src/` and verified by `npm run build:insforge:check` before deployment.

#### Scenario: Build check
- **WHEN** a backend refactor is prepared for deployment
- **THEN** `npm run build:insforge:check` passes with no diffs
