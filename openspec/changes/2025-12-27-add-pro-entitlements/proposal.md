# Change: Add Pro entitlements and user status

## Why
- We need a consistent, backend-calculated Pro flag for users based on registration cutoff, paid/override entitlements, and admin controls.

## What Changes
- Add an entitlements table with effective windows and revocation.
- Add a user status endpoint to compute Pro status at runtime.
- Add admin endpoints to grant/revoke entitlements.

## Impact
- Affected specs: vibeusage-tracker
- Affected code: insforge-src/functions/* (new endpoints), insforge-src/shared/* (pro calculation), database schema
- **BREAKING**: none

## Architecture / Flow
- User calls `GET /functions/vibescore-user-status` with `user_jwt`.
- Backend resolves `created_at` + entitlements and computes `pro.active`.
- Admins manage entitlements via service-role endpoints.

## Risks & Mitigations
- Risk: `created_at` not available via user auth.
  - Mitigation: fallback to RPC/service-role lookup with explicit policy.
- Risk: timezone boundary errors.
  - Mitigation: fix cutoff timestamp in UTC (`2025-12-31T15:59:59Z`).

## Rollout / Milestones
- Define schema + RLS, implement endpoints, add tests, run `openspec validate`.
