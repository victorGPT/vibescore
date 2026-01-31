# Acceptance Criteria

## Feature: Public GitHub project usage gating

### Requirement: Emit project usage only for public GitHub repos
- Rationale: Ensure project usage reflects only public repos.

#### Scenario: Public repo emits project usage
- WHEN repo remote resolves to GitHub and API returns `private=false`
- THEN CLI emits `project_hourly` buckets
- AND ingest accepts those buckets

### Requirement: Block non-GitHub or private repos
- Rationale: Avoid tracking non-public projects.

#### Scenario: Non-GitHub remote blocks project usage
- WHEN remote is non-GitHub or malformed
- THEN repo is marked blocked
- AND no project usage is emitted

#### Scenario: Private repo blocks project usage
- WHEN GitHub API returns `private=true` or `404`
- THEN repo is marked blocked
- AND project usage is purged locally

### Requirement: Pending verification never counts
- Rationale: Prevent false public attribution under rate limits.

#### Scenario: Rate-limited verification
- WHEN GitHub API returns rate-limit / transient error
- THEN repo is marked pending
- AND no project usage is uploaded

### Requirement: Purge only project usage
- Rationale: Preserve system totals.

#### Scenario: Blocked repo triggers purge
- WHEN repo transitions to blocked
- THEN project usage rows are deleted
- AND system totals remain unchanged

### Requirement: Repo root stored as hash only
- Rationale: Minimize sensitive local path exposure.

#### Scenario: Hash stored instead of raw path
- WHEN project metadata is written
- THEN only `repo_root_hash` is persisted
- AND raw path is not stored
