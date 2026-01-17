# Acceptance Criteria

## Feature: CLI Doctor

### Requirement: Doctor command outputs human-readable and JSON reports
- Rationale: 快速诊断与可自动化采集并重。

#### Scenario: Human-readable report by default
- **WHEN** a user runs `npx vibeusage doctor`
- **THEN** the CLI SHALL print a human-readable summary with check statuses
- **AND** it SHALL NOT require `--json`

#### Scenario: JSON output with file write
- **WHEN** a user runs `npx vibeusage doctor --json --out doctor.json`
- **THEN** the CLI SHALL write a JSON report to `doctor.json`
- **AND** the JSON SHALL include `version`, `generated_at`, `summary`, and `checks`

#### Scenario: --out implies JSON output
- **WHEN** a user runs `npx vibeusage doctor --out doctor.json`
- **THEN** the CLI SHALL write a JSON report to `doctor.json`
- **AND** stdout SHALL be JSON (no human-readable report)

### Requirement: Runtime configuration is single-source and non-compatible
- Rationale: 单一事实来源，禁止兼容路径。

#### Scenario: CLI flags override config and env
- **GIVEN** `~/.vibeusage/tracker/config.json` has `baseUrl` and `deviceToken`
- **AND** `VIBEUSAGE_DEVICE_TOKEN` is set
- **WHEN** `doctor --base-url https://override.example` runs
- **THEN** it SHALL use CLI flags as the active runtime configuration

#### Scenario: Legacy env vars are ignored
- **GIVEN** only `VIBESCORE_*` environment variables are set
- **WHEN** `doctor` runs
- **THEN** it SHALL ignore them and fall back to `VIBEUSAGE_*` or defaults

#### Scenario: Non-VIBEUSAGE env vars are ignored
- **GIVEN** only `INSFORGE_ANON_KEY` is set
- **WHEN** `doctor` runs
- **THEN** it SHALL ignore it and fall back to `VIBEUSAGE_*` or defaults

### Requirement: Doctor is read-only and does not migrate state
- Rationale: 诊断只读，避免“边诊断边改动”。

#### Scenario: Tracker directory is missing
- **GIVEN** `~/.vibeusage/` does not exist
- **WHEN** `doctor` runs
- **THEN** it SHALL NOT create directories
- **AND** it SHALL report the tracker directory as missing

### Requirement: Network check uses reachability semantics
- Rationale: 第一性原则，最小假设验证连通性。

#### Scenario: Any HTTP response counts as reachable
- **GIVEN** `base_url` responds with `401`
- **WHEN** `doctor` runs
- **THEN** the network check SHALL be `ok` with `status_code = 401`

#### Scenario: Network failure marks as unreachable
- **GIVEN** the request times out or throws a network error
- **WHEN** `doctor` runs
- **THEN** the network check SHALL be `fail`

### Requirement: Exit code only fails on critical checks
- Rationale: 诊断不阻断，除非自身不可用。

#### Scenario: Critical failure yields exit 1
- **GIVEN** `doctor` cannot read the tracker directory due to permission errors
- **WHEN** it runs
- **THEN** it SHALL exit with code `1`

#### Scenario: Non-critical failures still exit 0
- **GIVEN** device token is missing
- **WHEN** `doctor` runs
- **THEN** it SHALL exit with code `0`
