## ADDED Requirements
### Requirement: Every Code rollout ingestion
The system SHALL parse token usage from Every Code rollout logs under `~/.code/sessions/**/rollout-*.jsonl` (or `CODE_HOME` override), using the token_count allowlist, and SHALL tag uploads with `source = "every-code"`.

#### Scenario: Every Code token_count payload
- **GIVEN** a rollout record where `payload.msg.type == "token_count"` and `payload.msg.info` contains token fields
- **WHEN** the user runs `npx @vibescore/tracker sync`
- **THEN** the tracker SHALL aggregate half-hour buckets and enqueue them with `source = "every-code"`

### Requirement: Multi-source client deduplication
The system SHALL treat `(source, hour_start)` as the client-side dedupe key so Codex and Every Code buckets never collide.

#### Scenario: Codex and Every Code share the same hour
- **GIVEN** buckets for the same UTC half-hour from `codex` and `every-code`
- **WHEN** the tracker enqueues buckets
- **THEN** both buckets SHALL be uploaded without overwriting each other

### Requirement: Legacy queues remain compatible
The system SHALL treat missing `source` on queued buckets as `codex` to preserve backward compatibility.

#### Scenario: Old queue entries without source
- **GIVEN** queued buckets without a `source` field
- **WHEN** the uploader sends those buckets
- **THEN** the server SHALL store them as `source = "codex"`
