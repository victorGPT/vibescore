# Unknown Model Backfill Design (Half-hour Dominant Model)

## Summary
Reduce model = "unknown" by reassigning unknown token totals to the dominant known model within the same source + half-hour bucket. For `every-code`, if its bucket remains unknown, align its model to the nearest `codex` bucket’s dominant known model. Keep known models separate. If no known model exists, keep unknown.

## Goals
- Minimize unknown model buckets without cross-session inference.
- Preserve per-model separation for known models.
- Keep total token counts unchanged.
- Maintain idempotent sync behavior.
- Align `every-code` unknown buckets to the nearest `codex` dominant model (past or future).

## Non-Goals
- No backend or schema changes.
- No dashboard filtering changes.
- No per-session or per-thread attribution.

## Approach
Parse token_count events as usual, but accumulate per-bucket totals by model (including unknown). At enqueue time, choose the dominant known model (max total_tokens) and move unknown totals into it. If no known models exist, emit unknown as-is. After that, for `every-code` buckets that remain unknown, assign the model from the nearest `codex` bucket’s dominant known model (absolute time distance, past or future).

## Data Flow
rollout JSONL -> parseRolloutFile -> per-bucket modelTotals -> enqueueTouchedBuckets -> queue.jsonl -> uploader -> ingest

## Algorithm
- Track bucket.modelTotals: Map<model, totals>.
- When token_count arrives:
  - If current model is known, add delta to modelTotals[model].
  - If current model is unknown, add delta to modelTotals["unknown"].
- At enqueue (per source + half-hour):
  - If any known models exist, find dominant known model by total_tokens.
  - Add unknown totals into dominant known model.
  - Do not enqueue an unknown model bucket in that case.
  - If no known models exist, enqueue unknown as-is.
- Post-pass for `every-code` unknown:
  - Find nearest `codex` bucket by absolute time distance (past or future).
  - Use the dominant known model from that `codex` bucket.
  - If the nearest `codex` bucket has no known model, keep unknown.
- Tie-breakers:
  - Dominant model: deterministic (lexicographic model name).
  - Nearest `codex` bucket: deterministic (earlier hour_start when tied).

## Edge Cases
- Multiple known models within the same half-hour: keep both, only reassign unknown.
- Only unknown models in a half-hour: keep unknown (unless `every-code` aligns to `codex`).
- Identical dominant totals: select lexicographic to keep idempotent output.
- Nearest `codex` buckets equally distant: pick the earlier bucket.

## Risks
- Unknown may be attributed to a dominant known model even if it came from a different model in the same half-hour.
- `every-code` unknown may be attributed to a nearby `codex` model that does not match the actual model.
- Historical buckets may change if users re-run sync (expected).

## Verification
- Unit tests for backfill behavior and tie-breaker.
- Regression: repeat sync with no new events does not change totals.

## Rollout
- Ship as CLI parser change only.
- Optional manual backfill: remove cursors/queue and re-run sync to re-derive buckets.
