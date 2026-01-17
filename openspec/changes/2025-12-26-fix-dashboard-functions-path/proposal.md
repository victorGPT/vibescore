# Change: Fix dashboard edge function path resolution

## Why
- The dashboard currently prefers `/api/functions/*` and receives admin-only 403 because `/api/functions` is a management API; browser clients must call `/functions/*`.

## What Changes
- Add a function-path resolver in the dashboard request layer that prefers `/functions` and falls back to `/api/functions` on 404 for GET requests.
- Ensure backend probe uses the same resolver to avoid false-down status.
- Update dashboard API documentation to reflect the preferred path and fallback behavior.

## Impact
- Affected specs: `vibeusage-tracker`
- Affected code: `dashboard/src/lib/vibescore-api.js`, `docs/dashboard/api.md`
- **BREAKING** (if any): None (compatibility improvement).

## Architecture / Flow
- Dashboard request → try `/functions/<slug>` → if 404, retry `/api/functions/<slug>` once → use response or propagate non-404 errors.

## Risks & Mitigations
- Extra latency on legacy gateways: single retry only, limited to GET.
- Masked base URL misconfig: preserve non-404 errors; do not retry on 401/403.

## Rollout / Milestones
- M1 Requirements & Acceptance
- M2 Proposal + Spec Delta
- M3 Unit test for resolver/fallback
- M4 Manual regression via curl + dashboard refresh
- M5 Release notes + monitoring
