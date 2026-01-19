# Change: add dashboard -> CLI auth redirect for self-hosted login

## Why
Self-hosted dashboard login does not return users to the CLI local callback, so `vibeusage init` cannot capture the access token and issue a device token. This breaks the documented self-hosted flow.

## What Changes
- Dashboard reads an optional `redirect` query parameter and, after successful sign-in, forwards the InsForge session data to that redirect when it is a loopback URL.
- CLI uses `dashboardUrl` as the auth entry when configured, attaching `redirect` to the local callback.
- Add loopback-only validation to prevent leaking tokens to non-local destinations.

## Impact
- Affected specs: `vibeusage-tracker`
- Affected code: `dashboard/src/App.jsx`, `dashboard/src/lib/*`, `src/lib/browser-auth.js`, tests under `test/`
- Security: introduces explicit redirect allowlist (loopback only).
