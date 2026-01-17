## ADDED Requirements

### Requirement: Dashboard handles session expiry with a non-blocking banner
The dashboard SHALL mark session expired on HTTP 401 responses from authenticated API calls, clear local auth, and render a non-blocking banner prompting re-authentication when session expired is true.

#### Scenario: Unauthorized response marks session expired
- **WHEN** an authenticated Edge Function request returns HTTP 401
- **THEN** the client SHALL set a session-expired flag
- **AND** the client SHALL clear any stored auth token

#### Scenario: Session expired renders banner without hard gate
- **WHEN** session expired is true and the user is not signed in
- **THEN** the dashboard SHALL render its main shell
- **AND** the session-expired banner SHALL be visible
- **AND** the full-page auth gate SHALL NOT block the page

#### Scenario: Fresh unauthenticated user sees LandingPage
- **WHEN** session expired is false and the user is not signed in
- **THEN** the LandingPage SHALL render
