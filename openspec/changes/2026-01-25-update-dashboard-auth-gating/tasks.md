## 1. Implementation
- [x] 1.1 Define a single auth token state source for the dashboard (allowed/ready/effective token).
- [x] 1.2 Route Dashboard entry points through the unified auth gating (no direct token reads).
- [x] 1.3 Apply unified gating across all dashboard data hooks.
- [x] 1.4 Ensure API client creation accepts an optional token without fallback auth injection.
- [x] 1.5 Add/update tests to cover soft-expired guest behavior and gating.

## 2. Regression
- [x] 2.1 Run regression: install deps (including `esbuild`) and execute `node --test test/*.test.js`.
- [x] 2.2 Record the exact regression command(s) and results here.
  - Command: `node --test test/*.test.js`
  - Result: pass (400/400) on 2026-01-25 (rerun after getAccessToken error coverage)
  - Result: pass (401/401) on 2026-01-25 (provider-only auth token enforcement)
  - Result: pass (401/401) on 2026-01-25 (PR gate rerun)

## 3. Docs & Validation
- [x] 3.1 Update architecture canvas after changes are complete.
- [x] 3.2 Run `openspec validate 2026-01-25-update-dashboard-auth-gating --strict`.
