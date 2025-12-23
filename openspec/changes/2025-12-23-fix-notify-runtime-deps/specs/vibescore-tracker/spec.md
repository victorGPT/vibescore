# Spec: vibescore-tracker

## ADDED Requirements
### Requirement: Local runtime dependencies are installed
The system SHALL install a local runtime under `~/.vibescore/tracker/app` that includes runtime dependencies required to execute `sync` without `npx`.

#### Scenario: init installs runtime dependencies
- **WHEN** a user runs `npx --yes @vibescore/tracker init --no-auth --no-open`
- **THEN** `~/.vibescore/tracker/app/node_modules/@insforge/sdk/package.json` SHALL exist

## MODIFIED Requirements
### Requirement: Notify handler is non-blocking and safe
The notify handler MUST be non-blocking, MUST exit with status code `0` even on errors, and MUST NOT prevent Codex CLI from completing a turn. The handler SHALL prefer a local runtime when installed and its runtime dependencies are available; otherwise it SHALL fall back to invoking `npx --yes @vibescore/tracker sync --auto`.

#### Scenario: Local runtime missing dependencies falls back to npx
- **GIVEN** the local runtime exists but `@insforge/sdk` is missing
- **WHEN** Codex triggers notify
- **THEN** the handler SHALL invoke `npx --yes @vibescore/tracker sync --auto`
- **AND** it SHALL still exit `0`

#### Scenario: Local runtime with dependencies is used
- **GIVEN** the local runtime exists and its dependencies are present
- **WHEN** Codex triggers notify
- **THEN** the handler SHALL spawn `node ~/.vibescore/tracker/app/bin/tracker.js sync --auto --from-notify`
- **AND** it SHALL still exit `0`
