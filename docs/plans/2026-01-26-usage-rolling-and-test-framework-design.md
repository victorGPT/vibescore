# Usage Rolling Metrics + Frontend Test Framework Design

## Goal
Add rolling usage metrics (last 7 days, last 30 days, average per active day) to the dashboard and API, and introduce a maintainable frontend test framework (Vitest + React Testing Library) with a minimal interactive example.

## Context
- Dashboard is Vite + React with Tailwind; no unit/component test framework currently.
- Backend usage summary API already exists and is timezone-aware for input date ranges; rollups remain UTC-aligned.
- Copy registry requires all UI strings to live in `dashboard/src/content/copy.csv`.

## Decisions
- **API:** Extend `vibeusage-usage-summary` response with optional `rolling` payload behind `rolling=1` query param (default off to preserve existing behavior and cost).
- **Rolling windows:** Rolling 7d and 30d are computed by UTC day (aligned with `vibeusage_tracker_daily_rollup.day`). Average = total billable tokens / active days (days with `billable_total_tokens ?? total_tokens > 0`).
- **UI:** Add a new module below `UsagePanel` using `AsciiBox`, three columns with label on top and value below. Strings come from `copy.csv`.
- **Frontend tests:** Add Vitest + RTL with `jest-dom` and `user-event`. Provide a minimal interactive test using an existing component (MatrixButton) to validate render + interaction. Keep Playwright for E2E.

## API Contract Additions
- New query param: `rolling=1`
- New response field (when `rolling=1`):
  ```json
  {
    "rolling": {
      "last_7d": {
        "from": "YYYY-MM-DD",
        "to": "YYYY-MM-DD",
        "totals": { "billable_total_tokens": "..." },
        "active_days": 3,
        "avg_per_active_day": "..."
      },
      "last_30d": { "..." }
    }
  }
  ```

## UI Requirements
- New module titled by copy key.
- Three fields: last 7 days, last 30 days, average per active day.
- Uses existing UI primitives and `toDisplayNumber` formatting.

## Test Coverage
- Edge function test for `rolling=1` response shape and active day math.
- Component test for MatrixButton with `user-event` + `jest-dom` matchers.

## Risks / Mitigations
- **Timezone mismatch:** Use existing `getUsageTimeZoneContext` to align with current API behavior.
- **Performance:** Only compute rolling when `rolling=1` is provided.
- **Copy compliance:** All new UI strings via copy registry and validation scripts.
