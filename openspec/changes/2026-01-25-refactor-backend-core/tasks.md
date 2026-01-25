## 1. Implementation
- [ ] 1.1 Create shared core module boundaries (`insforge-src/shared/core/*`).
- [ ] 1.2 Create db access layer (`insforge-src/shared/db/*`) with query builders + RPC wrappers.
- [ ] 1.3 Migrate ingest + usage-summary to core/db.
- [ ] 1.4 Migrate remaining Edge Functions to core/db.
- [ ] 1.5 Align RLS helper contract and policies to single helper.
- [ ] 1.6 Review indexes for usage queries and adjust if needed.
- [ ] 1.7 Add partial unique index for active device tokens (`user_id, device_id` WHERE `revoked_at IS NULL`) + UPSERT in device-token-issue using `ON CONFLICT (user_id, device_id) WHERE revoked_at IS NULL` to return existing token.
- [ ] 1.7a Add pre-migration dedupe for active device tokens (keep latest by `created_at`, fallback `last_used_at`; set `revoked_at` for others) + record dedupe counts.
- [ ] 1.8 Add SQL migration/backfill/rollback steps for DB/RLS changes (see `openspec/changes/2026-01-25-refactor-backend-core/migrations/device-token-dedupe.sql`, run outside transaction for CONCURRENTLY).
- [ ] 1.8a Confirm maintenance window and pause writes before dedupe/index runbook; record confirmation.
- [ ] 1.8b Execute via runbook `openspec/changes/2026-01-25-refactor-backend-core/runbook-device-token-dedupe.md` and capture evidence.
- [ ] 1.8c Run Insforge2 DB validator (`scripts/ops/insforge2-db-validate.cjs`) after migrations and record clean Q1-Q4 outputs.
- [ ] 1.9 Update CLI/Dashboard call paths for hard cutover (no dual path) + handle replay-safe token response.
- [ ] 1.10 Regenerate InsForge functions (`npm run build:insforge`).

## 2. Tests
- [ ] 2.1 Add/adjust unit tests for core/db modules.
- [ ] 2.2 Update integration tests for endpoints.
- [ ] 2.3 Run regression suite (`node --test test/*.test.js`).
- [ ] 2.4 Add replay/idempotency checks for device token issue + ingest.

## 3. Docs
- [ ] 3.1 Update `BACKEND_API.md` if contract changes.
- [ ] 3.2 Record verification commands/results.

## Verification
- [ ] `npm run build:insforge:check`
- [ ] `node --test test/*.test.js`
- [ ] `VIBEUSAGE_INSFORGE_BASE_URL=... VIBEUSAGE_SERVICE_ROLE_KEY=... node scripts/ops/insforge2-db-validate.cjs`
