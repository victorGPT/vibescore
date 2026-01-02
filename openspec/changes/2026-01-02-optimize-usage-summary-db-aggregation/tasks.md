## 1. Database / RPC
- [x] 1.1 Draft SQL for RPC `vibescore_usage_summary_agg` (RLS-safe, `SUM` + `COALESCE`, group by `source`, `model`).
- [x] 1.2 Add SQL file under `openspec/changes/2026-01-02-optimize-usage-summary-db-aggregation/sql/001_usage_summary_agg.sql`.
- [x] 1.3 Define expected RPC signature and response shape (document in `BACKEND_API.md`).
- [x] 1.4 Grant execute to `anon` + `authenticated` for the RPC.

## 2. Edge Function
- [x] 2.1 Update `insforge-src/functions/vibescore-usage-summary.js` to call RPC instead of scanning hourly rows.
- [x] 2.2 Preserve pricing computation and debug payload semantics.
- [x] 2.3 Add slow-query fields: `rows_out`/`group_count`.
- [x] 2.4 Rebuild `insforge-functions/` via `npm run build:insforge`.

## 3. Tests & Regression
- [x] 3.1 Add acceptance script: `scripts/acceptance/usage-summary-agg.cjs` (RPC vs scan totals).
- [x] 3.2 Update `test/edge-functions.test.js` for RPC mocks and response parity.
- [x] 3.3 Run regression: `node --test test/edge-functions.test.js` + `node --test test/dashboard-function-path.test.js`.
- [x] 3.4 Add acceptance script: `scripts/acceptance/usage-summary-agg-grant.cjs` (SQL grant presence).

## 4. Docs & Canvas
- [x] 4.1 Update `BACKEND_API.md` with RPC details and no-lag guarantee.
- [x] 4.2 Refresh `architecture.canvas` and `interaction_sequence.canvas` after implementation.

## 5. Verification
- [x] 5.1 Record verification steps + results in `verification-report.md`.
