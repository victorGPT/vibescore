# Change: Add pricing table for cost calculation

## Why
- Pricing must be maintained as data (auditable, updatable) rather than hardcoded constants.

## What Changes
- Add a pricing table with effective dates.
- Update pricing resolver to read the table with fallback to default profile.
- Ensure usage endpoints return pricing metadata derived from table.

## Impact
- Affected specs: `vibeusage-tracker`.
- Affected code: pricing helper, usage endpoints, migrations, docs.
- **BREAKING**: None (fallback preserves behavior).

## Architecture / Flow
- Endpoint -> resolve pricing profile (DB lookup) -> compute cost -> respond.

## Risks & Mitigations
- Missing table rows -> fallback to default profile.
- Performance -> cache the resolved profile per request.

## Rollout / Milestones
- M1 Requirements & Acceptance
- M2 Proposal + Spec Delta
- M3 Resolver + Tests
- M4 Integration Verification
- M5 Deploy + Docs
