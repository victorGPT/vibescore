## ADDED Requirements
### Requirement: Legacy VibeScore compatibility is removed
The system MUST NOT retain legacy `vibescore` compatibility paths at runtime.

#### Scenario: Legacy env vars ignored
- **WHEN** only `VIBESCORE_*` env vars are set
- **THEN** the CLI uses defaults or `VIBEUSAGE_*` only

### Requirement: Edge functions are exposed under vibeusage slugs only
The system SHALL expose only `vibeusage-*` function slugs for usage tracking endpoints.

#### Scenario: Legacy endpoint is unavailable
- **WHEN** a client calls `/functions/vibescore-usage-summary`
- **THEN** it returns 404

#### Scenario: Primary endpoint remains available
- **WHEN** a client calls `/functions/vibeusage-usage-summary`
- **THEN** it returns 200

### Requirement: Database objects use vibeusage naming
The system SHALL use `vibeusage_*` naming for tables, views, sequences, indexes, and functions.

#### Scenario: Hourly table rename
- **WHEN** `vibescore_tracker_hourly` is renamed to `vibeusage_tracker_hourly`
- **THEN** row counts match before/after and constraints remain intact

### Requirement: Runtime paths contain no vibescore references
The system MUST NOT include `vibescore` references in runtime code paths.

#### Scenario: Runtime scan is clean
- **WHEN** scanning `bin/`, `src/`, `dashboard/`, `insforge-src/`, `scripts/`
- **THEN** no `vibescore` references remain
