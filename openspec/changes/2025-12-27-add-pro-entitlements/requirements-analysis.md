# Requirement Analysis

## Goal
- Provide a backend-calculated Pro status for authenticated users based on registration cutoff and entitlements, with admin-only entitlement management.

## Scope
- In scope:
  - Pro status computation rules (cutoff + entitlement windows + revoke).
  - `vibescore-user-status` read endpoint (user_jwt).
  - `vibescore-user-entitlements` storage + RLS.
  - Admin-only endpoints to grant/revoke entitlements.
- Out of scope:
  - Payment provider integration.
  - Dashboard UI changes or copy updates.
  - CLI changes.

## Users / Actors
- End users (dashboard) requesting Pro status.
- Project admins/service-role callers managing entitlements.

## Inputs
- `Authorization: Bearer <user_jwt>` for status.
- `Authorization: Bearer <service_role|project_admin>` for entitlements.
- `public.users.created_at`.
- Entitlement rows with effective windows.

## Outputs
- `pro.active`, `pro.sources`, `pro.expires_at`, `as_of` timestamp.
- Entitlement create/revoke responses.

## Business Rules
- Registration cutoff is `2025-12-31T23:59:59` Asia/Shanghai (`2025-12-31T15:59:59Z`).
- Registration Pro expires at `created_at + 99 years`.
- Entitlement is active when `now_utc` in `[effective_from, effective_to)` and `revoked_at IS NULL`.
- Pro is active if registration cutoff OR any active entitlement.
- `pro.expires_at` uses the maximum expiry of active sources.

## Assumptions
- If `created_at` is missing and no service-role key is available, Pro status can be computed from entitlements only as a partial result.
- Server time is authoritative for `now_utc`.

## Dependencies
- InsForge auth + database; RLS policies; project-admin JWTs when service role is unavailable.
- Edge function runtime for new endpoints.

## Risks
- Service-role key missing prevents registration-cutoff eligibility, resulting in partial Pro status.
- Timezone misinterpretation on cutoff boundary.
- Increased read latency from extra queries.
