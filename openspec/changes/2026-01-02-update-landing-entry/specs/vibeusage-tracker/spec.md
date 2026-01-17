## ADDED Requirements
### Requirement: Landing is the default for unauthenticated sessions
The dashboard SHALL render the landing page when no valid user session exists (no access token or `sessionExpired` is true), unless mock mode is enabled. Poster view SHALL only be available when the user is signed in or mock mode is enabled.

#### Scenario: Logged-out or expired user opens the root page
- **GIVEN** `signedIn` is false or `sessionExpired` is true
- **AND** mock mode is disabled
- **WHEN** the user opens the dashboard root page
- **THEN** the landing page is rendered and the dashboard/poster view is not rendered

#### Scenario: Mock mode bypasses landing gate
- **GIVEN** mock mode is enabled
- **WHEN** the user opens the dashboard root page
- **THEN** the dashboard renders even if no valid session exists
