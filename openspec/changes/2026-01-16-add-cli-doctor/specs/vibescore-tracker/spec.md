## ADDED Requirements
### Requirement: CLI doctor command provides diagnostics
The CLI SHALL provide a `doctor` command that outputs a human-readable diagnostic report by default and a JSON report when `--json` is provided.

#### Scenario: Default doctor output
- **WHEN** a user runs `npx vibeusage doctor`
- **THEN** the CLI SHALL print a human-readable summary of diagnostic checks

#### Scenario: JSON doctor output
- **WHEN** a user runs `npx vibeusage doctor --json`
- **THEN** the CLI SHALL emit a JSON report with `version`, `generated_at`, `summary`, and `checks`

### Requirement: Runtime configuration is single-source
The CLI MUST resolve runtime configuration from `~/.vibeusage/tracker/config.json`, `VIBEUSAGE_*` environment variables, and defaults, and MUST NOT accept `VIBESCORE_*` compatibility inputs.

#### Scenario: Legacy env is ignored
- **GIVEN** only `VIBESCORE_INSFORGE_BASE_URL` and `VIBESCORE_DEVICE_TOKEN` are set
- **WHEN** the CLI runs `doctor`
- **THEN** it SHALL ignore them and fall back to `VIBEUSAGE_*` or defaults

### Requirement: Doctor is read-only
The `doctor` command MUST NOT migrate or write tracker state.

#### Scenario: Legacy tracker exists
- **GIVEN** only `~/.vibescore/` exists and `~/.vibeusage/` does not
- **WHEN** `doctor` runs
- **THEN** it SHALL not create or rename directories

### Requirement: Network reachability semantics
The `doctor` network check SHALL treat any HTTP response from `base_url` as reachable and SHALL mark only timeouts/network errors as unreachable.

#### Scenario: Any HTTP response counts as reachable
- **GIVEN** `base_url` responds with HTTP `401`
- **WHEN** `doctor` runs
- **THEN** the network check SHALL be `ok` and report the status code

#### Scenario: Network failure is unreachable
- **GIVEN** the request times out
- **WHEN** `doctor` runs
- **THEN** the network check SHALL be `fail`

### Requirement: Exit codes only fail on critical errors
The CLI SHALL exit with code `1` only when a critical diagnostic check fails; non-critical failures SHALL still exit `0`.

#### Scenario: Critical failure exits 1
- **GIVEN** the tracker directory cannot be read due to permission errors
- **WHEN** `doctor` runs
- **THEN** it SHALL exit with code `1`

#### Scenario: Missing device token exits 0
- **GIVEN** no device token is configured
- **WHEN** `doctor` runs
- **THEN** it SHALL exit with code `0`
