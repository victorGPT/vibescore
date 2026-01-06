# CLI Release 0.2.10 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish CLI v0.2.10 with the Opencode dedupe fixes and release verification records.

**Architecture:** Release-only changes: bump package version, update changelog, publish to npm, and record verification. No runtime architecture changes.

**Tech Stack:** Node.js (npm), Git tags, repo release docs.

---

### Task 1: Prepare release branch + baseline validation

**Files:** None

**Step 1: Ensure branch up to date**

Run: `git fetch origin`

Expected: no errors.

**Step 2: Refresh architecture canvas (required before planning)**

Run: `node scripts/ops/architecture-canvas.cjs`

Expected: `✓ 架构图已生成...`

**Step 3: Confirm clean baseline**

Run: `git status -s`

Expected: empty output.

**Step 4: Baseline tests**

Run: `npm test`

Expected: PASS (no failures).

---

### Task 2: Bump version and changelog

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `CHANGELOG.md`

**Step 1: Update package version**

Run: `npm version 0.2.10 --no-git-tag-version`

Expected: package.json + package-lock.json updated.

**Step 2: Update changelog**

Add a new `## [0.2.10] - 2026-01-06` section and move relevant entries from `[Unreleased]`.

**Step 3: Release verification tests (pre-publish)**

Run: `node --test test/rollout-parser.test.js`

Expected: PASS.

**Step 4: Commit release**

Run:
```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "release: 0.2.10"
```

---

### Task 3: Publish + tag

**Files:** None

**Step 1: Create git tag**

Run: `git tag v0.2.10`

Expected: tag created locally.

**Step 2: Pre-publish pack check**

Run: `node scripts/acceptance/npm-install-smoke.cjs`

Expected: `npm pack --dry-run ok...`.

**Step 3: Publish**

Run: `npm publish`

Expected: publish succeeds for `vibeusage@0.2.10`.

**Step 4: Post-publish smoke**

Run: `VIBESCORE_RUN_NPX=1 node scripts/acceptance/npm-install-smoke.cjs`

Expected: PASS.

---

### Task 4: Record release verification

**Files:**
- Create: `docs/pr/2026-01-06-release-0.2.10.md`
- Modify: `architecture.canvas` (if regenerated)

**Step 1: Write release record**

Include commit narrative, tests run, publish result, and tag.

**Step 2: Refresh architecture canvas (end-of-flow requirement)**

Run: `node scripts/ops/architecture-canvas.cjs`

Expected: `✓ 架构图已生成...`

**Step 3: Commit release record**

Run:
```bash
git add docs/pr/2026-01-06-release-0.2.10.md architecture.canvas
git commit -m "docs: record 0.2.10 release verification"
```

---

### Task 5: Push release

**Files:** None

**Step 1: Push commits to main**

Run: `git push origin HEAD:main`

**Step 2: Push tag**

Run: `git push origin v0.2.10`

---

Plan complete and saved to `docs/plans/2026-01-06-cli-release-0.2.10.md`.

Two execution options:

1. Subagent-Driven (this session)
2. Parallel Session (separate, use executing-plans)

Which approach?
