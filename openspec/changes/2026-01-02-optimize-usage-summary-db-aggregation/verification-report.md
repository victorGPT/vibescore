# Verification Report

Date: 2026-01-02

## Automated Tests
- Command: `node --test test/edge-functions.test.js`
- Result: pass
- Command: `node --test test/usage-pagination-order.test.js`
- Result: pass
- Command: `node --test test/dashboard-function-path.test.js`
- Result: pass (warning: `--localstorage-file` invalid path)
- Command: `node scripts/acceptance/usage-summary-agg.cjs`
- Result: pass
- Command: `node scripts/acceptance/usage-summary-agg-grant.cjs`
- Result: pass
- Command: `node scripts/acceptance/usage-summary-aggregate.cjs`
- Result: pass
- Command: `node scripts/acceptance/usage-summary-rollup.cjs`
- Result: pass
- Command: `node scripts/acceptance/usage-summary-rollup-fallback.cjs`
- Result: pass
- Command: `node scripts/acceptance/usage-summary-rollup-empty-fallback.cjs`
- Result: pass
- Command: `node scripts/acceptance/usage-summary-tz-pagination.cjs`
- Result: pass

## Manual Verification
- Command: not run
- Result: not run

## Regression Notes
- Regression: `node --test test/edge-functions.test.js` + `node --test test/dashboard-function-path.test.js` + `node --test test/usage-pagination-order.test.js` + `node scripts/acceptance/usage-summary-agg.cjs` + `node scripts/acceptance/usage-summary-agg-grant.cjs` + `node scripts/acceptance/usage-summary-aggregate.cjs` + `node scripts/acceptance/usage-summary-rollup.cjs` + `node scripts/acceptance/usage-summary-rollup-fallback.cjs` + `node scripts/acceptance/usage-summary-rollup-empty-fallback.cjs` + `node scripts/acceptance/usage-summary-tz-pagination.cjs` passed.
