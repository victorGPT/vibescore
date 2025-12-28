# PR Template (Minimal)

## PR Goal (one sentence)
Collapse CORE_INDEX breakdown modules by default while keeping the main summary visible.

## Commit Narrative
- Commit 1: `feat(dashboard): collapse core index breakdown`

## Regression Test Gate
### Most likely regression surface
- CORE_INDEX header toggle, summary visibility, and breakdown rendering.

### Verification method (choose at least one)
- [x] Existing automated tests did not fail (commands: `node --test test/dashboard-core-index-collapse.test.js`, `node scripts/validate-copy-registry.cjs` => PASS; copy registry warnings unchanged: `landing.meta.*`, `usage.summary.since`, `dashboard.session.label`)
- [ ] Manual regression path executed

### Uncovered scope
- Mobile visual regression across multiple devices.
