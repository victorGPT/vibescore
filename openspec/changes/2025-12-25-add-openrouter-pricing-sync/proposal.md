# Change: Sync OpenRouter pricing into pricing profiles

## Why
- Keep pricing data current without manual edits while preserving auditability and replay.
- Align cost calculations with the latest OpenRouter model pricing.

## What Changes
- Add a pricing sync edge function that fetches OpenRouter Models API pricing and upserts into `vibescore_pricing_profiles`.
- Add a GitHub Actions schedule (every 6 hours) to trigger the sync endpoint.
- Extend pricing resolver to select a configured default model/source when multiple profiles exist.
- Add optional retention handling for old pricing rows (default: no purge).

## Impact
- Affected specs: `openspec/specs/vibeusage-tracker/spec.md`
- Affected code: `insforge-src/functions`, `insforge-src/shared`, `.github/workflows`, docs
- **BREAKING** (if any): None

## Architecture / Flow
- GitHub Actions (cron) -> `POST /functions/vibescore-pricing-sync`
- Pricing sync function -> OpenRouter Models API -> normalize pricing -> upsert `vibescore_pricing_profiles`
- Usage endpoints -> resolve pricing by configured model/source + effective date

## Risks & Mitigations
- External API changes -> strict schema validation + safe defaults + logging.
- Pricing unit mismatch -> convert using documented USD-per-token semantics and tests.
- Multiple models -> explicit model/source selection in resolver.

## Rollout / Milestones
- M1: Requirements + acceptance.
- M2: OpenSpec deltas approved.
- M3: Implementation + tests.
- M4: Deploy + verify.
