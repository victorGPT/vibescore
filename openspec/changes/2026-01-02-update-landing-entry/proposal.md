# Change: Update landing entry gating

## Why
Unauthenticated or expired sessions should always land on the landing page to provide a consistent entry point and avoid exposing the dashboard when the session is no longer valid.

## What Changes
- Treat `sessionExpired` as unauthenticated for landing gating.
- Render the landing page whenever the user is not signed in (and mock mode is off), regardless of `sessionExpired`.
- Keep poster view limited to signed-in or mock sessions only.

## Impact
- Affected specs: `vibeusage-tracker`
- Affected code: `dashboard/src/App.jsx`, `test/dashboard-session-expired-banner.test.js`
