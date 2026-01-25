# Frontend UI Guardrails Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a hardcode scan guardrail (colors + raw JSX text) and enforce copy validation + guardrails in CI.

**Architecture:** Introduce a Node-based scanner under `scripts/ops` with a committed baseline JSON to prevent regressions, wire it into `package.json` and GitHub Actions, and update the project overlay doc to make the rules explicit.

**Tech Stack:** Node 20 (CommonJS scripts), GitHub Actions, React/Vite/Tailwind.

---

### Task 1: Add hardcode scanner + baseline

**Files:**
- Create: `scripts/ops/validate-ui-hardcode.cjs`
- Create: `scripts/ops/ui-hardcode-baseline.json`

**Step 1: Write the failing test**

Run: `node scripts/ops/validate-ui-hardcode.cjs`
Expected: FAIL with "Cannot find module" (script missing).

**Step 2: Write minimal implementation**

Create `scripts/ops/validate-ui-hardcode.cjs` with:

```js
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const SRC_ROOT = path.join(ROOT, "dashboard", "src");
const BASELINE_PATH = path.join(__dirname, "ui-hardcode-baseline.json");

const EXT_REGEX = /[.](js|jsx|ts|tsx)$/;
const COLOR_REGEX = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0?\.\d+|1(?:\.0+)?))?\s*\)/g;
const JSX_TEXT_REGEX = />[^<>{}]*[A-Za-z][^<>{}]*</g;

function walk(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      walk(fullPath, results);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!EXT_REGEX.test(entry.name)) continue;
    results.push(fullPath);
  }
  return results;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const colors = content.match(COLOR_REGEX) || [];
  const isJsx = /[.](jsx|tsx)$/.test(filePath);
  const rawText = isJsx ? content.match(JSX_TEXT_REGEX) || [] : [];
  return {
    colors: colors.length,
    rawText: rawText.length,
  };
}

function scanAll() {
  const files = walk(SRC_ROOT);
  const results = {};
  let totalColors = 0;
  let totalRawText = 0;

  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    const counts = scanFile(file);
    if (counts.colors || counts.rawText) {
      results[rel] = counts;
      totalColors += counts.colors;
      totalRawText += counts.rawText;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    root: "dashboard/src",
    rules: {
      colors: "hex/rgb(a) literals",
      rawText: "JSX text nodes containing letters",
    },
    totals: { colors: totalColors, rawText: totalRawText },
    files: results,
  };
}

function diffAgainstBaseline(current, baseline) {
  const errors = [];

  for (const [file, counts] of Object.entries(current.files)) {
    const base = baseline.files?.[file];
    if (!base) {
      errors.push(`${file}: new hardcode usage detected (colors=${counts.colors}, rawText=${counts.rawText})`);
      continue;
    }
    if (counts.colors > base.colors) {
      errors.push(`${file}: colors increased (${base.colors} -> ${counts.colors})`);
    }
    if (counts.rawText > base.rawText) {
      errors.push(`${file}: rawText increased (${base.rawText} -> ${counts.rawText})`);
    }
  }

  return errors;
}

function main() {
  const update = process.argv.includes("--update");
  const snapshot = scanAll();

  if (update) {
    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log(`Baseline written: ${BASELINE_PATH}`);
    console.log(`Totals: colors=${snapshot.totals.colors}, rawText=${snapshot.totals.rawText}`);
    return;
  }

  if (!fs.existsSync(BASELINE_PATH)) {
    console.error(`Baseline missing: ${BASELINE_PATH}`);
    console.error("Run: node scripts/ops/validate-ui-hardcode.cjs --update");
    process.exit(1);
  }

  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  const errors = diffAgainstBaseline(snapshot, baseline);

  if (errors.length) {
    console.error("UI hardcode guardrails failed:");
    errors.forEach((line) => console.error(`- ${line}`));
    process.exit(1);
  }

  console.log(`UI hardcode guardrails ok: colors=${snapshot.totals.colors}, rawText=${snapshot.totals.rawText}`);
}

main();
```

**Step 3: Run test to verify it still fails**

Run: `node scripts/ops/validate-ui-hardcode.cjs`
Expected: FAIL with "Baseline missing" message.

**Step 4: Generate baseline (GREEN)**

Run: `node scripts/ops/validate-ui-hardcode.cjs --update`
Expected: Creates `scripts/ops/ui-hardcode-baseline.json` and prints totals.

**Step 5: Run test to verify it passes**

Run: `node scripts/ops/validate-ui-hardcode.cjs`
Expected: PASS with "UI hardcode guardrails ok".

**Step 6: Commit**

```bash
git add scripts/ops/validate-ui-hardcode.cjs scripts/ops/ui-hardcode-baseline.json
git commit -m "chore: add ui hardcode guardrail"
```

---

### Task 2: Wire guardrails into npm + CI + overlay doc

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/skills/frontend-ui-functional/project-overlay.md`

**Step 1: Write the failing test**

Run: `npm run validate:ui-hardcode`
Expected: FAIL with "missing script".

**Step 2: Write minimal implementation**

Update `package.json` scripts:

```json
"validate:ui-hardcode": "node scripts/ops/validate-ui-hardcode.cjs"
```

Update `.github/workflows/ci.yml` steps (after tests):

```yaml
      - name: Validate copy registry
        run: npm run validate:copy
      - name: Validate UI hardcode guardrails
        run: npm run validate:ui-hardcode
```

Update `docs/skills/frontend-ui-functional/project-overlay.md` Required Rules:

```md
- **UI hardcode guardrails:** Run `npm run validate:ui-hardcode` before shipping UI changes.
```

**Step 3: Run test to verify it passes**

Run: `npm run validate:ui-hardcode`
Expected: PASS with guardrail OK message.

**Step 4: Commit**

```bash
git add package.json .github/workflows/ci.yml docs/skills/frontend-ui-functional/project-overlay.md
git commit -m "chore: wire ui guardrails into ci"
```

---

### Task 3: Verify + update architecture canvas

**Files:**
- Modify: `architecture.canvas`

**Step 1: Run verification**

Run:
- `npm run validate:copy`
- `npm run validate:ui-hardcode`

Expected: both PASS.

**Step 2: Update architecture canvas**

Run: `node scripts/ops/architecture-canvas.cjs`
Expected: updated `architecture.canvas`.

**Step 3: Commit**

```bash
git add architecture.canvas
git commit -m "chore: refresh architecture canvas"
```

---

## Notes
- If the baseline needs adjustment after legitimate refactors, re-run `--update` and commit the new baseline.
- Do not push unless explicitly requested.
