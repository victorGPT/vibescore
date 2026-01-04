# Verification Report

## Scope
- Opencode plugin install/uninstall.
- Opencode message usage parsing into half-hour buckets.

## Tests Run
- `node --test test/rollout-parser.test.js test/init-uninstall.test.js`
- `node scripts/validate-copy-registry.cjs` (warnings only; no errors)
- `node scripts/acceptance/opencode-plugin-install.cjs`
- `node bin/tracker.js status`
- `node bin/tracker.js sync --auto`
- `node --test test/init-uninstall.test.js` (2025-12-30)
- `node scripts/acceptance/opencode-plugin-install.cjs` (2025-12-30; asserts unescaped `$` command)
- `node --test test/init-uninstall.test.js` (2026-01-04; includes opencode constants export)
- `node scripts/acceptance/opencode-plugin-install.cjs` (2026-01-04; validates session.updated + marker)
- `npm test` (2026-01-04; full suite)
- `node scripts/acceptance/opencode-plugin-install.cjs` (2026-01-04; deployment run)

## Results
- Passed.
- Opencode init/uninstall regression test passed.
- Copy registry check passed with warnings for unused keys.
- Opencode plugin acceptance passed.
- Local smoke: Opencode notify triggered parsing; queue grew; auto upload was throttled and a retry was scheduled.
- Opencode plugin acceptance passed with unescaped `$` command assertion (2025-12-30).
- Opencode plugin acceptance passed with session.updated + marker assertion (2026-01-04).
- Full test suite passed (2026-01-04).
- Opencode plugin acceptance passed (deployment run, 2026-01-04).

## Evidence
- Added Opencode parser coverage and plugin install/uninstall coverage in the test suite.

## Remaining Risks
- Manual smoke (end an Opencode session and confirm queue upload) not executed in this run.
