## ADDED Requirements
### Requirement: Opencode session idle hook install is safe and reversible
The system SHALL install a global Opencode plugin under `~/.config/opencode/plugin` that triggers the tracker notify handler on `session.idle` events, without modifying other plugins, and SHALL support removing only the tracker plugin on uninstall.

#### Scenario: Existing plugins are preserved
- **GIVEN** Opencode already has plugins under `~/.config/opencode/plugin`
- **WHEN** a user runs `npx @vibescore/tracker init`
- **THEN** the tracker plugin SHALL be added without altering existing plugin files

#### Scenario: Uninstall removes only the tracker plugin
- **GIVEN** the tracker plugin is installed
- **WHEN** a user runs `npx @vibescore/tracker uninstall`
- **THEN** only the tracker plugin file SHALL be removed and other plugins SHALL remain unchanged

### Requirement: Opencode hook command is non-blocking
The Opencode plugin hook MUST be non-blocking and MUST NOT prevent Opencode from completing a `session.idle` event.

#### Scenario: Hook errors do not block Opencode
- **WHEN** the hook encounters an internal error
- **THEN** it SHALL still exit `0`

### Requirement: Opencode usage parsing from local message storage
The system SHALL parse Opencode message JSON files under `~/.local/share/opencode/storage/message/**/msg_*.json` and MUST only extract numeric token fields (`tokens.input`, `tokens.output`, `tokens.reasoning`, `tokens.cache.read`), aggregating into UTC half-hour buckets with `source = "opencode"` and `model` from `modelID`. When timestamps are present, the client SHALL bucket by `time.completed` (ms) and fall back to `time.created` (ms). The client MUST ignore any non-numeric or text fields.

#### Scenario: Token fields are mapped and aggregated
- **GIVEN** a message includes `tokens.input`, `tokens.output`, `tokens.reasoning`, and `tokens.cache.read`
- **WHEN** the user runs `npx @vibescore/tracker sync`
- **THEN** the bucket SHALL record `input_tokens`, `output_tokens`, `reasoning_output_tokens`, and `cached_input_tokens`
- **AND** `total_tokens` SHALL equal `input_tokens + output_tokens + reasoning_output_tokens`

#### Scenario: Missing model is recorded as unknown
- **GIVEN** a message omits `modelID` or it is empty
- **WHEN** the user runs `npx @vibescore/tracker sync`
- **THEN** the bucket SHALL set `model = "unknown"`

#### Scenario: Text content is ignored
- **GIVEN** a message includes non-numeric fields (content, tool outputs, metadata)
- **WHEN** the user runs `npx @vibescore/tracker sync`
- **THEN** no text or non-numeric content SHALL be persisted or uploaded
