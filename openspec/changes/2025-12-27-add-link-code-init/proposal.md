# Change: Add link-code bootstrap for CLI init

## Why
- Users currently log in twice (Dashboard + first CLI install). This adds friction.
- A short-lived, single-use link code enables a secure one-login experience.

## What Changes
- Add edge functions to issue and exchange link codes for device tokens.
- Add a link code storage table (hash + TTL + usage state).
- Extend CLI `init` with `--link-code` to exchange without browser auth.
- Update Dashboard install panel with a copy button and masked display of the command.
- Update `BACKEND_API.md` and copy registry keys.

## Impact
- Affected specs: `openspec/specs/vibescore-tracker/spec.md`
- Affected code:
  - `insforge-src/functions/*` (new link code functions)
  - `src/commands/init.js`
  - `dashboard/src/pages/DashboardPage.jsx`
  - `dashboard/src/content/copy.csv`
  - `BACKEND_API.md`
- **BREAKING** (if any): none

## Architecture / Flow
- Dashboard (signed-in) requests a link code.
- UI shows a masked install command and provides copy.
- CLI `init --link-code` exchanges the code for a device token.
- On failure, CLI falls back to browser auth unless `--no-auth` is set.

## Risks & Mitigations
- Link code leak via shell history → short TTL + single-use + server stores hash only.
- Exchange failure after issuance → allow re-issuing a new link code.
- Missing service role in edge runtime → explicit error message and fallback to existing auth.

## Rollout / Milestones
- Follow docs/plans/2025-12-27-link-code-init/milestones.md
