# Verification Report

## Scope
- CI/CD workflows for CLI, dashboard, and Insforge functions.

## Tests Run
- 2026-01-15: `npm test` (initial run)
- 2026-01-15: `npm test` (after crypto polyfill for Node 18 CI)
- 2026-01-15: `npm run validate:guardrails`
- 2026-01-15: `npm run build:insforge:check`
- 2026-01-15: `npm --prefix dashboard ci`
- 2026-01-15: `npm --prefix dashboard run build`
- Pending (CI): `node scripts/acceptance/model-identity-alias-table.cjs` (runs in GitHub Actions with secrets)

## Results
- `npm test`: pass (both runs)
- `npm run validate:guardrails`: failed locally due to `.worktrees/*` SQL_TIMESTAMP (not present in CI checkout)
- `npm run build:insforge:check`: pass
- `npm --prefix dashboard ci`: pass
- `npm --prefix dashboard run build`: pass
- `node scripts/acceptance/model-identity-alias-table.cjs`: pending (CI)
- CI run (PR): failed on Node 18 with `crypto is not defined` in `insforge-functions/*`; fix applied via `test/edge-functions.test.js` polyfill
- CI run (PR): failed on Node 18 during dashboard build with `crypto.hash is not a function` (Vite); CI updated to Node 20
- CI run (PR): success (https://github.com/victorGPT/vibeusage/actions/runs/21016982572)

## Evidence
- Local run logs for commands above (2026-01-15).
- GitHub Actions workflow logs (CI: https://github.com/victorGPT/vibeusage/actions/runs/21016982572).
- Vercel deployment status checks.
- npm publish logs (main only).
- docs/deployment/freeze.md entry.

## Remaining Risks
- Manual MCP deploy confirmation relies on human process.
