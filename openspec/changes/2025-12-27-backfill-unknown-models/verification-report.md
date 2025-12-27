# Verification Report

## Scope
- CLI parser unknown backfill within half-hour buckets
- every-code alignment to nearest codex dominant model

## Tests Run
- node --test test/rollout-parser.test.js
- node --test test/*.test.js

## Results
- PASS (18 tests) for rollout parser suite.
- PASS (78 tests) for full test suite.

## Evidence
- node --test test/rollout-parser.test.js → 18/18 passing
- node --test test/*.test.js → 78/78 passing

## Remaining Risks
- Manual re-sync behavior not validated in this report.
