# User Data Reset and Model Reupload Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Remove a single user's VibeScore data from InsForge and re-upload model-aware usage from local logs.

**Architecture:** Execute user-scoped deletes in the InsForge SQL console to clear server-side rows. Purge local tracker state so the CLI re-parses all logs and re-uploads buckets with `model` populated when available. Verify row counts and model distribution after re-sync.

**Tech Stack:** PostgreSQL (InsForge), Node.js CLI (`@vibescore/tracker`), InsForge SQL console.

### Task 1: Resolve user_id by email

**Files:**
- Reference: `openspec/project.md`

**Step 1: Write the lookup query**

```sql
select id, email
from auth.users
where email = 'wuxuebin1993@gmail.com';
```

**Step 2: Run query to verify it returns exactly 1 row**

Run in InsForge SQL console.  
Expected: one row with `id` (UUID) and matching `email`.

**Step 3: Record the user_id**

Store the UUID for use in the deletion script (replace `<user-uuid>`).

### Task 2: Snapshot pre-delete row counts

**Files:**
- Reference: `openspec/project.md`

**Step 1: Write pre-delete count queries**

```sql
select 'hourly' as table, count(*) from public.vibescore_tracker_hourly where user_id = '<user-uuid>';
select 'events' as table, count(*) from public.vibescore_tracker_events where user_id = '<user-uuid>';
select 'ingest_batches' as table, count(*) from public.vibescore_tracker_ingest_batches where user_id = '<user-uuid>';
select 'device_tokens' as table, count(*) from public.vibescore_tracker_device_tokens where user_id = '<user-uuid>';
select 'devices' as table, count(*) from public.vibescore_tracker_devices where user_id = '<user-uuid>';
select 'user_settings' as table, count(*) from public.vibescore_user_settings where user_id = '<user-uuid>';
```

**Step 2: Run queries and capture counts**

Expected: counts are >= 0 (some may be 0).

### Task 3: Delete user-scoped rows

**Files:**
- Reference: `openspec/project.md`

**Step 1: Write delete transaction**

```sql
begin;

delete from public.vibescore_tracker_hourly where user_id = '<user-uuid>';
delete from public.vibescore_tracker_ingest_batches where user_id = '<user-uuid>';
delete from public.vibescore_tracker_events where user_id = '<user-uuid>';
delete from public.vibescore_tracker_device_tokens where user_id = '<user-uuid>';
delete from public.vibescore_tracker_devices where user_id = '<user-uuid>';
delete from public.vibescore_user_settings where user_id = '<user-uuid>';

commit;
```

**Step 2: Run delete transaction**

Run in InsForge SQL console.  
Expected: `DELETE` counts for each statement (may be 0 for legacy tables).

**Step 3: Re-run count queries**

Expected: all counts return 0 for the user.

### Task 4: Purge local tracker state and re-upload

**Files:**
- Reference: `src/commands/sync.js`

**Step 1: Purge local tracker state**

Run:
`npx --yes @vibescore/tracker uninstall --purge`

Expected: `.vibescore` removed.

**Step 2: Re-init tracker**

Run:
`npx --yes @vibescore/tracker init`

Expected: device token issued and stored.

**Step 3: Re-upload all logs**

Run:
`npx --yes @vibescore/tracker@latest sync --drain`

Expected: `Sync finished` with inserted rows.

### Task 5: Verify model reupload

**Files:**
- Reference: `openspec/changes/2025-12-25-add-usage-model/sql/001_add_model_to_hourly.sql`

**Step 1: Query model distribution**

```sql
select model, count(*) as rows
from public.vibescore_tracker_hourly
where user_id = '<user-uuid>'
group by model
order by rows desc;
```

**Step 2: Confirm model values**

Expected: `model` contains non-`unknown` values if logs contain model metadata.

**Step 3: Spot-check dashboard**

Load the dashboard and verify usage charts populate for the user.
