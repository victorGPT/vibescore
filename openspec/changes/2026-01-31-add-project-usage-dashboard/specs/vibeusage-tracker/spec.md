## ADDED Requirements
### Requirement: Project usage summary endpoint
The system SHALL provide an authenticated endpoint that returns top repositories by token usage for the current user.

#### Scenario: Top projects by tokens
- **GIVEN** a user with project usage data
- **WHEN** the client calls `GET /functions/vibeusage-project-usage-summary?limit=3`
- **THEN** the response SHALL include `entries` sorted by token usage descending
- **AND** each entry SHALL include `project_key`, `project_ref`, `total_tokens`, and `billable_total_tokens`

### Requirement: Dashboard project usage cards
The dashboard SHALL display a GitHub-style project card list with owner avatar/name, repository name, star count, and token usage.

#### Scenario: Default card list and limit
- **GIVEN** the dashboard is loaded
- **WHEN** project usage data is available
- **THEN** the UI SHALL show the top 3 repositories by token usage by default
- **AND** the user SHALL be able to switch to top 6 or top 10 via a dropdown
