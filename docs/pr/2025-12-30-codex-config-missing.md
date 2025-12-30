# PR Template (Minimal)

## PR Goal (one sentence)
Avoid init/uninstall failures when Codex config is missing or located under CODEX_HOME.

## Commit Narrative
- fix(cli): skip Codex notify when config missing
- fix(cli): honor CODEX_HOME during uninstall

## Regression Test Gate
### Most likely regression surface
- CLI init/uninstall behavior when Codex config is present vs missing.

### Verification method (choose at least one)
- [x] `node --test test/init-uninstall.test.js` => PASS

### Uncovered scope
- End-to-end init on a real machine without Codex installed.
