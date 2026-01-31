# Graph Auto-Index Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement graph auto-indexing with multi-domain SCIP generation, validation/fallback, and importer integration.

**Architecture:** A CLI orchestrator computes a split plan from repo structure and metrics, runs scip-typescript per domain into separate SCIP files, imports them into a single SQLite DB, validates coverage/noise, and retries once with a fallback plan when needed.

**Tech Stack:** Node.js (CommonJS), scip-typescript CLI, external importer (`tools/graph/build/importer.js`).

### Task 1: Config + Domain Discovery + Metrics + Split Decision + Plan Writer

**Files:**
- Create: `scripts/graph/lib/config.cjs`
- Create: `scripts/graph/lib/domain-discovery.cjs`
- Create: `scripts/graph/lib/metrics.cjs`
- Create: `scripts/graph/lib/split-decision.cjs`
- Create: `scripts/graph/lib/plan-writer.cjs`
- Test: `test/graph-auto-index-config.test.js`
- Test: `test/graph-auto-index-domains.test.js`
- Test: `test/graph-auto-index-metrics.test.js`
- Test: `test/graph-auto-index-split.test.js`
- Test: `test/graph-auto-index-plan.test.js`

**Step 1: Write the failing tests**

```js
// test/graph-auto-index-config.test.js
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { loadGraphConfig } = require('../scripts/graph/lib/config.cjs');

test('loadGraphConfig collects tsconfig paths and defaults', () => {
  const fakeFs = {
    readdirSync: () => ['tsconfig.json', 'tsconfig.scip.json', 'README.md'],
    statSync: () => ({ isFile: () => true })
  };
  const config = loadGraphConfig({ rootDir: '/repo', fs: fakeFs, path });
  assert.deepEqual(config.tsconfigPaths.sort(), [
    '/repo/tsconfig.json',
    '/repo/tsconfig.scip.json'
  ].sort());
  assert.equal(config.thresholds.maxNoiseRatio, 0.15);
  assert.equal(config.thresholds.splitMinFiles, 200);
});
```

```js
// test/graph-auto-index-domains.test.js
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { discoverDomains } = require('../scripts/graph/lib/domain-discovery.cjs');

test('discoverDomains picks known roots that exist', () => {
  const fakeFs = {
    existsSync: (p) => ['/repo/src', '/repo/packages'].includes(p),
    statSync: () => ({ isDirectory: () => true })
  };
  const domains = discoverDomains({ rootDir: '/repo', fs: fakeFs, path });
  assert.deepEqual(domains.map(d => d.name).sort(), ['packages', 'src']);
});
```

```js
// test/graph-auto-index-metrics.test.js
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { scanDomainMetrics } = require('../scripts/graph/lib/metrics.cjs');

test('scanDomainMetrics counts files and noise', () => {
  const fakeFs = {
    readdirSync: (p) => {
      if (p === '/repo/src') return ['a.ts', 'fixtures'];
      if (p === '/repo/src/fixtures') return ['x.ts'];
      return [];
    },
    statSync: (p) => ({ isDirectory: () => p.endsWith('fixtures') })
  };
  const metrics = scanDomainMetrics({
    rootDir: '/repo',
    domains: [{ name: 'src', paths: ['src'] }],
    fs: fakeFs,
    path
  });
  assert.equal(metrics[0].fileCount, 2);
  assert.equal(metrics[0].noiseCount, 1);
});
```

```js
// test/graph-auto-index-split.test.js
const test = require('node:test');
const assert = require('node:assert');
const { decideSplit } = require('../scripts/graph/lib/split-decision.cjs');

test('decideSplit chooses split when size threshold reached', () => {
  const decision = decideSplit({
    metrics: [{ name: 'src', fileCount: 500, noiseRatio: 0.05 }],
    thresholds: { splitMinFiles: 200, maxNoiseRatio: 0.15, minDomainsToSplit: 1 }
  });
  assert.equal(decision.decision, 'split');
});
```

