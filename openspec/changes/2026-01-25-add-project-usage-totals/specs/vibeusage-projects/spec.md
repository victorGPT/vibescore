## ADDED Requirements

### Requirement: Project registry is created on first usage
The system SHALL create or update a project registry row when a valid usage batch references a project.

#### Scenario: First usage creates a project
- **GIVEN** no project record exists for `project_key = K`
- **WHEN** the ingest pipeline receives a usage batch with project reference `R` and key `K`
- **THEN** a project registry row for `K` SHALL exist with `project_ref = R`

### Requirement: Project usage is stored idempotently per hour
The system SHALL store project usage in half‑hour buckets keyed by user, project, hour, and source.

#### Scenario: Re-sending the same project bucket does not double count
- **GIVEN** a project usage bucket for hour `H` already exists
- **WHEN** the same bucket is uploaded again
- **THEN** the stored totals SHALL remain unchanged

### Requirement: Project usage stores token fields as provided
The system SHALL store input, cached input, output, reasoning, and total token fields from the project usage bucket payload.

#### Scenario: Project token fields are persisted
- **GIVEN** a project usage bucket includes `input_tokens` and `cached_input_tokens`
- **WHEN** the project usage is stored
- **THEN** those token fields SHALL be present in the stored hourly row

### Requirement: Project reference uses repo remote URL
The system SHALL derive the project reference from the repository remote URL when available.

#### Scenario: Remote URL is used as project_ref
- **GIVEN** a usage session originates from a Git repository with a configured remote URL
- **WHEN** the CLI emits project usage
- **THEN** `project_ref` SHALL be the canonicalized remote URL

### Requirement: Project usage is tracked only for GitHub public repos
The system SHALL emit and ingest project usage only when the repository is verified as a GitHub public repository.

#### Scenario: Public GitHub repo emits project usage
- **GIVEN** a repo remote URL points to GitHub and GitHub returns `private=false`
- **WHEN** project usage is aggregated
- **THEN** the CLI SHALL emit `project_hourly` buckets and the server SHALL accept them

### Requirement: Non‑GitHub or non‑public repos are blocked
The system SHALL treat non‑GitHub remotes or non‑public GitHub repos as blocked for project usage.

#### Scenario: Non‑GitHub remote blocks project usage
- **GIVEN** a repo remote URL does not resolve to GitHub
- **WHEN** project usage is evaluated
- **THEN** the repo SHALL be marked blocked and no project usage SHALL be emitted

### Requirement: Pending verification is never counted
The system SHALL NOT upload or ingest project usage while a repository is in pending verification.

#### Scenario: Rate‑limited verification keeps repo pending
- **GIVEN** GitHub verification returns a rate‑limit response
- **WHEN** project usage is evaluated
- **THEN** the repo SHALL remain pending and project usage SHALL NOT be uploaded

### Requirement: Blocking only purges project usage
The system SHALL delete only project‑scoped usage for blocked repos and SHALL NOT modify system‑total usage.

#### Scenario: Blocked repo removes only project usage
- **GIVEN** a repo transitions to blocked
- **WHEN** local cleanup runs
- **THEN** project usage rows are deleted and system totals remain unchanged

### Requirement: Local path is stored as a hash only
The system SHALL store a hash of the local repo root path when tracking project usage, and SHALL NOT persist the raw path.

#### Scenario: Repo root path is hashed
- **GIVEN** a local repo root path is discovered
- **WHEN** project metadata is stored
- **THEN** only the hashed path SHALL be saved
