# Fix Test Failures Due To Missing Dependencies Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore local test execution by installing declared dependencies and re-running the failing tests.

**Architecture:** No production code changes. Align local environment with declared dependencies, then re-run tests and record results in OpenSpec tasks.

**Tech Stack:** Node.js, npm, Node test runner.

### Task 1: Capture failing tests (RED)

**Files:**
- Modify: `openspec/changes/2026-01-19-update-dashboard-session-renewal/tasks.md`

**Step 1: Run the full test suite to reproduce failures**

Run: `npm test`
Expected: FAIL with missing modules (`esbuild`, `@insforge/sdk`) in build and dashboard function-path tests.

**Step 2: Record failing command and failures**

Update `openspec/changes/2026-01-19-update-dashboard-session-renewal/tasks.md` with command and failure list.

### Task 2: Install dependencies (GREEN)

**Files:**
- Modify: `openspec/changes/2026-01-19-update-dashboard-session-renewal/tasks.md`

**Step 1: Install dependencies**

Run: `npm install`
Expected: Dependencies installed without errors.

**Step 2: Re-run previously failing tests**

Run: `node --test test/build-insforge-functions-cleanup.test.js`
Expected: PASS.

Run: `node --test test/dashboard-function-path.test.js`
Expected: PASS.

**Step 3: Re-run the full test suite**

Run: `npm test`
Expected: PASS.

**Step 4: Record the passing commands**

Update `openspec/changes/2026-01-19-update-dashboard-session-renewal/tasks.md` with the passing command outputs.

### Task 3: Close out

**Step 1: Re-run architecture canvas sync**

Run: `node scripts/ops/architecture-canvas.cjs`
Expected: Canvas regenerated without errors.

**Step 2: Commit documentation updates**

Run:
```bash
git add docs/plans/2026-01-19-test-failures-deps-design.md docs/plans/2026-01-19-fix-test-deps.md openspec/changes/2026-01-19-update-dashboard-session-renewal/tasks.md
git commit -m "docs: record test dependency fix plan"
```
Expected: Commit created locally.
