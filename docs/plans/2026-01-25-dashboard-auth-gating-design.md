# Dashboard Auth Gating Design (Soft-Expired Sessions)

## Summary
This change unifies dashboard auth gating so soft-expired sessions always operate in guest mode. A single auth-token state source produces `authTokenAllowed`, `isAccessTokenReady`, and `effectiveToken`. All dashboard entry points and data hooks read only from this source, removing per-hook token checks and preventing token injection during soft-expired states.

## Goals
- Enforce guest-only behavior when the session is soft-expired.
- Single source of truth for auth gating across all hooks.
- No compatibility or dual-path logic.

## Non-Goals
- Backend auth changes or token issuance changes.
- New UX flows beyond the existing soft-expired banner.

## Data Flow
1. Dashboard computes auth state (signed-in + sessionSoftExpired) once.
2. Unified helper derives `authTokenAllowed`, `guestAllowed`, and `effectiveToken`.
3. Hooks gate requests via `isAccessTokenReady`, resolve tokens per request, and allow guest flow when soft-expired. When a token provider exists, it is authoritative (prefer `getAccessToken` over static `accessToken`).
4. API client creation receives `undefined` token for guest-only requests.

## Error Handling
Soft-expired is not treated as an error. Requests proceed via guest flow and the banner indicates session state. Any 401/403 from backend continues to be handled by existing error flows without retrying with auth token.

## Tests
- Unit tests for auth-token helper behavior (provider readiness, normalization).
- Source-based checks asserting guest gating and per-request token resolution in hooks.
- Regression: `node --test test/*.test.js` after installing deps (including `esbuild`).
