# CLI Doctor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the CLI `doctor` command with single-source runtime config, read-only diagnostics, and JSON/human outputs with no backward compatibility.

**Architecture:** Add `src/lib/runtime-config.js` to resolve CLI/config/env/defaults (CLI flags highest). Add `src/lib/doctor.js` for checks + report assembly. Wire `src/commands/doctor.js` into `src/cli.js`, and reuse diagnostics in read-only mode.

**Tech Stack:** Node.js (>=18), `node --test`, existing CLI utilities.

---

### Task 1: Runtime config resolver (single source)

**Files:**
- Create: `src/lib/runtime-config.js`
- Modify: `src/lib/fs.js`
- Test: `test/runtime-config.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRuntimeConfig } from '../src/lib/runtime-config.js';

test('resolveRuntimeConfig prefers CLI flags over config and env', async () => {
  const config = { baseUrl: 'https://config.example', deviceToken: 'cfg' };
  const result = await resolveRuntimeConfig({
    cli: { baseUrl: 'https://cli.example' },
    config,
    env: { VIBEUSAGE_DEVICE_TOKEN: 'env' }
  });
  assert.equal(result.baseUrl, 'https://cli.example');
  assert.equal(result.deviceToken, 'cfg');
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/runtime-config.test.js`
Expected: FAIL with "resolveRuntimeConfig is not a function" or "module not found"

**Step 3: Write minimal implementation**

```js
function resolveRuntimeConfig({ cli = {}, config = {}, env = process.env } = {}) {
  return {
    baseUrl: cli.baseUrl ?? config.baseUrl ?? env.VIBEUSAGE_INSFORGE_BASE_URL ?? null
  };
}
```

**Step 4: Run test to verify it passes**

Run: `node --test test/runtime-config.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add test/runtime-config.test.js src/lib/runtime-config.js src/lib/fs.js
git commit -m "feat: add runtime config resolver"
```

---

### Task 2: Doctor core library (checks + report)

**Files:**
- Create: `src/lib/doctor.js`
- Test: `test/doctor.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDoctorReport } from '../src/lib/doctor.js';

test('doctor treats any HTTP response as reachable', async () => {
  const report = await buildDoctorReport({
    runtime: { baseUrl: 'https://example' },
    fetch: async () => ({ status: 401 })
  });
  const check = report.checks.find(c => c.id === 'network.base_url');
  assert.equal(check.status, 'ok');
  assert.equal(check.meta.status_code, 401);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/doctor.test.js`
Expected: FAIL with "buildDoctorReport is not a function" or "module not found"

**Step 3: Write minimal implementation**

```js
async function buildDoctorReport({ runtime, fetch }) {
  return { version: 1, generated_at: new Date().toISOString(), checks: [] };
}
```

**Step 4: Run test to verify it passes**

Run: `node --test test/doctor.test.js`
Expected: FAIL (missing check) → iterate until PASS

**Step 5: Commit**

```bash
git add test/doctor.test.js src/lib/doctor.js
git commit -m "feat: add doctor core report builder"
```

---

### Task 3: Doctor command + CLI wiring

**Files:**
- Create: `src/commands/doctor.js`
- Modify: `src/cli.js`
- Modify: `test/cli-help.test.js`
- Test: `test/doctor.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';

test('cli help lists doctor', async () => {
  const output = await new Promise((resolve, reject) => {
    execFile('node', ['src/cli.js', '--help'], (err, stdout) => {
      if (err) return reject(err);
      resolve(stdout);
    });
  });
  assert.match(output, /doctor/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/cli-help.test.js`
Expected: FAIL with "doctor" not found

**Step 3: Write minimal implementation**

```js
// src/cli.js
commands.doctor = cmdDoctor;
```

**Step 4: Run test to verify it passes**

Run: `node --test test/cli-help.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/cli.js src/commands/doctor.js test/cli-help.test.js test/doctor.test.js
git commit -m "feat: add doctor command wiring"
```

---

### Task 4: Read-only diagnostics integration

**Files:**
- Modify: `src/lib/diagnostics.js`
- Modify: `src/commands/diagnostics.js`
- Test: `test/diagnostics.test.js` or `test/doctor.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { collectTrackerDiagnostics } from '../src/lib/diagnostics.js';

test('diagnostics with migrate=false does not create tracker dir', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'doctor-'));
  const home = path.join(tmp, 'home');
  await fs.mkdir(home);
  await collectTrackerDiagnostics({ homeDir: home, migrate: false });
  await assert.rejects(() => fs.stat(path.join(home, '.vibeusage')));
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/diagnostics.test.js`
Expected: FAIL (directory created or option unsupported)

**Step 3: Write minimal implementation**

```js
function collectTrackerDiagnostics({ migrate = true, ...rest } = {}) {
  // guard writes when migrate=false
}
```

**Step 4: Run test to verify it passes**

Run: `node --test test/diagnostics.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/diagnostics.js src/commands/diagnostics.js test/diagnostics.test.js
git commit -m "feat: add read-only diagnostics mode"
```

---

### Task 5: Remove non-VIBEUSAGE env usage + adopt runtime config

**Files:**
- Modify: `src/commands/init.js`
- Modify: `src/commands/sync.js`
- Modify: `src/lib/debug-flags.js`
- Modify: `src/lib/insforge-client.js`
- Test: `test/runtime-config.test.js`
- Test: `test/insforge-client.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getAnonKey } from '../src/lib/insforge-client.js';

test('getAnonKey ignores INSFORGE_ANON_KEY', () => {
  const env = { INSFORGE_ANON_KEY: 'legacy' };
  assert.equal(getAnonKey({ env }), '');
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/insforge-client.test.js`
Expected: FAIL (returns legacy key)

**Step 3: Write minimal implementation**

```js
function getAnonKey({ env = process.env } = {}) {
  return env.VIBEUSAGE_INSFORGE_ANON_KEY || '';
}
```

**Step 4: Run test to verify it passes**

Run: `node --test test/insforge-client.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/insforge-client.js test/insforge-client.test.js src/commands/init.js src/commands/sync.js src/lib/debug-flags.js
git commit -m "refactor: drop legacy env sources"
```

---

### Task 6: Docs + spec alignment

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `openspec/project.md`

**Step 1: Update docs**

```md
- Remove VIBESCORE_* and INSFORGE_ANON_KEY references
- Add doctor usage + --out semantics
```

**Step 2: Commit**

```bash
git add README.md README.zh-CN.md openspec/project.md
git commit -m "docs: update cli doctor and env sources"
```

---

### Task 7: Verification run

**Files:**
- Modify: `docs/plans/2026-01-16-cli-doctor/verification-report.md`

**Step 1: Run targeted tests**

Run: `node --test test/runtime-config.test.js test/doctor.test.js test/cli-help.test.js test/diagnostics.test.js test/insforge-client.test.js`
Expected: PASS

**Step 2: Record verification**

```md
## Tests Run
- node --test test/runtime-config.test.js test/doctor.test.js test/cli-help.test.js test/diagnostics.test.js test/insforge-client.test.js

## Results
- PASS
```

**Step 3: Commit**

```bash
git add docs/plans/2026-01-16-cli-doctor/verification-report.md
git commit -m "chore: record doctor verification"
```

