# Acceptance Criteria

## Feature: Finalize VibeUsage Rename

### Requirement: CLI and local runtime use only vibeusage naming
- WHEN only `VIBESCORE_*` env vars are set
- THEN the CLI ignores them and uses defaults or `VIBEUSAGE_*` only

### Requirement: API exposes only vibeusage endpoints
- WHEN a client calls `GET /functions/vibescore-usage-summary`
- THEN the request returns 404 (function not found)
- WHEN a client calls `GET /functions/vibeusage-usage-summary`
- THEN the request returns 200

### Requirement: DB objects renamed without data loss
- WHEN `vibescore_tracker_hourly` is renamed to `vibeusage_tracker_hourly`
- THEN row counts match before/after and constraints remain

### Requirement: Dashboard uses vibeusage envs and storage keys
- WHEN `VITE_VIBEUSAGE_MOCK=1` is set
- THEN the UI uses mock data and ignores `VITE_VIBESCORE_*`

### Requirement: Runtime code paths contain no vibescore references
- WHEN searching runtime code (`bin/`, `src/`, `dashboard/`, `insforge-src/`, `scripts/`)
- THEN no `vibescore` references remain
