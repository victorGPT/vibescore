## MODIFIED Requirements

### Requirement: Leaderboard endpoint is available (weekly only)
The system SHALL provide a weekly leaderboard endpoint that ranks users by `total_tokens` over the current UTC calendar week (Sunday start).

Token accounting:
- `gpt_tokens` SHALL be the sum of `total_tokens` for GPT-family models.
- `claude_tokens` SHALL be the sum of `billable_total_tokens` for Claude-family models (falling back to `total_tokens` when billable is missing).
- `total_tokens` SHALL equal `gpt_tokens + claude_tokens`.
- Rows with `model = "unknown"` SHALL be excluded.
- Buckets with `source = "canary"` SHALL be excluded.

Model family matching:
- GPT-family: `model LIKE 'gpt-%' OR model LIKE 'openai/%' OR model LIKE '%/gpt-%'`.
- Claude-family: `model LIKE 'claude-%' OR model LIKE 'anthropic/%' OR model LIKE '%/claude-%'`.

#### Scenario: User fetches the current weekly leaderboard
- **GIVEN** a user is signed in and has a valid `user_jwt`
- **WHEN** the user calls `GET /functions/vibeusage-leaderboard?period=week&limit=20&offset=0`
- **THEN** the response SHALL include `from` and `to` in `YYYY-MM-DD` (UTC)
- **AND** the response SHALL include pagination metadata: `page`, `limit`, `offset`, `total_entries`, `total_pages`
- **AND** the response SHALL include an ordered `entries` array sorted by `total_tokens` (desc)
- **AND** each entry SHALL include `rank`, `is_me`, `display_name`, `avatar_url`, `gpt_tokens`, `claude_tokens`, and `total_tokens`

### Requirement: Leaderboard response includes generation timestamp
The leaderboard endpoint SHALL include a `generated_at` timestamp indicating when the leaderboard data was produced.

#### Scenario: Response includes generated_at
- **GIVEN** a user is signed in and has a valid `user_jwt`
- **WHEN** the user calls `GET /functions/vibeusage-leaderboard?period=week`
- **THEN** the response SHALL include `generated_at` as an ISO timestamp

### Requirement: Leaderboard response includes `me`
The leaderboard endpoint SHALL include a `me` object that reports the current user's `rank`, `gpt_tokens`, `claude_tokens`, and `total_tokens`, even when the user is not present in the `entries` array.

#### Scenario: User is not in page but still receives `me`
- **GIVEN** a user is signed in and has a valid `user_jwt`
- **AND** the user is not within the requested page (`offset..offset+limit`)
- **WHEN** the user calls `GET /functions/vibeusage-leaderboard?period=week&limit=20&offset=0`
- **THEN** the response SHALL include a `me` object with the user's `rank`, `gpt_tokens`, `claude_tokens`, and `total_tokens`

### Requirement: Leaderboard snapshots can be refreshed by automation
The system SHALL expose an authenticated refresh endpoint that rebuilds the current UTC weekly leaderboard snapshots. It MUST accept an optional `period=week` query and return a structured JSON response (including errors) so automation can log actionable diagnostics per run.

#### Scenario: Automation logs refresh status
- **GIVEN** a valid service-role bearer token
- **WHEN** automation calls `POST /functions/vibeusage-leaderboard-refresh?period=week`
- **THEN** the response SHALL be JSON with `success: true` or `error`
- **AND** the automation log SHALL include the HTTP status code and response body

## ADDED Requirements

### Requirement: Dashboard renders weekly leaderboard page
The dashboard SHALL render a weekly leaderboard page at `/leaderboard`, including a Top 10 panel and a paginated full table.

#### Scenario: Signed-in user visits /leaderboard
- **GIVEN** the user is signed in
- **WHEN** the user visits `/leaderboard`
- **THEN** the dashboard SHALL request `GET /functions/vibeusage-leaderboard?period=week`
- **AND** the UI SHALL render a Top 10 section and a paginated table using the returned `entries`

### Requirement: Dashboard injects Top9 + Me into Top 10 when not in Top 10
When the signed-in user is not within the Top 10 ranks, the dashboard SHALL inject a "Me" card into the Top 10 panel as position 10 while keeping the displayed `rank` as the user's real rank.

#### Scenario: Me is outside top 10
- **GIVEN** the API returns `me.rank > 10`
- **WHEN** the dashboard renders the Top 10 panel
- **THEN** the UI SHALL render ranks `1..9` plus an injected "Me" card
- **AND** the injected card SHALL display `rank = me.rank` (not `10`)

