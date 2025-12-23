# Acceptance Criteria

## Feature: notify auto sync runtime

### Requirement: Local runtime includes dependencies
- Rationale: 保证 `sync --auto` 可在本地 runtime 下运行。

#### Scenario: init installs runtime dependencies
- **WHEN** user runs `npx --yes @vibescore/tracker init --no-auth --no-open`
- **THEN** `~/.vibescore/tracker/app/node_modules/@insforge/sdk/package.json` SHALL exist

### Requirement: notify falls back when deps missing
- Rationale: 避免本地 runtime 缺依赖导致自动同步静默失败。

#### Scenario: fallback to npx when deps missing
- **GIVEN** local runtime exists and `@insforge/sdk` marker is missing
- **WHEN** Codex triggers notify
- **THEN** the handler SHALL invoke `npx --yes @vibescore/tracker sync --auto`
- **AND** it SHALL exit `0`
