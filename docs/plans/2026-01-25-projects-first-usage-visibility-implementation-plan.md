# Projects Usage Totals (Backend + CLI) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Capture project usage (all‑time total tokens) at ingest time, derived from CLI usage sources, without any frontend changes.

**Key Decisions (confirmed):**
- **Scope:** Backend + CLI only (no dashboard work).
- **Project reference:** Repository remote URL (canonicalized) as `project_ref`.
- **Usage metric:** All‑time totals, including cached/other token types when present.
- **Model granularity:** None (cross‑model totals only).

**Architecture (MVP):**
CLI computes project‑scoped token deltas per hour bucket, sends them alongside the existing hourly usage payload. The ingest function upserts project registry metadata and stores project usage per hour for idempotency. Totals are computed as `SUM()` when needed (or later materialized), with `billable_total_tokens` computed using existing source‑specific rules.

**Tech Stack:** Node.js (CommonJS CLI), InsForge edge functions, PostgreSQL (InsForge).

---

## Task 1: OpenSpec change proposal (required before implementation)

**Change ID (proposed):** `2026-01-25-add-project-usage-totals`

**Files:**
- Create: `openspec/changes/2026-01-25-add-project-usage-totals/proposal.md`
- Create: `openspec/changes/2026-01-25-add-project-usage-totals/tasks.md`
- Create: `openspec/changes/2026-01-25-add-project-usage-totals/design.md`
- Create: `openspec/changes/2026-01-25-add-project-usage-totals/specs/vibeusage-projects/spec.md`

**Proposal summary:**
- Add project registry + project usage hourly storage.
- Extend CLI parsers to emit project‑scoped usage.
- Extend ingest to upsert project usage + registry.

**Validate:** `openspec validate 2026-01-25-add-project-usage-totals --strict`

---

## Task 2: DB schema (OpenSpec SQL)

**Files:**
- Create: `openspec/changes/2026-01-25-add-project-usage-totals/sql/001_create_usage_projects.sql`

**Tables:**
1) `public.vibeusage_projects`
- Registry for `project_ref` per user
- Fields: `project_id`, `user_id`, `device_id`, `device_token_id`, `project_key`, `project_ref`, `source`, `first_seen_at`, `last_seen_at`

2) `public.vibeusage_project_usage_hourly`
- Idempotent hourly project usage
- Unique key: `(user_id, project_key, hour_start, source)`
- Fields: `usage_id`, `user_id`, `device_id`, `device_token_id`, `project_key`, `project_ref`, `source`, `hour_start`,
  `input_tokens`, `cached_input_tokens`, `output_tokens`, `reasoning_output_tokens`, `total_tokens`,
  `billable_total_tokens`, `billable_rule_version`, `updated_at`

---

## Task 3: CLI emits project‑scoped usage (TDD)

**Files:**
- Modify: `src/lib/rollout.js`
- Modify: `src/commands/sync.js`
- Test: `test/rollout-parser.test.js`

**Behavior:**
- Resolve `project_ref` from Git remote URL for each session directory.
- Aggregate usage deltas per `project_ref` per hour bucket (same hour_start alignment).
- Emit alongside existing hourly payload, e.g. `project_hourly: []` with the same token fields.

---

## Task 4: Uploader sends project usage payload

**Files:**
- Modify: `src/lib/uploader.js`
- Test: `test/uploader.test.js`

**Behavior:**
- Include `project_hourly` in upload payload even if there are no hourly buckets (projects‑only upload supported).
- Keep payload backward compatible for existing ingest (server will accept optional `project_hourly`).

---

## Task 5: Ingest stores project usage + registry

**Files:**
- Modify: `insforge-src/functions/vibeusage-ingest.js`
- Test: `test/edge-functions.test.js`

**Behavior:**
- Parse `project_hourly` buckets, normalize tokens, compute `billable_total_tokens` using existing rules.
- Upsert `vibeusage_project_usage_hourly` with `on conflict` on `(user_id, project_key, hour_start, source)`.
- Upsert `vibeusage_projects` to set `first_seen_at/last_seen_at` and track `project_ref`.

---

## Task 6: Build + validate

- Run InsForge build/update if required by project workflow.
- Update tests to cover new project payload and idempotency.

---

## Task 7: Update architecture canvas

- Run: `node scripts/ops/architecture-canvas.cjs`
- Ensure the new tables and ingest flow are reflected.
