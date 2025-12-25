# PR Template (Minimal)

## PR Goal (one sentence)
Document pricing pipeline changes and add pricing resolver acceptance coverage.

## Commit Narrative
- Commit 1: `docs(openspec): update pricing pipeline change specs`
- Commit 2: `test: add pricing resolver acceptance`
- Commit 3: `docs: add pricing pipeline PR gate and freeze record`

## Rollback Semantics
- Reverting this PR removes pricing pipeline documentation, freeze record, and pricing resolver acceptance coverage.

## Hidden Context
- Requires `OPENROUTER_API_KEY` and `VIBESCORE_PRICING_SOURCE` configuration for live sync.

## Regression Test Gate
### Most likely regression surface
- Pricing resolver fallback behavior and cost totals in usage endpoints.

### Verification method (choose at least one)
- [x] Existing automated tests did not fail (commands: `node scripts/acceptance/pricing-resolver.cjs` => PASS, `node scripts/acceptance/openrouter-pricing-sync.cjs` => PASS, `node scripts/acceptance/usage-summary-aggregate.cjs` => PASS)
- [ ] New minimal test added (link or describe)
- [ ] Manual regression path executed (steps + expected result)

### Uncovered scope
- OpenRouter API schema drift and real cron trigger execution.
- Live database permissions for retention updates.

## Fast-Track (only if applicable)
- Statement: I manually verified **X** behavior on **Y** path did not regress.

## Notes
- High-risk modules touched: data writes, cron/scheduler, external API, pricing resolver.
