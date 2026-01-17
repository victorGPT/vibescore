## ADDED Requirements
### Requirement: Dashboard authentication uses InsForge hosted routes
The dashboard SHALL integrate InsForge hosted authentication routes via React Router and SHALL rely on InsForge SDK session resolution for signed-in state.

#### Scenario: User signs in through hosted routes
- **GIVEN** a signed-out user opens the dashboard
- **WHEN** they navigate to `/sign-in` or `/sign-up`
- **THEN** the hosted auth flow SHALL complete and redirect to the configured post-auth URL
- **AND** the dashboard SHALL treat the user as signed in based on the SDK session without manual callback parsing
