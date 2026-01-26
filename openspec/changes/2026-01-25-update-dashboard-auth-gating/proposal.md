# Change: Update dashboard auth gating for soft-expired sessions

## Why
Soft-expired dashboard sessions are still able to inject auth tokens in some paths, which can leak inconsistent auth state across hooks and requests. We need a single source of truth that forces guest mode when the session is soft-expired.

## What Changes
- Centralize dashboard auth token gating to a single helper/hook output.
- Treat soft-expired sessions as guest-only: no auth token injection.
- Apply the unified gating to all dashboard data hooks and entry points.

## Impact
- Affected specs: `openspec/specs/vibeusage-tracker/spec.md`
- Affected code: `dashboard/src/pages/DashboardPage.jsx`, `dashboard/src/hooks/**`, `dashboard/src/lib/*auth*`, `dashboard/src/lib/vibeusage-api.ts`
- Related changes: `openspec/changes/2026-01-19-update-dashboard-session-renewal`

## Approval
- Approved by user on 2026-01-25
