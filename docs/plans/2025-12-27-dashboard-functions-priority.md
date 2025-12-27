# Dashboard Functions Path Priority Rollback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore dashboard function requests to prefer `/functions` and fall back to `/api/functions` only on 404, preventing admin API usage in browser calls.

**Architecture:** Keep a primary/legacy path resolver but invert the priority. Requests should go to `/functions/<slug>` first; only if that returns 404 should we retry `/api/functions/<slug>`. Tests and docs must reflect the updated preference.

**Tech Stack:** Node.js tests (`node --test`), Vite dashboard code, OpenSpec.

### Task 1: Update tests for new priority (RED → GREEN)

**Files:**
- Modify: `test/dashboard-function-path.test.js`

**Step 1: Write the failing test**

```js
// prefer /functions, fallback to /api/functions on 404
```

**Step 2: Run test to verify it fails**

Run:
```
node --test test/dashboard-function-path.test.js
```
Expected: FAIL (assertions expect `/functions` first).

**Step 3: Write minimal implementation**

Update request path constants in `dashboard/src/lib/vibescore-api.js` to prefer `/functions`.

**Step 4: Run test to verify it passes**

Run:
```
node --test test/dashboard-function-path.test.js
```
Expected: PASS.

**Step 5: Commit**

```bash
git add test/dashboard-function-path.test.js dashboard/src/lib/vibescore-api.js
```

### Task 2: Update docs + OpenSpec deltas

**Files:**
- Modify: `docs/dashboard/api.md`
- Modify: `openspec/changes/2025-12-26-fix-dashboard-functions-path/requirements-analysis.md`
- Modify: `openspec/changes/2025-12-26-fix-dashboard-functions-path/acceptance-criteria.md`
- Modify: `openspec/changes/2025-12-26-fix-dashboard-functions-path/proposal.md`
- Modify: `openspec/changes/2025-12-26-fix-dashboard-functions-path/test-strategy.md`
- Modify: `openspec/changes/2025-12-26-fix-dashboard-functions-path/tasks.md`
- Modify: `openspec/changes/2025-12-26-fix-dashboard-functions-path/verification-report.md`

**Step 1: Update docs**
- Document `/functions` as the preferred path.
- Note `/api/functions` only as 404 fallback.

**Step 2: Update OpenSpec delta text**
- Update requirements + scenarios to reflect new priority.

**Step 3: Validate OpenSpec**

Run:
```
openspec validate 2025-12-26-fix-dashboard-functions-path --strict
```
Expected: PASS.

**Step 4: Commit**

```bash
git add docs/dashboard/api.md openspec/changes/2025-12-26-fix-dashboard-functions-path
```
