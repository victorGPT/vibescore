## ADDED Requirements
### Requirement: Usage endpoints accept dashboard timezone
The system SHALL allow the dashboard to request usage aggregates in a specified timezone using `tz` (IANA) or `tz_offset_minutes` (fixed offset). When timezone parameters are omitted, usage endpoints SHALL default to UTC behavior.

#### Scenario: Dashboard requests local daily aggregates
- **GIVEN** a signed-in user
- **WHEN** the dashboard calls `GET /functions/vibescore-usage-daily?from=YYYY-MM-DD&to=YYYY-MM-DD&tz=America/Los_Angeles`
- **THEN** the response `day` keys SHALL align to the requested local calendar dates
- **AND** missing local days SHALL be represented as zero activity

## MODIFIED Requirements
### Requirement: Dashboard provides a GitHub-inspired activity heatmap
The dashboard UI SHALL render an activity heatmap derived from daily token usage in the dashboard's local timezone, inspired by GitHub contribution graphs.

#### Scenario: Heatmap is derived from local daily totals
- **GIVEN** the user is signed in and the dashboard provides timezone parameters
- **WHEN** the dashboard fetches daily totals for a rolling range (e.g., last 52 weeks)
- **THEN** the UI SHALL derive heatmap intensity levels (0..4) from `total_tokens` per local day
- **AND** missing days SHALL be treated as zero activity

### Requirement: Dashboard does not support custom date filters
The dashboard UI MUST NOT provide arbitrary date range inputs. It SHALL only allow selecting a fixed `period` of `day`, `week` (Monday start), `month`, or `total`, computed in the browser timezone.

#### Scenario: User can only switch predefined periods
- **GIVEN** the user is signed in
- **WHEN** the user views the dashboard query controls
- **THEN** the UI SHALL NOT present any `from/to` date picker inputs
- **AND** the UI SHALL allow selecting only `day|week|month|total`
