# PR Template (Minimal)

## PR Goal (one sentence)
Compact CORE_INDEX summary on small screens so billion-scale totals render legibly.

## Commit Narrative
- Commit 1: `feat(dashboard): compact mobile core index`

## Regression Test Gate
### Most likely regression surface
- Dashboard CORE_INDEX summary rendering and compact-number formatting.

### Verification method (choose at least one)
- [x] Existing automated tests did not fail (commands: `node --test test/compact-number.test.js`, `node scripts/validate-copy-registry.cjs` => PASS; copy registry warnings unchanged: `landing.meta.*`, `usage.summary.since`, `dashboard.session.label`)
- [ ] Manual regression path executed

### Uncovered scope
- Live mobile rendering on iOS/Android with extreme token values.
