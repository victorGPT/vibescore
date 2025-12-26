## ADDED Requirements
### Requirement: Gemini CLI session usage ingestion
The system SHALL parse Gemini CLI session JSON at `~/.gemini/tmp/**/chats/session-*.json`, extract only numeric token fields, and aggregate them into UTC half-hour buckets with `source = "gemini"` and `model` from each message. Output tokens MUST include `tool` tokens.

#### Scenario: Gemini session tokens are aggregated
- **WHEN** a session message contains `tokens` with `input/output/cached/thoughts/tool/total` and a `timestamp`
- **THEN** the client SHALL enqueue a UTC half-hour bucket with mapped totals
- **AND** `output_tokens` SHALL equal `output + tool`
- **AND** no text fields (e.g., `content` or `thoughts`) SHALL be persisted or uploaded
