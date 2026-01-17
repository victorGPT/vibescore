## ADDED Requirements

### Requirement: UTC daily rollup is maintained from hourly buckets
The system SHALL maintain a UTC daily rollup table keyed by `user_id + day + source + model`, derived from `vibescore_tracker_hourly`. Rollup updates MUST be idempotent and replayable.

#### Scenario: Hourly upsert updates rollup totals
- **GIVEN** an hourly bucket upsert for a user
- **WHEN** the row is inserted or updated
- **THEN** the daily rollup for the corresponding UTC day SHALL reflect the delta

### Requirement: Usage summary uses rollup for full UTC days
`GET /functions/vibescore-usage-summary` SHALL compute totals using daily rollup rows for full UTC days inside the range, and SHALL compute boundary partial days from hourly buckets.

#### Scenario: Summary uses rollup + boundaries
- **GIVEN** a range covering more than one UTC day
- **WHEN** a user requests usage summary
- **THEN** full UTC days SHALL be read from rollup
- **AND** boundary partial days SHALL be summed from hourly buckets

### Requirement: Usage daily returns backend summary
`GET /functions/vibescore-usage-daily` SHALL include a backend-computed `summary` object so the dashboard does not compute totals locally.

#### Scenario: Daily response includes summary
- **WHEN** a user requests usage daily for any range
- **THEN** the response SHALL include `summary.totals` with token totals

## MODIFIED Requirements

### Requirement: Summary is backend-derived when daily rows exist
When daily rows are fetched, the dashboard MUST NOT compute summary locally. It SHALL use backend-provided totals, either from `GET /functions/vibescore-usage-summary` or from the `summary` field in the daily response.

#### Scenario: Dashboard uses backend summary
- **GIVEN** `period=month`
- **WHEN** the dashboard refreshes usage data
- **THEN** it SHALL use backend summary totals
- **AND** it SHALL NOT compute summary from daily rows on the client

### Requirement: Usage summary prefers rollup aggregation
The system MUST prefer rollup aggregation for `usage-summary` and MUST fall back to hourly aggregation if rollup data is unavailable.

#### Scenario: Rollup unavailable
- **GIVEN** rollup data is missing or unavailable
- **WHEN** a user requests usage summary
- **THEN** the endpoint SHALL fall back to hourly aggregation without changing response fields
