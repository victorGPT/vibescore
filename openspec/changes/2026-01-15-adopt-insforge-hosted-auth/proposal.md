# Change: Adopt InsForge hosted auth routes for the dashboard

## Why
Users still land on the Landing page after OAuth login in some cases because our callback parsing is brittle. Using InsForge hosted auth routes and SDK-managed session handling reduces drift and centralizes the auth responsibility with the platform.

## What Changes
- Integrate InsForge hosted auth routes via React Router at the dashboard entry.
- Route Landing login/sign-up actions to the hosted routes (`/sign-in`, `/sign-up`).
- Use InsForge SDK session state as the primary source of truth for signed-in status.
- Preserve a short migration fallback to the existing local auth storage (temporary).
- Configure `afterSignInUrl`/`afterSignUpUrl` to return to the dashboard home.

## Impact
- Affected specs: `openspec/specs/vibeusage-tracker/spec.md`
- Affected code: `dashboard/src/main.jsx`, `dashboard/src/App.jsx`, `dashboard/src/pages/LandingPage.jsx`, `dashboard/src/hooks/use-auth.js` (fallback), `dashboard/src/lib/auth-url.js` (if replaced)
- Risks: auth boundary change, routing refactor, regression in login flow
