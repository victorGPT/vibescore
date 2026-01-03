# Dashboard Layout + Install Visibility Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move TrendMonitor to the left column above the heatmap, remove heatmap range/source labels, and show the install panel only when no activity data is present.

**Architecture:** Update DashboardPage layout and visibility gating without changing backend flows or data structures. Keep copy registry intact; only adjust UI usage.

**Tech Stack:** React (Vite), Node test runner, CSV-based copy registry.

---

### Task 1: Add failing tests for layout + install visibility

**Files:**
- Create: `test/dashboard-layout-adjustments.test.js`
- Modify: `dashboard/src/pages/DashboardPage.jsx`

**Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const pagePath = path.join(
  __dirname,
  "..",
  "dashboard",
  "src",
  "pages",
  "DashboardPage.jsx"
);

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("DashboardPage places TrendMonitor above heatmap in left column", () => {
  const src = readFile(pagePath);
  const leftStart = src.indexOf("lg:col-span-4");
  const rightStart = src.indexOf("lg:col-span-8", leftStart + 1);
  assert.ok(leftStart !== -1, "expected left column markup");
  assert.ok(rightStart !== -1, "expected right column markup");

  const leftColumn = src.slice(leftStart, rightStart);
  const trendIndex = leftColumn.indexOf("<TrendMonitor");
  const heatmapIndex = leftColumn.indexOf("{activityHeatmapBlock}");
  assert.ok(trendIndex !== -1, "expected TrendMonitor in left column");
  assert.ok(heatmapIndex !== -1, "expected heatmap block in left column");
  assert.ok(
    trendIndex < heatmapIndex,
    "expected TrendMonitor above heatmap in left column"
  );
});

test("DashboardPage gates install panel by active days", () => {
  const src = readFile(pagePath);
  assert.ok(
    src.includes("const shouldShowInstall"),
    "expected shouldShowInstall gate"
  );
  assert.ok(
    src.includes("activeDays === 0"),
    "expected activeDays gate"
  );
  assert.ok(
    src.includes("accessEnabled"),
    "expected accessEnabled gate"
  );
  assert.ok(
    src.includes("heatmapLoading"),
    "expected heatmapLoading gate"
  );
  assert.ok(
    src.includes("shouldShowInstall ? ("),
    "expected install panel to use shouldShowInstall"
  );
});

test("DashboardPage removes heatmap range label", () => {
  const src = readFile(pagePath);
  assert.ok(
    !src.includes("dashboard.activity.range"),
    "expected heatmap range label removed"
  );
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/dashboard-layout-adjustments.test.js`
Expected: FAIL (missing new layout + gating + removed label).

**Step 3: Write minimal implementation**

- Add `shouldShowInstall` gating logic.
- Move `TrendMonitor` into left column above `{activityHeatmapBlock}`.
- Remove heatmap range/source labels in `activityHeatmapBlock` and drop unused `heatmapRange/heatmapSource` variables.

**Step 4: Run test to verify it passes**

Run: `node --test test/dashboard-layout-adjustments.test.js`
Expected: PASS.

**Step 5: Run relevant regression**

Run: `npm test`
Expected: PASS.

### Task 2: Sync canvas after implementation

**Step 1: Update architecture + interaction sequence canvas**

Run:
- `node scripts/ops/architecture-canvas.cjs`
- `node scripts/ops/interaction-sequence-canvas.cjs`

Expected: no errors; canvases updated.

### Task 3: Commit changes locally

**Step 1: Stage files**

```bash
git add dashboard/src/pages/DashboardPage.jsx test/dashboard-layout-adjustments.test.js architecture.canvas interaction_sequence.canvas
```

**Step 2: Commit**

```bash
git commit -m "feat: streamline dashboard install + layout"
```
