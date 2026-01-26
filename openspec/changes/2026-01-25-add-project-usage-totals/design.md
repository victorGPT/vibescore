# Design: Project usage totals (backend + CLI)

## Context
We need project‑level totals derived from existing CLI usage, with no frontend changes. The ingest path is already idempotent for half‑hour usage buckets.

## Approach
1) **CLI** resolves `project_ref` from the repo remote URL and aggregates usage deltas into half‑hour buckets per project.
2) **Ingest core** validates `project_hourly` buckets and builds rows deduped by `(hour_start, source, project_key)`.
3) **DB ingest helpers** upsert rows into `vibeusage_project_usage_hourly` keyed by `(user_id, project_key, hour_start, source)` and upsert `vibeusage_projects` keyed by `(user_id, project_key)`.

## Data Flow
CLI → `vibeusage-ingest` (hourly + project_hourly) →
- `vibeusage_project_usage_hourly` (idempotent per hour)
- `vibeusage_projects` (first/last seen)

## Idempotency
Using half‑hour buckets and a deterministic unique key prevents double counting when uploads are retried.

## Token Totals
Project totals are computed as a **sum** of hourly buckets. Hourly rows store input, cached input, output, reasoning, and total token fields as provided by the client.