```js
// test/graph-auto-index-plan.test.js
const test = require('node:test');
const assert = require('node:assert');
const { writePlan } = require('../scripts/graph/lib/plan-writer.cjs');

test('writePlan writes graph.plan.json', () => {
  let written = null;
  const fakeFs = {
    writeFileSync: (p, v) => { written = { p, v }; }
  };
  writePlan({ rootDir: '/repo', fs: fakeFs, plan: { decision: 'split' } });
  assert.equal(written.p, '/repo/graph.plan.json');
  assert.ok(written.v.includes('"decision": "split"'));
});
```

**Step 2: Run tests to verify failures**

Run: `node --test test/graph-auto-index-config.test.js test/graph-auto-index-domains.test.js test/graph-auto-index-metrics.test.js test/graph-auto-index-split.test.js test/graph-auto-index-plan.test.js`
Expected: FAIL (modules missing)

**Step 3: Write minimal implementations**

```js
// scripts/graph/lib/config.cjs
const path = require('node:path');

function loadGraphConfig({ rootDir, fs, path: pathMod = path }) {
  const entries = fs.readdirSync(rootDir);
  const tsconfigPaths = entries
    .filter(name => name.startsWith('tsconfig') && name.endsWith('.json'))
    .map(name => pathMod.join(rootDir, name));
  return {
    rootDir,
    tsconfigPaths,
    thresholds: {
      splitMinFiles: 200,
      maxNoiseRatio: 0.15,
      minDomainsToSplit: 2
    }
  };
}

module.exports = { loadGraphConfig };
```

```js
// scripts/graph/lib/domain-discovery.cjs
const path = require('node:path');
const DEFAULT_DOMAIN_ROOTS = [
  'src', 'apps', 'packages', 'functions', 'services', 'workers', 'dashboard',
  'bin', 'scripts', 'insforge-src', 'insforge-functions'
];

function discoverDomains({ rootDir, fs, path: pathMod = path }) {
  return DEFAULT_DOMAIN_ROOTS
    .map(name => ({ name, fullPath: pathMod.join(rootDir, name) }))
    .filter(entry => fs.existsSync(entry.fullPath) && fs.statSync(entry.fullPath).isDirectory())
    .map(entry => ({ name: entry.name, paths: [entry.name] }));
}

module.exports = { discoverDomains, DEFAULT_DOMAIN_ROOTS };
```

```js
// scripts/graph/lib/metrics.cjs
const path = require('node:path');

const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const NOISE_SEGMENTS = ['__tests__', 'test', 'tests', 'fixtures', 'dist', 'build', 'generated'];

function scanDomainMetrics({ rootDir, domains, fs, path: pathMod = path }) {
  return domains.map(domain => {
    const { fileCount, noiseCount } = countFiles({
      baseDir: rootDir,
      relPaths: domain.paths,
      fs,
      path: pathMod
    });
    const noiseRatio = fileCount === 0 ? 0 : noiseCount / fileCount;
    return { name: domain.name, fileCount, noiseCount, noiseRatio };
  });
}

function countFiles({ baseDir, relPaths, fs, path: pathMod }) {
  let fileCount = 0;
  let noiseCount = 0;
  for (const relPath of relPaths) {
    walk(pathMod.join(baseDir, relPath));
  }
  return { fileCount, noiseCount };

  function walk(dir) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const full = pathMod.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
        continue;
      }
      const ext = pathMod.extname(full);
      if (!CODE_EXTS.has(ext)) continue;
      fileCount += 1;
      if (NOISE_SEGMENTS.some(seg => full.split(pathMod.sep).includes(seg))) {
        noiseCount += 1;
      }
    }
  }
}

module.exports = { scanDomainMetrics };
```

```js
// scripts/graph/lib/split-decision.cjs
function decideSplit({ metrics, thresholds }) {
  const { splitMinFiles, maxNoiseRatio, minDomainsToSplit } = thresholds;
  const eligible = metrics.filter(m => m.fileCount >= splitMinFiles && m.noiseRatio <= maxNoiseRatio);
  const decision = eligible.length >= minDomainsToSplit ? 'split' : 'single';
  return { decision, eligible };
}

module.exports = { decideSplit };
```

