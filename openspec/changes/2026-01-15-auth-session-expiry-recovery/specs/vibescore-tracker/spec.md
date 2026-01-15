## MODIFIED Requirements
### Requirement: Dashboard authentication state
The Dashboard MUST derive its authenticated state from verifiable authorization outcomes and MUST NOT render or request private data without a valid access token.

#### Scenario: JWT request succeeds
- **WHEN** a request authorized with a JWT succeeds
- **THEN** the system SHALL clear any session-expired state

#### Scenario: JWT request returns 401
- **WHEN** a request authorized with a JWT returns 401
- **THEN** the system SHALL mark the session as expired and block further private requests

#### Scenario: Session expired state
- **WHEN** the session is marked expired
- **THEN** the system SHALL hide private data, avoid private requests, and present a re-auth prompt

#### Scenario: Revalidation
- **WHEN** a new access token is available while session is expired
- **THEN** the system SHALL attempt a single revalidation request and clear expired state only on success
