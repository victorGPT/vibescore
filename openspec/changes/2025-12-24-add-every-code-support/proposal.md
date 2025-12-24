# Change: Add Every Code ingestion support

## Why
- We need to ingest token usage from Every Code without modifying the Every Code client.
- Every Code logs live under `~/.code` and use a different token_count envelope (`payload.msg`).

## What Changes
- Parse Every Code rollout logs from `~/.code/sessions/**/rollout-*.jsonl` (override with `CODE_HOME`).
- Normalize Every Code token_count events and tag uploads with `source = "every-code"`.
- Treat `(source, hour_start)` as the client-side dedupe key to avoid cross-source collisions.

## Impact
- Affected specs: `vibescore-tracker`
- Affected code: `src/commands/sync.js`, `src/lib/rollout.js`, `src/lib/uploader.js`, CLI docs/help
- **BREAKING**: none (Codex path remains default)

## Architecture / Flow
- The tracker scans both `~/.codex/sessions` and `~/.code/sessions`.
- Codex events are tagged `source = "codex"`; Every Code events are tagged `source = "every-code"`.
- Buckets are aggregated and queued by `(source, hour_start)` and uploaded as-is.

## Risks & Mitigations
- Risk: Log format drift in Every Code → Mitigation: accept both `payload.type` and `payload.msg.type` with strict allowlist.
- Risk: Duplicate counting across sources → Mitigation: dedupe by `(source, hour_start)` locally.

## Rollout / Milestones
- M1: Confirm log format + OpenSpec change validated
- M2: Parser + queue + uploader updated with tests
- M3: Manual verification on a real Every Code session
