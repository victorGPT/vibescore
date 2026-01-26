# Design: Project usage totals (backend + CLI)

## Context
We need project‑level totals derived from existing CLI usage, with no frontend changes. The ingest path is already idempotent for half‑hour usage buckets.

## Approach
1) **CLI** resolves `project_ref` from the repo remote URL and verifies GitHub public status; only `public_verified` repos emit project buckets.
2) **CLI** marks `pending_public` on rate-limit/temporary errors and `blocked` on non-public/invalid remotes; blocked repos trigger local project-usage purge only.
3) **Ingest core** validates `project_hourly` buckets and builds rows deduped by `(hour_start, source, project_key)`.
4) **DB ingest helpers** upsert rows into `vibeusage_project_usage_hourly` keyed by `(user_id, project_key, hour_start, source)` and upsert `vibeusage_projects` keyed by `(user_id, project_key)`.

## Data Flow
CLI → `vibeusage-ingest` (hourly + project_hourly for public_verified only) →
- `vibeusage_project_usage_hourly` (idempotent per hour)
- `vibeusage_projects` (first/last seen)

## Idempotency
Using half‑hour buckets and a deterministic unique key prevents double counting when uploads are retried.

## Token Totals
Project totals are computed as a **sum** of hourly buckets. Hourly rows store input, cached input, output, reasoning, and total token fields as provided by the client.

## Privacy
Local storage keeps `repo_root_hash` only (no raw path) to minimize sensitive path exposure.
