# Runbook: Device Token Active Dedupe + Partial Unique Index

## Purpose
Ensure one active device token per `(user_id, device_id)` with a partial unique index and pre-dedupe.

## Preconditions
- Maintenance window agreed and **writes paused**.
- All write paths to `vibeusage_tracker_device_tokens` disabled (API, jobs, retries).
- If writes cannot be paused, **do not proceed**.
- **Must run outside a transaction** (required by `CREATE INDEX CONCURRENTLY`).

## Execution Steps (non-transactional)
**Example command (psql, no implicit transaction):**

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f openspec/changes/2026-01-25-refactor-backend-core/migrations/device-token-dedupe.sql
```

**Do not use migration runners that wrap files in a transaction.**

1) **Pre-scan duplicates**
   - Run SQL section **0)** in `migrations/device-token-dedupe.sql`.
   - Record any rows with `active_count > 1`.
2) **Estimate impact**
   - Run SQL section **1)** (`revoke_rows`) and record the count.
3) **Dedupe active tokens**
   - Run SQL section **2)** to set `revoked_at` on duplicates.
4) **Create partial unique index (CONCURRENTLY)**
   - Run SQL section **3)**.
5) **Post-check**
   - Run SQL section **4)**; expect zero duplicates.

## Evidence to Capture
- Pre-scan output (step 1)
- `revoke_rows` count (step 2)
- Post-check output (step 5)

## Rollback
- **Index-only rollback** (data changes are not reverted):
  - Run SQL section **5)** `drop index if exists vibeusage_tracker_device_tokens_active_uniq;`

## Risks
- If executed inside a transaction, `CREATE INDEX CONCURRENTLY` will fail.
- Data dedupe is **not reversible** without a backup table.

## References
- `openspec/changes/2026-01-25-refactor-backend-core/migrations/device-token-dedupe.sql`
- `openspec/changes/2026-01-25-refactor-backend-core/tasks.md`