```js
// scripts/graph/lib/plan-writer.cjs
const path = require('node:path');

function writePlan({ rootDir, plan, fs, path: pathMod = path }) {
  const outPath = pathMod.join(rootDir, 'graph.plan.json');
  fs.writeFileSync(outPath, JSON.stringify(plan, null, 2));
  return outPath;
}

module.exports = { writePlan };
```

**Step 4: Run tests to verify pass**

Run: `node --test test/graph-auto-index-config.test.js test/graph-auto-index-domains.test.js test/graph-auto-index-metrics.test.js test/graph-auto-index-split.test.js test/graph-auto-index-plan.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/graph/lib test/graph-auto-index-*.test.js

git commit -m "feat: add graph auto-index config and metrics"
```

### Task 2: Multi-SCIP Runner + Importer + Validation

**Files:**
- Create: `scripts/graph/lib/scip-runner.cjs`
- Create: `scripts/graph/lib/importer.cjs`
- Create: `scripts/graph/lib/validate.cjs`
- Test: `test/graph-auto-index-multi-scip.test.js`
- Test: `test/graph-auto-index-import.test.js`
- Test: `test/graph-auto-index-validation.test.js`

**Step 1: Write failing tests**

```js
// test/graph-auto-index-multi-scip.test.js
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { runScipForPlan } = require('../scripts/graph/lib/scip-runner.cjs');

test('runScipForPlan invokes scip-typescript per domain', () => {
  const calls = [];
  const deps = {
    fs: {
      mkdirSync: () => {},
      writeFileSync: () => {}
    },
    path,
    execFileSync: (bin, args) => calls.push([bin, args]),
    scipBin: '/bin/scip-typescript'
  };
  const plan = {
    decision: 'split',
    domains: [{ name: 'src', paths: ['src'] }, { name: 'packages', paths: ['packages'] }]
  };
  const outputs = runScipForPlan({ rootDir: '/repo', plan, deps });
  assert.equal(outputs.length, 2);
  assert.equal(calls.length, 2);
  assert.ok(calls[0][1].includes('--output'));
});
```

```js
// test/graph-auto-index-import.test.js
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { importScip } = require('../scripts/graph/lib/importer.cjs');

test('importScip calls external importer with db + scip paths', () => {
  const calls = [];
  const deps = {
    fs: { existsSync: () => true, mkdirSync: () => {} },
    path,
    execFileSync: (bin, args) => calls.push([bin, args])
  };
  importScip({ rootDir: '/repo', scipPath: '/repo/index.src.scip', deps });
  assert.equal(calls.length, 1);
  assert.ok(calls[0][1].includes('--scip'));
  assert.ok(calls[0][1].includes('--db'));
});
```

```js
// test/graph-auto-index-validation.test.js
const test = require('node:test');
const assert = require('node:assert');
const { validateScipCoverage } = require('../scripts/graph/lib/validate.cjs');

test('validateScipCoverage fails when domain has zero docs', () => {
  const deps = {
    parseScipFile: () => ({ documents: [] })
  };
  const result = validateScipCoverage({
    scipOutputs: [{ domain: { name: 'src', paths: ['src'] }, scipPath: '/repo/index.src.scip' }],
    thresholds: { maxNoiseRatio: 0.15 },
    deps
  });
  assert.equal(result.ok, false);
});
```

**Step 2: Run tests to verify failures**

Run: `node --test test/graph-auto-index-multi-scip.test.js test/graph-auto-index-import.test.js test/graph-auto-index-validation.test.js`
Expected: FAIL (modules missing)

**Step 3: Write minimal implementations**

