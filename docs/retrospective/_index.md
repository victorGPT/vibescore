# Retrospective Index (L1 Cards)

Use this file as the first filter. Read full docs only when card fields match your task.

> Migration status: new retros should use repo-scoped layout (`retrospective/<repo>/...`).
> Legacy flat files remain readable but should be migrated incrementally when touched.

## Repo: vibeusage

- **2026-02-14 — Leaderboard Public View Clickability + Mobile Landing Fallback**
  - path: `vibeusage/2026-02-14-leaderboard-public-view-clickability.md`
  - layer: `fullstack`
  - module: `leaderboard-public-view`
  - severity: `S2`
  - design_mismatch: `yes`
  - detection_gap: `yes`
  - reusable_for: `leaderboard`, `public share`, `mobile navigation`, `auth-gate`
  - summary: Replaced display-name inference with explicit `is_public` authorization and fixed mobile landing fallback caused by full-page navigation.

- **2026-02-14 — OpenClaw Usage Ingest Gap**
  - path: `vibeusage/2026-02-14-openclaw-ingest-gap.md`
  - layer: `backend`
  - module: `openclaw-sync`
  - severity: `S1`
  - design_mismatch: `yes`
  - detection_gap: `yes`
  - reusable_for: `ingest`, `hook lifecycle`, `sync diagnostics`, `backfill`
  - summary: Hook/upload looked healthy, but JSONL-first assumption broke; fallback+idempotency+backfill fixed missing `source=openclaw` usage.
