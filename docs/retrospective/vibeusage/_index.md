# vibeusage Retrospectives (L1 Cards)

- **2026-02-14 — Leaderboard Public View Clickability + Mobile Landing Fallback** (`fullstack`, `leaderboard-public-view`, `S2`)
  - file: `2026-02-14-leaderboard-public-view-clickability.md`
  - tags: `design_mismatch=yes`, `detection_gap=yes`
  - quick take: Replaced display-name inference with explicit `is_public` gating and fixed mobile nav auth fallback caused by full-page navigation.

- **2026-02-14 — OpenClaw Usage Ingest Gap** (`backend`, `openclaw-sync`, `S1`)
  - file: `2026-02-14-openclaw-ingest-gap.md`
  - tags: `design_mismatch=yes`, `detection_gap=yes`
  - quick take: JSONL-only assumption failed in production; fallback ingest + backfill restored data integrity.
