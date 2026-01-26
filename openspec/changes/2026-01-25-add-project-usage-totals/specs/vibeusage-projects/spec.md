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