```js
// scripts/graph/lib/scip-runner.cjs
const path = require('node:path');

function runScipForPlan({ rootDir, plan, deps }) {
  const { fs, execFileSync, scipBin = defaultScipBin(rootDir), path: pathMod = path } = deps;
  const tmpDir = pathMod.join(rootDir, '.tmp', 'graph', 'auto-index');
  fs.mkdirSync(tmpDir, { recursive: true });

  return plan.domains.map(domain => {
    const tsconfigPath = pathMod.join(tmpDir, `tsconfig.${domain.name}.json`);
    fs.writeFileSync(tsconfigPath, JSON.stringify(buildDomainTsconfig(rootDir, domain, pathMod), null, 2));

    const scipPath = pathMod.join(rootDir, `index.${domain.name}.scip`);
    const args = ['index', '--cwd', rootDir, '--output', scipPath, tsconfigPath];
    execFileSync(scipBin, args, { stdio: 'inherit' });

    return { domain, scipPath, tsconfigPath };
  });
}

function buildDomainTsconfig(rootDir, domain, pathMod) {
  const base = pathMod.relative(pathMod.join(rootDir, '.tmp', 'graph', 'auto-index'), pathMod.join(rootDir, 'tsconfig.json'));
  return {
    extends: base.startsWith('.') ? base : `./${base}`,
    include: domain.paths.map(p => `${p}/**/*`),
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**']
  };
}

function defaultScipBin(rootDir) {
  return path.join(rootDir, 'node_modules', '.bin', 'scip-typescript');
}

module.exports = { runScipForPlan };
```

```js
// scripts/graph/lib/importer.cjs
const path = require('node:path');

function importScip({ rootDir, scipPath, dbPath, deps }) {
  const { fs, execFileSync, path: pathMod = path } = deps;
  const importerPath = pathMod.join(rootDir, 'tools', 'graph', 'build', 'importer.js');
  if (!fs.existsSync(importerPath)) {
    throw new Error(`Missing importer at ${importerPath}`);
  }
  const targetDb = dbPath || pathMod.join(rootDir, 'data', 'graph.sqlite');
  fs.mkdirSync(pathMod.dirname(targetDb), { recursive: true });
  execFileSync('node', [importerPath, '--scip', scipPath, '--db', targetDb], { stdio: 'inherit' });
  return targetDb;
}

module.exports = { importScip };
```

```js
// scripts/graph/lib/validate.cjs
const path = require('node:path');

function validateScipCoverage({ scipOutputs, thresholds, deps }) {
  const maxNoiseRatio = thresholds.maxNoiseRatio;
  const failures = [];

  for (const entry of scipOutputs) {
    const index = deps.parseScipFile(entry.scipPath);
    const docs = index.documents || [];
    const domainPrefix = entry.domain.paths[0].replace(/\\/g, '/');
    const domainDocs = docs.filter(doc => (doc.relativePath || '').startsWith(`${domainPrefix}/`));
    const noiseDocs = domainDocs.filter(doc => isNoisePath(doc.relativePath || ''));
    const noiseRatio = domainDocs.length === 0 ? 0 : noiseDocs.length / domainDocs.length;
    if (domainDocs.length === 0) failures.push({ domain: entry.domain.name, reason: 'no_docs' });
    if (noiseRatio > maxNoiseRatio) failures.push({ domain: entry.domain.name, reason: 'noise_ratio' });
  }

  return { ok: failures.length === 0, failures };
}

function isNoisePath(relPath) {
  const parts = relPath.split('/');
  return parts.includes('__tests__') || parts.includes('tests') || parts.includes('test') || parts.includes('fixtures') || parts.includes('dist') || parts.includes('build');
}

module.exports = { validateScipCoverage };
```

**Step 4: Run tests to verify pass**

Run: `node --test test/graph-auto-index-multi-scip.test.js test/graph-auto-index-import.test.js test/graph-auto-index-validation.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/graph/lib test/graph-auto-index-*.test.js

git commit -m "feat: add graph auto-index scip runner and validation"
```

### Task 3: Orchestrator + CLI + Docs + Package Script

**Files:**
- Create: `scripts/graph/auto-index.cjs`
- Modify: `package.json`
- Modify: `scripts/graph/README.md`
- Test: `test/graph-auto-index-orchestrator.test.js`

**Step 1: Write failing test**

