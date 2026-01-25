## ADDED Requirements
### Requirement: Dashboard soft-expired sessions use guest auth gating
The dashboard MUST treat soft-expired sessions as guest-only and MUST NOT attach user auth tokens to usage requests. All dashboard data hooks SHALL derive auth gating from a single, shared auth-token state source.

#### Scenario: Soft-expired session uses guest data flow
- **GIVEN** the dashboard session is soft-expired
- **WHEN** the dashboard renders and requests usage data
- **THEN** the request SHALL be made without a user auth token and SHALL use the guest data flow
