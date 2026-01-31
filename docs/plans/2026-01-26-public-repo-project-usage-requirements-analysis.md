# Requirement Analysis

## Goal
- Track project usage only for GitHub public repos, purge project usage for non-public/invalid repos, and keep system totals untouched.

## Scope
- In scope:
  - GitHub public verification from repo remote URL.
  - Pending/blocked states for project usage.
  - Local purge of project-scoped usage only.
  - Hash-only storage for local repo root.
- Out of scope:
  - Non-GitHub hosting (GitLab/Bitbucket).
  - Scanning arbitrary folders outside CLI execution context.
  - UI surface changes beyond optional notices.

## Users / Actors
- CLI user running Codex CLI locally.
- Ingest service receiving project usage batches.

## Inputs
- Local git remote URL (origin or first remote).
- GitHub API response for `GET /repos/{owner}/{repo}`.
- Token usage events already aggregated per half-hour.

## Outputs
- Project usage buckets for public repos only.
- Project registry rows with `project_key` and metadata.
- Local project usage purge for blocked repos.

## Business Rules
- Project usage is emitted and ingested only for verified public GitHub repos.
- Pending verification never uploads project usage.
- Blocked repos trigger local purge of project usage only.
- System totals are never deleted.
- Local repo root path is stored as a hash only.

## Assumptions
- GitHub API is the sole source of truth for public status.
- Rate limits are infrequent enough to handle with low retry count.
- Project usage queue is separate from system usage queue.

## Dependencies
- CLI rollout parsing + project bucket logic (`src/lib/rollout.js`).
- Project uploader (`src/lib/uploader.js`).
- Ingest function (`insforge-src/functions/vibeusage-ingest.js`).

## Risks
- GitHub rate limits causing long pending states.
- Misclassification due to malformed remotes.
- Purge logic accidentally touching system totals.
