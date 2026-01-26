# Vibeusage Graph Index Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Produce a SCIP index for this repo on main/release, support manual import into the graph store, and validate Definitions/References queries.

**Architecture:** Generate `index.scip` from the repo root using `@sourcegraph/scip-typescript`. CI builds and uploads the SCIP artifact on main/release. A manual import runbook pulls the artifact and loads it into SQLite via the graph importer. Phase 1 only supports Definitions/References.

**Tech Stack:** TypeScript/Node, @sourcegraph/scip-typescript, GitHub Actions (or existing CI), SQLite (graph store), external graph importer (`tools/graph`).

---

### Task 0: OpenSpec Gate + Baseline Checks

**Files:**
- Read: `openspec/project.md`
- Read: `openspec/specs/**`
- Create: `openspec/changes/<change-id>/README.md`
- Read: `architecture.canvas`

**Step 1: Confirm OpenSpec and create change ID**
Run:
```bash
ls openspec
```
Expected: `project.md` and `specs/` exist. Create a new change folder:
```bash
mkdir -p openspec/changes/2026-01-26-graph-phase1
cat <<'TXT' > openspec/changes/2026-01-26-graph-phase1/README.md
Title: Graph Phase 1 (SCIP index + manual import)
Owner: @codex
Status: Proposed
Notes: Definitions/References only
TXT
```

**Step 2: Verify architecture canvas has Proposed graph nodes**
Run:
```bash
rg -n "Graph|SCIP|index" architecture.canvas
```
Expected: Proposed nodes/edges exist for indexer/importer/store/query.

**Step 3: Commit the change gate**
Run:
```bash
git add openspec/changes/2026-01-26-graph-phase1/README.md

git commit -m "docs: add openspec change for graph phase1"
```
Expected: commit success.

---

### Task 1: Add SCIP Generation Script

**Files:**
- Modify: `package.json`
- Create: `scripts/graph/generate-scip.ts`
- Create: `scripts/graph/README.md`

**Step 1: Add dependency and npm script**
Edit `package.json`:
```json
{
  "devDependencies": {
    "@sourcegraph/scip-typescript": "^0.3.6"
  },
  "scripts": {
    "graph:scip": "node scripts/graph/generate-scip.ts"
  }
}
```

**Step 2: Install dependency**
Run:
```bash
npm install
```
Expected: install success.

**Step 3: Implement generator**
Create `scripts/graph/generate-scip.ts`:
```ts
import { index } from "@sourcegraph/scip-typescript";
import { writeFileSync } from "node:fs";

async function main() {
  const result = await index({
    projectRoot: process.cwd(),
    tsconfigPath: "tsconfig.json"
  });

  writeFileSync("index.scip", Buffer.from(result));
  console.log("SCIP written to index.scip");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

**Step 4: Add README**
Create `scripts/graph/README.md`:
```md
# Graph SCIP Generation

Run:

```bash
npm run graph:scip
```

Output: `index.scip` at repo root.

If `tsconfig.json` is not in the root, update `scripts/graph/generate-scip.ts` to point to the correct path.
```

**Step 5: Verify locally**
Run:
```bash
npm run graph:scip
```
Expected: `index.scip` exists and is non-empty.

**Step 6: Commit**
Run:
```bash
git add package.json package-lock.json scripts/graph

git commit -m "feat: add scip generation script"
```
Expected: commit success.

---

### Task 2: CI Artifact Generation (Strategy A)

**Files:**
- Create: `.github/workflows/graph-scip.yml`

**Step 1: Add GitHub Actions workflow**
Create `.github/workflows/graph-scip.yml`:
```yaml
name: Graph SCIP Index

on:
  push:
    branches: ["main"]
  release:
    types: [published]

jobs:
  scip:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run graph:scip
      - run: test -s index.scip
      - uses: actions/upload-artifact@v4
        with:
          name: scip-index
          path: index.scip
```

**Step 2: Commit**
Run:
```bash
git add .github/workflows/graph-scip.yml

git commit -m "ci: generate scip index on main/release"
```
Expected: commit success.

---

### Task 3: Manual Import Runbook

**Files:**
- Create: `docs/graph/phase1-import.md`

**Step 1: Write runbook**
Create `docs/graph/phase1-import.md`:
```md
# Graph Phase 1 Import Runbook

1) Download the `scip-index` artifact from CI.
2) Run the importer (external repo `tools/graph`):

```bash
node tools/graph/build/importer.js \
  --scip ./index.scip \
  --db ./data/graph.sqlite
```

3) Verify queries using the graph query API (Definitions/References).
```

**Step 2: Commit**
Run:
```bash
git add docs/graph/phase1-import.md

git commit -m "docs: add phase1 scip import runbook"
```
Expected: commit success.

---

### Task 4: Acceptance Criteria (Definitions/References)

**Files:**
- Create: `docs/graph/phase1-acceptance.md`

**Step 1: Write acceptance cases**
Create `docs/graph/phase1-acceptance.md`:
```md
# Graph Phase 1 Acceptance

## Definitions
- Query a known symbol (e.g., `SomeComponent`) returns correct file + line.

## References
- Query references for the same symbol returns at least one known usage site.
```

**Step 2: Commit**
Run:
```bash
git add docs/graph/phase1-acceptance.md

git commit -m "docs: add phase1 acceptance criteria"
```
Expected: commit success.

---

### Task 5: Architecture Canvas Sync (Post-Implementation)

**Files:**
- Modify: `architecture.canvas`

**Step 1: Mark nodes Implemented**
Update all graph phase1 nodes to `Status: Implemented`.

**Step 2: Commit**
Run:
```bash
git add architecture.canvas

git commit -m "docs: mark graph phase1 implemented"
```
Expected: commit success.

---

## Verification Summary
- Local: `npm run graph:scip` produces non-empty `index.scip`.
- CI: Workflow uploads `scip-index` artifact for main/release.
- Import: Runbook loads SQLite and Definitions/References queries succeed.

## Scope Locks
- Phase 1: Definitions + References only (no call graph, no symbol search, no auto incremental).