```js
// test/graph-auto-index-orchestrator.test.js
const test = require('node:test');
const assert = require('node:assert');
const { buildPlan } = require('../scripts/graph/auto-index.cjs');

test('buildPlan returns decision and domains', () => {
  const plan = buildPlan({
    rootDir: '/repo',
    deps: {
      fs: {
        readdirSync: () => ['tsconfig.json'],
        statSync: () => ({ isFile: () => true }),
        existsSync: () => true
      },
      path: require('node:path')
    }
  });
  assert.ok(plan.decision);
  assert.ok(plan.domains);
});
```

**Step 2: Run test to verify failure**

Run: `node --test test/graph-auto-index-orchestrator.test.js`
Expected: FAIL (module missing)

**Step 3: Write minimal implementation**

```js
// scripts/graph/auto-index.cjs
const path = require('node:path');
const { loadGraphConfig } = require('./lib/config.cjs');
const { discoverDomains } = require('./lib/domain-discovery.cjs');
const { scanDomainMetrics } = require('./lib/metrics.cjs');
const { decideSplit } = require('./lib/split-decision.cjs');
const { writePlan } = require('./lib/plan-writer.cjs');
const { runScipForPlan } = require('./lib/scip-runner.cjs');
const { importScip } = require('./lib/importer.cjs');
const { validateScipCoverage } = require('./lib/validate.cjs');
const scip = require('@sourcegraph/scip-typescript/dist/src/scip');
const fs = require('node:fs');

function buildPlan({ rootDir, deps = {} }) {
  const fsDep = deps.fs || fs;
  const pathDep = deps.path || path;
  const config = loadGraphConfig({ rootDir, fs: fsDep, path: pathDep });
  const domains = discoverDomains({ rootDir, fs: fsDep, path: pathDep });
  const metrics = scanDomainMetrics({ rootDir, domains, fs: fsDep, path: pathDep });
  const decision = decideSplit({ metrics, thresholds: config.thresholds });
  return {
    decision: decision.decision,
    domains: decision.decision === 'split' ? domains : [{ name: 'root', paths: ['.'] }],
    metrics
  };
}

function main() {
  const rootDir = process.cwd();
  const apply = process.argv.includes('--apply');
  const plan = buildPlan({ rootDir });
  writePlan({ rootDir, plan, fs });
  if (!apply) return;

  let scipOutputs = runScipForPlan({ rootDir, plan, deps: { fs, path, execFileSync: require('node:child_process').execFileSync } });
  for (const output of scipOutputs) {
    importScip({ rootDir, scipPath: output.scipPath, deps: { fs, path, execFileSync: require('node:child_process').execFileSync } });
  }
  const validation = validateScipCoverage({
    scipOutputs,
    thresholds: { maxNoiseRatio: 0.15 },
    deps: { parseScipFile: (p) => scip.Index.deserialize(fs.readFileSync(p)) }
  });
  if (!validation.ok) {
    throw new Error(`Auto-index validation failed: ${JSON.stringify(validation.failures)}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { buildPlan };
```

**Step 4: Run tests to verify pass**

Run: `node --test test/graph-auto-index-orchestrator.test.js`
Expected: PASS

**Step 5: Docs + package.json**

Add `graph:auto-index` script and document `--apply` usage in `scripts/graph/README.md`.

**Step 6: Commit**

```bash
git add scripts/graph/auto-index.cjs package.json scripts/graph/README.md test/graph-auto-index-orchestrator.test.js

git commit -m "feat: add graph auto-index orchestrator"
```

### Task 4: Architecture Canvas Sync

**Files:**
- Modify: `architecture.canvas`

**Step 1: Mark new nodes Implemented**

Update nodes:
- graph_auto_index_planner
- graph_auto_index_metrics
- graph_auto_index_decider
- graph_auto_index_plan
- graph_auto_index_validation
- graph_auto_index_multi_scip
- graph_auto_index_import

Set `Status: Implemented` and keep notes.

**Step 2: Commit**

```bash
git add architecture.canvas

git commit -m "docs: sync graph auto-index architecture"
```

