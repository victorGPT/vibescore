# Projects First-Usage Visibility Design

## Summary
Projects must **only appear after the first valid usage event**. Before that, the project module is **fully hidden** (no empty state, no placeholders). This must be enforced across all sources (Codex and other AI CLIs). The **Project** record is the single source of truth for visibility.

## Goals
- Show a project **only after** the first valid usage event for that project.
- Remove all empty/placeholder project states.
- Apply the same rule to **all sources** (Codex and other AI CLIs).
- Ensure deterministic, idempotent creation of Project records.
- Redirect direct project route access to **usage overview** when no projects exist.

## Non-Goals
- Pre-registering/scanning projects without usage.
- Showing any empty or onboarding state for projects.
- Dual-path compatibility logic for legacy behavior.

## Source of Truth
- **Project table** is the only authoritative source for whether a project exists/should be shown.
- Usage logs are factual records; visibility derives solely from Project records.

## Key Decisions
1. **First-usage creation**: Project is created on the first valid usage event.
2. **No empty UI**: If Project count is 0, project entry is not rendered at all.
3. **Route behavior**: Project routes are protected; when no projects exist, redirect to usage overview (avoid 404 but do not show empty state).
4. **Cross-source consistency**: All sources must generate a stable `project_key` so the same project is not duplicated.

## Data Model
- `project_key` (string, unique) — normalized identifier.
- `first_usage_at` (timestamp) — derived from first usage event.
- Optional: `source_first_seen` (string), `created_at`.

## `project_key` Normalization
Suggested input fields:
- `repo_root`
- `workspace_id`
- `source`

Normalize and hash into a stable key (e.g., `sha256(repo_root + workspace_id + source)`), with a deterministic normalization function. If inputs are missing or invalid, treat event as **non-project** and do not create a Project.

## Data Flow
1. **Usage Ingest**: Source sends usage event with `project_key` inputs and metadata.
2. **Normalize**: Server normalizes inputs and derives `project_key`.
3. **Upsert Project**: Insert on first use (idempotent, unique on `project_key`).
4. **UI Read**: Navigation and route guards read Project count to decide visibility.

## UI/UX Rules
- If `project_count == 0`: do not render any project navigation or module.
- If user visits a project route and count is 0: redirect to usage overview.
- No empty state or placeholder UI anywhere.

## Error Handling & Consistency
- **Idempotent ingest**: project creation uses `INSERT ... ON CONFLICT DO NOTHING`.
- **Invalid events**: missing/invalid inputs should never create a Project.
- **Observability**: log ingest errors; do not surface empty states.

## Testing Strategy
- **Unit tests**: key normalization, idempotent upsert.
- **Integration**: first event creates project; invalid event does not; duplicate events do not create duplicates.
- **Routing**: count=0 -> redirect to usage overview; count>0 -> project routes accessible.
- **Regression**: verify “no usage → hidden” and “first usage → visible”.

## Rollout Notes
- No compatibility shim or legacy dual-paths.
- Existing data is unaffected; visibility depends on Project count.

## Open Questions
- Finalize `project_key` formula across all sources (Codex + other AI CLIs).
