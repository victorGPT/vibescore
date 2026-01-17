# Change: Add debug payload for usage endpoints

## Why
We cannot observe `slow_query` logs via InsForge MCP log sources, and InsForge proxies strip custom response headers. A gated debug payload provides evidence for query duration and threshold without adding database writes.

## What Changes
- Add optional debug payload on usage endpoints when `debug=1` is provided.
- Expose request id, query duration, slow-query threshold, and slow-query flag via response JSON.
- Update tests and backend API documentation.

## Impact
- Affected specs: `openspec/specs/vibeusage-tracker/spec.md`
- Affected code: `insforge-src/shared/debug.js`, `insforge-src/functions/vibescore-usage-*.js`, `insforge-functions/*`, `test/edge-functions.test.js`, `BACKEND_API.md`
