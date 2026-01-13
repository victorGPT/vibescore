# Requirement Analysis

## Goal
- Provide a shareable Public View for the dashboard that is accessible by anyone with a link, read-only, and revocable.

## Scope
- In scope:
  - Public share link issuance, revocation, and rotation (single active link per user).
  - Public View route `/share/:token` rendering the full dashboard layout.
  - Share-token authentication path for read-only usage endpoints.
  - Copy registry updates for all Public View UI text.
  - Vercel rewrite to serve `share.html` for `/share/*`.
- Out of scope:
  - Public profile customization (avatar/name overrides).
  - Multi-link per user or link expiration policies.
  - Snapshot (static) sharing.
  - Cross-app embed widgets or iframe integrations.

## Users / Actors
- Public viewer (no auth)
- Authenticated user (owner of the share link)
- InsForge edge functions (public view auth + usage read)
- Admin/operator (service role)

## Inputs
- Share token from URL path (`/share/:token`)
- Authenticated user JWT for issuing/revoking share links
- Usage query params (`from`, `to`, `period`, `tz`, `model`, `source`)

## Outputs
- Public dashboard rendering (full layout)
- Usage data responses for public view (summary/daily/hourly/monthly/heatmap/model breakdown)
- Share link issuance response (token + status)

## Business Rules
- Each user has at most one active share link; issuing again rotates the token.
- Tokens are unguessable and stored only as `sha256` hashes in the database.
- Revoked tokens MUST be rejected.
- Public View is strictly read-only and limited to usage endpoints.
- Public View hides install/sign-in prompts and sign-out actions.
- Public View MUST NOT expose email or private identifiers in the UI.

## Assumptions
- Edge function environment has access to `INSFORGE_SERVICE_ROLE_KEY` for public token resolution.
- `share.html` is deployed and can be served at `/share/*` via rewrite.
- Public View traffic is acceptable for existing usage endpoints with caching/rate limiting handled upstream.

## Dependencies
- InsForge DB schema update (new `vibescore_public_views` table + RLS).
- New edge functions for share link issue/revoke/status.
- Dashboard route detection and UI control panel.
- Copy registry sync and validation.

## Risks
- Token leakage or link sharing beyond intended audience.
- Increased read load from public traffic.
- Accidental PII exposure via identity fields.
- Share token misuse if accepted by non-read endpoints.
