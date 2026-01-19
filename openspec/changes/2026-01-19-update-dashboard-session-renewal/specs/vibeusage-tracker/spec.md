## ADDED Requirements
### Requirement: Dashboard silently renews sessions on 401
The dashboard SHALL attempt a single silent session refresh when an authenticated **business** request returns HTTP 401, and SHALL retry the request once before surfacing a session soft-expired banner. Backend probes and static asset requests SHALL NOT trigger refresh attempts.

#### Scenario: Silent refresh succeeds
- **GIVEN** an authenticated dashboard request returns HTTP 401
- **WHEN** the dashboard refreshes the session and retries the request
- **THEN** the request SHALL succeed without marking the session expired
- **AND** the dashboard SHALL continue rendering the current view

#### Scenario: Silent refresh fails
- **GIVEN** an authenticated dashboard request returns HTTP 401
- **WHEN** the dashboard attempts a silent refresh and the retry still returns HTTP 401
- **THEN** the dashboard SHALL mark the session as soft-expired
- **AND** the dashboard SHALL display the session-expired banner without navigating away

#### Scenario: Silent refresh fails due to non-401 error
- **GIVEN** an authenticated dashboard request returns HTTP 401
- **WHEN** the refresh attempt fails due to network error, timeout, or 5xx
- **THEN** the dashboard SHALL mark the session as soft-expired
- **AND** the dashboard SHALL display the session-expired banner without navigating away

#### Scenario: Concurrent 401 requests are deduplicated
- **GIVEN** multiple authenticated business requests return HTTP 401 concurrently
- **WHEN** the dashboard attempts a silent refresh
- **THEN** only one refresh request SHALL be in flight
- **AND** all waiting requests SHALL reuse the same refresh result

## MODIFIED Requirements
### Requirement: Dashboard backend probe is low-frequency and passive
The dashboard SHALL rate-limit backend status probes and pause polling when the page is hidden, and MUST NOT mark the user session expired or trigger session refresh based solely on probe authorization failures.

#### Scenario: Hidden tab stops probing
- **GIVEN** the dashboard tab is hidden
- **WHEN** the page remains hidden for two intervals
- **THEN** no backend probe requests SHALL be issued until the tab becomes visible

#### Scenario: Unauthorized probe does not expire session
- **GIVEN** the dashboard has an authenticated session
- **WHEN** a backend probe returns HTTP 401
- **THEN** the dashboard SHALL NOT mark the session expired
- **AND** the dashboard SHALL NOT trigger a refresh attempt
- **AND** the connection status MAY surface the unauthorized state
