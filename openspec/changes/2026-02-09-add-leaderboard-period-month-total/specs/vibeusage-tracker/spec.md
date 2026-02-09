# Spec Delta: vibeusage-tracker (Leaderboard periods)

## MODIFIED Requirements

### Requirement: Leaderboard endpoint supports week|month|total periods
The system SHALL support `period=week|month|total` for `GET /functions/vibeusage-leaderboard`.

#### Scenario: User fetches monthly leaderboard
- **GIVEN** a user is signed in and has a valid `user_jwt`
- **WHEN** the user calls `GET /functions/vibeusage-leaderboard?period=month&metric=all`
- **THEN** the response SHALL include `from` and `to` for the current UTC calendar month (1st..last day)

#### Scenario: User fetches all-time leaderboard
- **GIVEN** a user is signed in and has a valid `user_jwt`
- **WHEN** the user calls `GET /functions/vibeusage-leaderboard?period=total&metric=all`
- **THEN** the response SHALL represent all-time as `from=1970-01-01` and `to=9999-12-31`

### Requirement: Leaderboard snapshots can be refreshed by automation
The system SHALL support `period=week|month|total` for `POST /functions/vibeusage-leaderboard-refresh`. When `period` is omitted, the system SHALL refresh `week` + `month`.

#### Scenario: Automation refreshes total
- **GIVEN** a valid service-role bearer token
- **WHEN** automation calls `POST /functions/vibeusage-leaderboard-refresh?period=total`
- **THEN** the response SHALL include one `results[]` entry for `period=total`

### Requirement: Dashboard renders leaderboard page with period selector
The dashboard SHALL render a period selector that maps `WEEK|MONTH|ALL` to `period=week|month|total`.

#### Scenario: User switches period
- **GIVEN** the user is on `/leaderboard`
- **WHEN** the user selects `MONTH`
- **THEN** the dashboard SHALL request `GET /functions/vibeusage-leaderboard?period=month&metric=all`

## ADDED Requirements

### Requirement: Leaderboard profile endpoint accepts period
The system SHALL support `period=week|month|total` for `GET /functions/vibeusage-leaderboard-profile?user_id=...&period=...`.

#### Scenario: User fetches public user's profile for month
- **GIVEN** a user is signed in and has a valid `user_jwt`
- **AND** the requested user has enabled public leaderboard profile
- **WHEN** the user calls `GET /functions/vibeusage-leaderboard-profile?user_id=<uuid>&period=month`
- **THEN** the response SHALL include `period=month` and the requested user's snapshot `entry`

