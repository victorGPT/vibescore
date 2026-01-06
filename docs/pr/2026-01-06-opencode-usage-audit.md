# PR Template (Minimal)

## PR Goal (one sentence)
Add a local-to-server audit script for Opencode token usage.

## Commit Narrative
- feat: add opencode usage audit core
- feat: add opencode usage audit cli
- fix: ignore missing hourly slots by default (allow --include-missing)
- fix: honor OPENCODE_HOME when resolving opencode storage
- docs: record opencode audit regression

## Regression Test Gate
### Most likely regression surface
- Audit script parsing and CLI flow for Opencode hourly usage.

### Verification method (choose at least one)
- [x] `node --test test/opencode-usage-audit.test.js` => PASS

### Uncovered scope
- End-to-end run against live account data.
