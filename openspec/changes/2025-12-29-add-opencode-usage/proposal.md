# Change: Add Opencode usage ingestion (plugin hook + parser)

## Why
We need automatic token usage ingestion for Opencode sessions, consistent with existing Codex/Every Code/Claude flows, without requiring manual user actions.

## What Changes
- Install a global Opencode plugin that triggers the tracker notify handler on session idle events.
- Parse Opencode local storage message JSON to extract token usage and model, aggregating into UTC half-hour buckets with `source = "opencode"`.
- Surface Opencode hook status in CLI status/diagnostics.
- Add tests for Opencode parser and hook install/uninstall behavior.

## Impact
- Affected specs: `vibescore-tracker`
- Affected code: `src/commands/init.js`, `src/commands/uninstall.js`, `src/commands/sync.js`, `src/commands/status.js`, `src/lib/diagnostics.js`, `src/lib/rollout.js`, tests.
