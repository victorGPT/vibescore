## ADDED Requirements
### Requirement: Leaderboard is served from precomputed snapshots
The system SHALL compute leaderboard rankings from a precomputed snapshot that is refreshed asynchronously, without changing the leaderboard API contract.

#### Scenario: Leaderboard reads from latest snapshot
- **GIVEN** a snapshot exists for `period=week` with `generated_at`
- **WHEN** a signed-in user calls `GET /functions/vibescore-leaderboard?period=week`
- **THEN** the response SHALL reflect the latest snapshot totals
- **AND** the response SHALL include the snapshot `generated_at`

### Requirement: Daily aggregates are precomputed for scale
The system SHALL maintain per-user UTC daily aggregates and serve usage summary/daily/heatmap from these aggregates rather than scanning raw events.

#### Scenario: Summary uses daily aggregates
- **GIVEN** daily aggregates exist for the requested range
- **WHEN** a user calls `GET /functions/vibescore-usage-summary`
- **THEN** totals SHALL be computed from the daily aggregates
