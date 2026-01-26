# Change: Add project usage totals (backend + CLI)

## Why
Projects need an objective “first usage” signal and an all‑time total token count without adding frontend dependencies.

## What Changes
- Add project registry and project usage hourly tables for idempotent storage.
- Extend CLI parsers to emit project‑scoped usage buckets **only** for GitHub public repos; non‑public repos are blocked and purged locally.
- Add GitHub public verification (pending/blocked states) and local project usage cleanup that never touches system totals.
- Extend ingest to upsert project registry + hourly usage and compute billable totals.

## Impact
- Affected specs: `vibeusage-projects`
- Affected code: CLI rollout parser + uploader, ingest function, DB schema
