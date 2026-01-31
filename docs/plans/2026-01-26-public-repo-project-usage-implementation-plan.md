# Public Repo Project Usage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enforce GitHub-public-only project usage, with pending/blocked states, project-only purge, and repo_root_hash storage while keeping system totals intact.

**Architecture:** Add a public repo verification helper used by rollout parsing to gate project buckets. Extend project state to store per-repo status + repo_root_hash and perform local purge for blocked repos by rewriting project queues. Client never uploads project usage unless public_verified.

**Tech Stack:** Node.js (CommonJS), node:test, fetch (Node 18), local JSONL queues, InsForge edge functions.

### Task 1: Public repo verification helper

**Files:**
- Create: `src/lib/vibeusage-public-repo.js`
- Test: `test/public-repo-verification.test.js`

**Step 1: Write the failing test**

```js
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { hashRepoRoot, parseGitHubRepoId } = require('../src/lib/vibeusage-public-repo');

test('parseGitHubRepoId extracts owner/repo from canonical ref', () => {
  const res = parseGitHubRepoId('https://github.com/Acme/Alpha');
  assert.equal(res.repoId, 'acme/alpha');
});

test('hashRepoRoot returns stable hex hash', () => {
  const a = hashRepoRoot('/tmp/repo');
  const b = hashRepoRoot('/tmp/repo');
  assert.equal(a, b);
  assert.equal(a.length, 64);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/public-repo-verification.test.js`
Expected: FAIL (module not found / function missing)

**Step 3: Write minimal implementation**

```js
const crypto = require('node:crypto');

function parseGitHubRepoId(projectRef) {
  // Accept canonical https://github.com/owner/repo
  // Return { owner, repo, repoId } or null
}

function hashRepoRoot(repoRoot) {
  return crypto.createHash('sha256').update(String(repoRoot)).digest('hex');
}

module.exports = { parseGitHubRepoId, hashRepoRoot };
```

**Step 4: Run test to verify it passes**

Run: `node --test test/public-repo-verification.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/vibeusage-public-repo.js test/public-repo-verification.test.js
git commit -m "feat: add public repo helper"
```

### Task 2: Gate project buckets on public verification

**Files:**
- Modify: `src/lib/rollout.js`
- Modify: `test/rollout-parser.test.js`

**Step 1: Write the failing test**

Update `test/rollout-parser.test.js` to inject a stub public resolver that returns `public_verified` and expect `project_key` to be `acme/alpha` (not URL). Add a blocked scenario expecting zero queued buckets.

```js
await parseRolloutIncremental({
  rolloutFiles: [rolloutPath],
  cursors,
  queuePath,
  projectQueuePath,
  publicRepoResolver: async () => ({
    status: 'public_verified',
    projectKey: 'acme/alpha',
    projectRef: 'https://github.com/acme/alpha'
  })
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/rollout-parser.test.js`
Expected: FAIL (publicRepoResolver not supported / project_key mismatch)

**Step 3: Write minimal implementation**

- Extend `normalizeProjectState` to include `projects` map.
- Replace `resolveProjectRefForPath` usage with a new `resolveProjectMetaForPath` returning `{ projectRef, repoRoot }`.
- Add optional `publicRepoResolver` param to all `parse*Incremental` functions.
- Use `publicRepoResolver` (default: GitHub fetch-based resolver from `vibeusage-public-repo.js`) to decide:
  - `public_verified` → set `projectKey` and allow buckets.
  - `pending_public` / `blocked` → skip buckets.
- Store `repo_root_hash` in `projectState.projects[projectKey]` only.

**Step 4: Run test to verify it passes**

Run: `node --test test/rollout-parser.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/rollout.js test/rollout-parser.test.js
git commit -m "feat: gate project buckets on public repos"
```

### Task 3: Purge blocked project usage locally

**Files:**
- Create: `src/lib/project-usage-purge.js`
- Modify: `src/commands/sync.js`
- Test: `test/project-usage-purge.test.js`

**Step 1: Write the failing test**

Create `test/project-usage-purge.test.js` that writes a project queue with two projects, purges one, and asserts only the other remains. Ensure queue state offset resets to 0.

**Step 2: Run test to verify it fails**

Run: `node --test test/project-usage-purge.test.js`
Expected: FAIL (module missing)

**Step 3: Write minimal implementation**

- Implement `purgeProjectUsage({ projectKey, projectQueuePath, projectQueueStatePath, projectState })`:
  - Remove `projectState.buckets` entries for that `projectKey`.
  - Rewrite `project.queue.jsonl` excluding matching `project_key`.
  - Reset `project.queue.state.json` offset to 0.
- In `src/commands/sync.js`, after parsing, scan `cursors.projectHourly.projects` for `status === 'blocked'` and `purge_pending`, then call purge.

**Step 4: Run test to verify it passes**

Run: `node --test test/project-usage-purge.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/project-usage-purge.js src/commands/sync.js test/project-usage-purge.test.js
git commit -m "feat: purge blocked project usage locally"
```

### Task 4: Update integration tests and docs

**Files:**
- Modify: `test/sync-project-queue.test.js`
- Modify: `docs/plans/2026-01-26-public-repo-project-usage-*.md`
- Modify: `openspec/changes/2026-01-25-add-project-usage-totals/*`

**Step 1: Update tests**

Adjust `project_key` expectations to `owner/repo` format. Add any missing assertions for blocked/pending behavior.

**Step 2: Run test to verify it passes**

Run: `node --test test/sync-project-queue.test.js`
Expected: PASS

**Step 3: Update docs + OpenSpec**

Ensure proposal, design, specs, tasks reflect public-only gating, pending/blocked behavior, and repo_root_hash.

**Step 4: Run docs sanity**

Run: `node --test test/vibeusage-docs-smoke-rename.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add test/sync-project-queue.test.js docs/plans/2026-01-26-public-repo-project-usage-*.md openspec/changes/2026-01-25-add-project-usage-totals/*
git commit -m "docs: document public repo project usage"
```

### Task 5: Full regression

**Files:**
- Test: `test/*.test.js`

**Step 1: Run full test suite**

Run: `npm test`
Expected: PASS

**Step 2: Commit (if needed)**

If any test adjustments are needed, commit separately with a clear message.
