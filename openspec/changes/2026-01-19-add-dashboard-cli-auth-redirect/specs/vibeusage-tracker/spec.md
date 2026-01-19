## ADDED Requirements

### Requirement: Dashboard redirects CLI auth to loopback callback
When a dashboard login request includes a `redirect` parameter pointing to a loopback URL, the dashboard SHALL forward the InsForge session data to that URL after a successful sign-in.

#### Scenario: Redirect validation enforces loopback + http only
- **GIVEN** a dashboard request includes `redirect=https://localhost:3000/callback`
- **WHEN** the dashboard validates the redirect
- **THEN** it SHALL reject non-`http` schemes
- **AND** it SHALL only allow `localhost`, `127.0.0.1`, or `[::1]` hosts

#### Scenario: Valid loopback redirect is honored
- **GIVEN** a user opens the dashboard with `?redirect=http://127.0.0.1:PORT/vibeusage/callback/nonce`
- **WHEN** the user completes sign-in
- **THEN** the dashboard SHALL navigate to the redirect URL
- **AND** it SHALL append `access_token`, `user_id`, `email`, and `name` query parameters

#### Scenario: Non-loopback redirect is ignored
- **GIVEN** a user opens the dashboard with `?redirect=https://example.com/callback`
- **WHEN** the user completes sign-in
- **THEN** the dashboard SHALL NOT redirect to the external URL

### Requirement: CLI uses dashboardUrl as auth entry with redirect
When `dashboardUrl` is configured, the CLI SHALL open that dashboard root URL and include a `redirect` parameter pointing to the local callback server.

#### Scenario: dashboardUrl login entry includes redirect
- **GIVEN** `VIBEUSAGE_DASHBOARD_URL` is set
- **WHEN** the CLI starts browser auth
- **THEN** the auth URL SHALL use `dashboardUrl` as origin
- **AND** it SHALL include a `redirect` query parameter to the local callback
