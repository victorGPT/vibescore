## Context
We need Opencode token usage ingestion that is automatic and non-invasive, aligned with existing notify-driven ingestion. Opencode provides a plugin event system and local storage on macOS; there is no documented notify config for external commands.

## Goals / Non-Goals
- Goals:
  - Install a global Opencode plugin without manual user steps.
  - Trigger the tracker notify handler on session idle events.
  - Parse local Opencode message storage for token usage and model.
  - Preserve user data privacy by extracting only numeric token fields.
- Non-Goals:
  - No long-running listeners or filesystem watchers.
  - No Opencode server dependency.
  - No ingestion of message content or tool outputs.

## Module Brief
- Scope (IN):
  - Global Opencode plugin installation/removal.
  - Local message storage parsing into half-hour buckets (`source = "opencode"`).
  - Status/diagnostics reporting for Opencode hook state.
- Scope (OUT):
  - Any runtime listener (SSE/watchers).
  - Parsing non-token content or attachments.
  - Backfilling historical data beyond local storage availability.
- Interfaces:
  - Plugin file: `~/.config/opencode/plugin/vibescore-tracker.js`.
  - Notify command: `node ~/.vibescore/bin/notify.cjs --source=opencode`.
  - Parser input: `~/.local/share/opencode/storage/message/**/msg_*.json`.
  - Parser output: half-hour buckets in `~/.vibescore/tracker/queue.jsonl`.
- Data flow and constraints:
  - Opencode event `session.idle` triggers notify handler (non-blocking, exit 0).
  - `sync --auto` parses message JSON, maps tokens, aggregates UTC half-hour buckets, enqueues.
  - No text fields persisted or uploaded.
- Non-negotiables:
  - No blocking Opencode session end.
  - No modification or removal of existing Opencode plugins.
  - Only numeric token fields are persisted.
- Test strategy:
  - Unit tests for message parser mappings and timestamps.
  - Init/uninstall tests ensure plugin installation/removal is safe.
  - Manual smoke: end Opencode session and verify queue growth + upload.
- Milestones:
  1) Spec delta merged (requirements + scenarios).
  2) Plugin install/remove + status/diagnostics updates.
  3) Parser integrated into sync and tests passing.
  4) Smoke verification captured.
- Plan B triggers:
  - If `session.idle` is not emitted in real use, switch to a plugin event with higher frequency (e.g., message/session update) plus short in-plugin debounce.

## Decisions
- Use Opencode global plugin install to trigger notify on `session.idle` events.
- Parse Opencode local storage message JSON for usage and model; derive timestamps from `time.completed` or `time.created` (ms).

## Risks / Trade-offs
- Plugin API or event names may change; mitigate by keeping plugin logic isolated and minimal.
- Some messages may lack token data; parser must skip safely without blocking ingestion.
