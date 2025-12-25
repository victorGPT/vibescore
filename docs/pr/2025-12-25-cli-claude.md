# PR Template (Minimal)

## PR Goal (one sentence)
Enable Claude Code usage parsing and hook install/uninstall in the CLI, with OpenSpec artifacts.

## Commit Narrative
- feat(cli): add Claude hook handling, JSONL usage parsing, and status/diagnostics updates.
- docs(openspec): add the Claude Code usage change proposal and test/verification artifacts.
- docs(pr): add PR gate record for this change.

## Rollback Semantics
Reverting this PR removes Claude hook install/uninstall and Claude usage parsing, restoring Codex-only behavior without data migrations.

## Hidden Context
- Claude usage logs are read from `~/.claude/projects/**` JSONL and only `usage.*` token fields are extracted.
- Missing model values fall back to `unknown`.

## Regression Test Gate
### Most likely regression surface
- CLI `init`/`uninstall` hook edits and notify chaining.
- JSONL parsing and half-hour bucket aggregation.
- Queue upload path in `sync`.

### Verification method (choose at least one)
- [x] Existing automated tests did not fail: `node --test test/rollout-parser.test.js test/init-uninstall.test.js test/uploader.test.js`
- [ ] New minimal test added (link or describe)
- [ ] Manual regression path executed (steps + expected result)

### Uncovered scope
- Manual smoke (end a Claude session and confirm upload) not verified here.
- Expected not to affect Codex-only flow; parser is gated by Claude source detection.

## Fast-Track (only if applicable)
- Not applicable.

## Notes
- High-risk modules touched: notify hooks and sync/ingest pipeline.
