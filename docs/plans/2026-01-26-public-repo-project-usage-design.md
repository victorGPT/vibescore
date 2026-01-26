# Public Repo Project Usage Design

## Summary
Project-level usage is **only tracked and ingested for public GitHub repositories** that actually run the AI CLI. The system total usage remains **independent** and is never deleted. If a repo is not public (or cannot be verified), **only that project’s usage** is removed locally and is never uploaded.

## Goals
- Identify public GitHub repos **without requiring a user account input**.
- Track project usage **only after public verification**.
- Delete **project usage only** when repo is non-public; keep system total untouched.
- Keep user effort at **zero actions**.
- Make rate-limit handling safe (no false public attribution).

## Non-Goals
- Scanning all folders on disk.
- Inferring private repos by heuristics.
- Supporting non-GitHub hosting (GitLab/Bitbucket) in this phase.
- Uploading any usage for pending/blocked repos.

## Source of Truth
- `usage_system_totals`: global usage for this machine.
- `usage_projects`: per-repo usage, **only for public_verified** repos.

## Key Decisions
1. **Option B chosen**: derive repo from git remote when CLI runs in a git repo; no user account lookup.
2. **Public-first**: if not verified public, **do not track project usage**.
3. **Project cleanup only**: non-public → delete `usage_projects` rows; **do not touch** system totals.
4. **Pending is not counted**: pending state stores metadata only.
5. **Repo-identity merge**: multiple local clones of the same `owner/repo` map to one project.

## Data Flow (Client)
1. CLI runs → detect git root and parse remote to `owner/repo`.
2. If missing or non-GitHub remote → mark `blocked` with `invalid_remote` and **purge project usage**.
3. Verify public via GitHub API `GET /repos/{owner}/{repo}`; on success, use response `full_name` as canonical `repo_id` (lowercased).
4. If `private=false` → mark `public_verified` and allow project usage aggregation.
5. If `404` or `private=true` → mark `blocked` and **purge project usage**.
6. If `403` rate-limit or transient error → keep `pending_public`, retry with backoff.
7. If pending exceeds max retries or timeout window → mark `blocked` with `verification_timeout` and **purge project usage**.

## Data Flow (Ingest)
- Server accepts **only** `public_verified` project usage events.
- Pending/blocked projects are never uploaded.

## Data Model (Client)
- `usage_system_totals` (per-day or per-account): **always** accumulates.
- `usage_projects`:
  - `repo_id` (owner/repo)
  - `project_key` = canonical `repo_id` (GitHub `full_name`, lowercased)
  - `status` (public_verified | pending_public | blocked)
  - `blocked_reason` (non_public | rate_limit | invalid_remote | verification_timeout | error)
  - `usage_total_tokens`
  - `last_verified_at`
  - `repo_root_hash` (local path hash; not uploaded)

## Deletion Policy
- On `blocked`, delete only the project usage rows and any project-level file usage. **Never delete** `usage_system_totals`.
- Deletion scope is limited to repo-scoped tables (e.g., `usage_projects`, `usage_project_files`) and never touches system totals.

## UX
- Silent by default.
- Optional one-time notice when project usage is removed due to non-public status.
- Optional one-time notice that only GitHub public repos are supported for project usage.
- No repo name/path shown in UI for blocked projects.

## Error Handling
- Rate-limit → pending + backoff retries (e.g., 24h window, max 2 retries).
- Network failures → pending, never counted.
- Any hard signal of non-public → immediate project purge.

## Testing Strategy
- Unit: remote parsing, public check responses, status transitions.
- Integration: project purge vs system totals unaffected.
- Manual: public repo → counts; private repo → no project usage; rate-limit → pending.

## Rollout
- Client-only change first; server continues to accept public_verified only.
- No compatibility shims.

## Decisions
- Persist `repo_root_hash` only (no raw path stored).
