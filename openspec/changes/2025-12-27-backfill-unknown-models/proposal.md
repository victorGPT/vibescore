# Change: Backfill unknown model totals within half-hour buckets

## Why
- "unknown" model buckets reduce the usefulness of model breakdowns even when known models exist in the same half-hour.

## What Changes
- Add a backfill step that reassigns unknown totals to the dominant known model within the same source + half-hour.
- Preserve known model separation; only unknown totals are reassigned.
- Keep unknown when no known models exist in a bucket.
- For `every-code` buckets that remain unknown, align model to the nearest `codex` dominant model (past or future).

## Impact
- Affected specs: vibeusage-tracker
- Affected code: src/lib/rollout.js (enqueue/aggregation path), tests in test/rollout-parser.test.js
- **BREAKING**: none (behavior change in model attribution only)

## Architecture / Flow
- Parse token_count events into per-bucket model totals.
- At enqueue, if known models exist, move unknown totals to the dominant known model.
- Keep unknown only when no known models exist.
- Post-pass: if `every-code` remains unknown, choose nearest `codex` bucket and use its dominant model.

## Risks & Mitigations
- Risk: unknown usage may be attributed to the dominant model even if it came from another model.
  - Mitigation: only backfill within the same half-hour and same source; no cross-file inference.
- Risk: every-code unknown may be aligned to a nearby codex model that is not the true model.
  - Mitigation: deterministic nearest-bucket selection; no cross-session inference.
- Risk: historical per-model distributions may change after re-sync.
  - Mitigation: document optional manual backfill flow and keep totals unchanged.

## Rollout / Milestones
- Update spec delta, implement parser changes, add tests, verify via node --test.

## Docs
- Module brief: module-brief.md
- Requirements analysis: requirements-analysis.md
