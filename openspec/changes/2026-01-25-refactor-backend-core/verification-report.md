# Verification Report (Planned)

## Scope
- Edge Functions refactor correctness
- DB/RLS contract alignment
- Build artifact consistency

## Planned Tests
- `npm run build:insforge:check`
- `node --test test/*.test.js`
- `VIBEUSAGE_INSFORGE_BASE_URL=... VIBEUSAGE_SERVICE_ROLE_KEY=... node scripts/ops/insforge2-db-validate.cjs`
- Targeted endpoint checks:
  - `POST /functions/vibeusage-device-token-issue`
  - `POST /functions/vibeusage-ingest`
  - `GET /functions/vibeusage-usage-summary`
  - `GET /functions/vibeusage-usage-daily`
  - `GET /functions/vibeusage-usage-hourly`
  - `GET /functions/vibeusage-usage-heatmap`
  - `GET /functions/vibeusage-usage-monthly`
  - `GET /functions/vibeusage-usage-model-breakdown`
- Runbook: `openspec/changes/2026-01-25-refactor-backend-core/runbook-device-token-dedupe.md`

## Expected Signals
- All tests pass.
- No regression in response schema.
- Query paths respect index prefixes (EXPLAIN/metrics).
- Insforge2 DB validator (Q1-Q4) reports clean.
- Device token issue replay returns the same token; active token count remains 1 for the same `user_id + device_id`.
- Ingest replay does not increase rows for the same bucket.
- If historical duplicates exist, only the latest active token remains after migration; others are revoked.
- P95 for usage queries ≤ 2000ms (measured via handler timing or DB timing).

## Execution Notes (planned)
- **Maintenance window**
  - Confirm maintenance window active and write paths paused (API, jobs, retries) before runbook execution.
- **Device token replay check**
  - Call `POST /functions/vibeusage-device-token-issue` twice with the same `user_id + device_id`.
  - SQL: `select count(*) from vibeusage_tracker_device_tokens where user_id = $1 and device_id = $2 and revoked_at is null;` → expect `1`.
- **Pre-migration duplicate scan (if any)**
  - SQL: `select user_id, device_id, count(*) from vibeusage_tracker_device_tokens where revoked_at is null group by user_id, device_id having count(*) > 1;` → expect `0` after migration.
- **Insforge2 DB validator**
  - Run: `VIBEUSAGE_INSFORGE_BASE_URL=... VIBEUSAGE_SERVICE_ROLE_KEY=... node scripts/ops/insforge2-db-validate.cjs` → expect Q1-Q4 clean.
- **Ingest replay check**
  - Send the same bucket payload twice.
  - SQL: `select count(*) from vibeusage_tracker_hourly where user_id = $1 and device_id = $2 and source = $3 and model = $4 and hour_start = $5;` → expect `1`.
- **P95 performance check**
  - Execute `GET /functions/vibeusage-usage-summary` (and other usage endpoints) N≥50 times.
  - Compute P95 from handler timing or DB timing logs; verify `≤ 2000ms`.

## Evidence
- 2026-01-25: `node --test test/insforge-src-core-db.test.js` (PASS)
- 2026-01-25: `node --test test/*.test.js` (PASS)
- 2026-01-25: `npm run build:insforge:check` (PASS)
