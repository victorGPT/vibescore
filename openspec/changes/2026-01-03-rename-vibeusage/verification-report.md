# Verification Report

Date: 2026-01-04

## Automated Tests
- Command: `node scripts/validate-copy-registry.cjs`
- Result: pass
- Command: `node --test test/auto-retry.test.js test/link-code-request-id.test.js test/interaction-sequence-canvas.test.js`
- Result: pass
- Command: `npm test`
- Result: pass (note: `--localstorage-file` warning emitted by test harness)

## Manual Verification
- Command: `node -e "process.argv=['node','vibescore-tracker','--help']; require('./bin/tracker.js');"`
- Result: pass (help runs and displays VibeUsage commands)
- Command: `node - <<'NODE'\nconst assert = require('node:assert/strict');\nconst a = require('./insforge-src/functions/vibeusage-usage-summary.js');\nconst b = require('./insforge-src/functions/vibescore-usage-summary.js');\nconst c = require('./insforge-src/functions/vibeusage-device-token-issue.js');\nconst d = require('./insforge-src/functions/vibescore-device-token-issue.js');\nassert.equal(a, b);\nassert.equal(c, d);\nconsole.log('ok: vibeusage and vibescore handlers match');\nNODE`
- Result: pass (legacy and new handlers resolve to same module)
- Command: `node - <<'NODE'\nconst os = require('node:os');\nconst path = require('node:path');\nconst fs = require('node:fs/promises');\nconst { resolveTrackerPaths } = require('./src/lib/tracker-paths');\n\n(async () => {\n  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibeusage-migrate-'));\n  const legacyRoot = path.join(tmp, '.vibescore');\n  const legacyTracker = path.join(legacyRoot, 'tracker');\n  await fs.mkdir(legacyTracker, { recursive: true });\n  await fs.writeFile(path.join(legacyTracker, 'config.json'), JSON.stringify({ baseUrl: 'https://example.invalid' }));\n\n  const first = await resolveTrackerPaths({ home: tmp, migrate: true });\n  const newRoot = path.join(tmp, '.vibeusage');\n\n  const legacyExistsAfter = await fs.stat(legacyRoot).then(() => true).catch(() => false);\n  const newExistsAfter = await fs.stat(newRoot).then(() => true).catch(() => false);\n\n  const second = await resolveTrackerPaths({ home: tmp, migrate: true });\n\n  console.log(JSON.stringify({\n    first: { migrated: first.migrated, usingLegacy: first.usingLegacy, rootDir: first.rootDir },\n    second: { migrated: second.migrated, usingLegacy: second.usingLegacy, rootDir: second.rootDir },\n    legacyExistsAfter,\n    newExistsAfter\n  }, null, 2));\n\n  await fs.rm(tmp, { recursive: true, force: true });\n})().catch((err) => {\n  console.error(err);\n  process.exit(1);\n});\nNODE`
- Result: pass (first run migrated, second run no-op; legacy removed, new exists)

## Regression Notes
- Regression: not run
