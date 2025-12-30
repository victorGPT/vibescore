# PR Template (Minimal)

## PR Goal (one sentence)
Skip Codex notify installation when Codex config is missing to avoid init failures on systems without Codex.

## Commit Narrative
- fix(cli): skip Codex notify when config missing

## Regression Test Gate
### Most likely regression surface
- CLI init/uninstall behavior when Codex config is present vs missing.

### Verification method (choose at least one)
- [x] `node --test test/init-uninstall.test.js` => PASS

### Uncovered scope
- End-to-end init on a real machine without Codex installed.
