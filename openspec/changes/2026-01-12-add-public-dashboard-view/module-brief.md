# Module Brief: Public Dashboard View

## Scope
- IN: share link issue/revoke/status, public view route rendering, share-token auth for read-only usage endpoints.
- OUT: snapshot exports, multi-link management, public profile customization, embeds.

## Interfaces
- Input: `Authorization: Bearer <user_jwt>` for issue/revoke/status; `Authorization: Bearer <share_token>` for public read.
- Output: share token issuance response; read-only usage responses; public view UI.

## Data Flow and Constraints
- Issue: user JWT -> edge function -> store `token_hash` in `vibescore_public_views`.
- Public read: share token -> hash -> lookup user_id -> query usage tables with service role.
- Revoke: set `revoked_at` to disable token.
- Single active token per user (rotation replaces previous hash).

## Non-Negotiables
- Share tokens are never stored in plaintext.
- Public View is strictly read-only and scoped to the owning user.
- Invalid/revoked tokens return authorization errors.
- Public View must not expose PII (email, user_id).
- Requires `INSFORGE_SERVICE_ROLE_KEY` for public token resolution.

## Test Strategy
- Unit: dashboard routing + auth-gate suppression + copy registry keys.
- Integration: edge function issue/revoke/status, share-token usage read with mock DB.
- Regression: existing authenticated dashboard paths remain unchanged.

## Milestones
- M1: Requirements + acceptance + module brief approved.
- M2: OpenSpec proposal + spec delta validated.
- M3: Edge functions + schema + tests.
- M4: Dashboard public view + UI controls + tests.
- M5: Regression + freeze record.

## Plan B Triggers
- If service role key is unavailable in target env, disable Public View and surface a clear admin error.

## Upgrade Plan (disabled)
- Optional: multi-link support + expirations when demanded by enterprise usage.
