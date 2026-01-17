## ADDED Requirements
### Requirement: Usage debug payload for slow-query validation
When a usage endpoint is called with `debug=1`, the response MUST include a `debug` object with `request_id`, `status`, `query_ms`, `slow_threshold_ms`, and `slow_query`. The `debug` object MUST be absent when `debug` is not enabled.

#### Scenario: Debug payload returned when enabled
- **WHEN** a client calls `GET /functions/vibescore-usage-summary?from=YYYY-MM-DD&to=YYYY-MM-DD&debug=1`
- **THEN** the response SHALL include the `debug` object

#### Scenario: Debug payload omitted by default
- **WHEN** a client calls `GET /functions/vibescore-usage-summary?from=YYYY-MM-DD&to=YYYY-MM-DD`
- **THEN** the response SHALL NOT include the `debug` object
