# Change: Add avatar support in Public View

## Why
- Public View needs clearer identity recognition and a more complete visual card.

## What Changes
- Public View profile returns `avatar_url` after sanitization.
- Dashboard public view renders avatar with fallback to identicon.
- Tests and docs updated.

## Impact
- Affected specs: `openspec/specs/vibeusage-tracker/spec.md`
- Affected code:
  - `insforge-src/functions/vibescore-public-view-profile.js`
  - `dashboard/src/pages/DashboardPage.jsx`
  - `dashboard/src/ui/matrix-a/components/IdentityCard.jsx`
  - `dashboard/src/ui/matrix-a/components/MatrixAvatar.jsx`
  - `dashboard/src/lib/vibescore-api.js`
  - `test/public-view.test.js`
  - `BACKEND_API.md`
- **BREAKING** (if any): None

## Architecture / Flow
- Share token -> `vibeusage-public-view-profile` -> `public.users` -> sanitize -> return `display_name` + `avatar_url` -> Dashboard fetch -> IdentityCard render (image -> identicon fallback).

## Risks & Mitigations
- PII exposure: only allow http/https, sanitize name, omit email/user_id.
- Broken images: UI fallback to identicon via `onError`.

## Rollout / Milestones
- Follow OpenSpec tasks + tests; no data migration.
