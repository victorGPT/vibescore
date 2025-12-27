# Test Strategy

## Objectives
- Ensure unknown totals are reassigned only when known models exist.
- Preserve known model separation.
- Maintain deterministic output and idempotency.
- Align every-code unknown buckets to nearest codex dominant model deterministically.

## Test Levels
- Unit:
  - Backfill behavior in rollout parser aggregation.
  - Tie-breaker determinism.
- Integration:
  - Parser -> queue output shape (optional).
- Regression:
  - Existing parser tests remain green.
- Performance:
  - Not required (no new heavy computation).

## Test Matrix
- Unknown backfill -> Unit -> CLI parser -> node --test test/rollout-parser.test.js
- Unknown preserved when no known -> Unit -> CLI parser -> node --test test/rollout-parser.test.js
- Known models not merged -> Unit -> CLI parser -> node --test test/rollout-parser.test.js
- Tie-breaker deterministic -> Unit -> CLI parser -> node --test test/rollout-parser.test.js
- Every-code aligns to nearest codex -> Unit -> CLI parser -> node --test test/rollout-parser.test.js
- Nearest codex tie-breaker -> Unit -> CLI parser -> node --test test/rollout-parser.test.js

## Environments
- Local Node.js test runner

## Automation Plan
- Extend existing node --test suites.

## Entry / Exit Criteria
- Entry: requirements + acceptance + spec delta complete.
- Exit: tests pass and verification report updated.

## Coverage Risks
- Optional manual re-sync behavior not automated.
