# Gemini CLI Token Usage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在本地解析 Gemini CLI session JSON，映射为统一 token 字段并按 UTC 半小时桶聚合，与 Codex/Claude 同口径上报。

**Architecture:** 在 `src/lib/rollout.js` 新增 Gemini 解析与增量游标（基于 `message.id` + `timestamp`），并复用现有 half-hour 聚合与 `groupQueued` 幂等逻辑；在 `src/commands/sync.js` 接入 `~/.gemini/tmp/**/chats/session-*.json` 作为 `source=gemini` 的输入。

**Tech Stack:** Node.js (fs/path), JSON parsing, existing VibeScore tracker libs/tests.

---

### Task 1: Add Gemini parser unit tests (TDD)

**Files:**
- Modify: `test/rollout-parser.test.js`

**Step 1: Write the failing tests**

```js
const { parseGeminiIncremental } = require('../src/lib/rollout');

function buildGeminiSession({ messages }) {
  return JSON.stringify({
    sessionId: 'session-1',
    projectHash: 'proj-1',
    startTime: '2025-12-24T18:00:00.000Z',
    lastUpdated: '2025-12-24T18:10:00.000Z',
    messages
  });
}

function geminiMessage({ id, ts, model, tokens, content = 'ignored', thoughts = 'ignored' }) {
  return {
    id,
    timestamp: ts,
    type: 'assistant',
    model,
    content,
    thoughts,
    tokens
  };
}

test('parseGeminiIncremental maps tokens and aggregates half-hour buckets', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibescore-gemini-'));
  try {
    const sessionPath = path.join(tmp, 'session.json');
    const queuePath = path.join(tmp, 'queue.jsonl');
    const cursors = { version: 1, files: {}, updatedAt: null };

    const messages = [
      geminiMessage({
        id: 'm1',
        ts: '2025-12-24T18:07:10.826Z',
        model: 'gemini-3-pro-preview',
        tokens: { input: 2, output: 3, cached: 1, thoughts: 4, tool: 5, total: 15 }
      })
    ];

    await fs.writeFile(sessionPath, buildGeminiSession({ messages }), 'utf8');

    const res = await parseGeminiIncremental({
      sessionFiles: [sessionPath],
      cursors,
      queuePath,
      source: 'gemini'
    });

    assert.equal(res.filesProcessed, 1);
    assert.equal(res.eventsAggregated, 1);
    assert.equal(res.bucketsQueued, 1);

    const queued = await readJsonLines(queuePath);
    assert.equal(queued.length, 1);
    assert.equal(queued[0].source, 'gemini');
    assert.equal(queued[0].model, 'gemini-3-pro-preview');
    assert.equal(queued[0].input_tokens, 2);
    assert.equal(queued[0].cached_input_tokens, 1);
    assert.equal(queued[0].reasoning_output_tokens, 4);
    assert.equal(queued[0].output_tokens, 8); // output + tool
    assert.equal(queued[0].total_tokens, 15);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('parseGeminiIncremental is idempotent with cursor', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibescore-gemini-'));
  try {
    const sessionPath = path.join(tmp, 'session.json');
    const queuePath = path.join(tmp, 'queue.jsonl');
    const cursors = { version: 1, files: {}, updatedAt: null };

    const messages = [
      geminiMessage({
        id: 'm1',
        ts: '2025-12-24T18:07:10.826Z',
        model: 'gemini-3-pro-preview',
        tokens: { input: 1, output: 1, cached: 0, thoughts: 0, tool: 1, total: 3 }
      })
    ];

    await fs.writeFile(sessionPath, buildGeminiSession({ messages }), 'utf8');

    const first = await parseGeminiIncremental({ sessionFiles: [sessionPath], cursors, queuePath, source: 'gemini' });
    const second = await parseGeminiIncremental({ sessionFiles: [sessionPath], cursors, queuePath, source: 'gemini' });

    assert.equal(first.eventsAggregated, 1);
    assert.equal(second.eventsAggregated, 0);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/rollout-parser.test.js`
Expected: FAIL (missing `parseGeminiIncremental`).

**Step 3: Commit**

```bash
git add test/rollout-parser.test.js
git commit -m "test: add gemini parser coverage"
```

---

### Task 2: Implement Gemini parser + listing utilities

**Files:**
- Modify: `src/lib/rollout.js`

**Step 1: Write minimal implementation**

```js
async function listGeminiSessionFiles(tmpDir) {
  const out = [];
  await walkGeminiSessions(tmpDir, out);
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

async function parseGeminiIncremental({ sessionFiles, cursors, queuePath, onProgress, source }) {
  await ensureDir(path.dirname(queuePath));
  const files = Array.isArray(sessionFiles) ? sessionFiles : [];
  const totalFiles = files.length;
  const hourlyState = normalizeHourlyState(cursors?.hourly);
  const touchedBuckets = new Set();
  const defaultSource = normalizeSourceInput(source) || 'gemini';

  if (!cursors.files || typeof cursors.files !== 'object') cursors.files = {};

  let filesProcessed = 0;
  let eventsAggregated = 0;
  for (let idx = 0; idx < files.length; idx++) {
    const entry = files[idx];
    const filePath = typeof entry === 'string' ? entry : entry?.path;
    if (!filePath) continue;
    const st = await fs.stat(filePath).catch(() => null);
    if (!st || !st.isFile()) continue;

    const key = filePath;
    const prev = cursors.files[key] || null;
    const inode = st.ino || 0;

    const result = await parseGeminiFile({
      filePath,
      lastIndex: prev?.lastIndex ?? null,
      lastMessageId: prev?.lastMessageId ?? null,
      lastTimestamp: prev?.lastTimestamp ?? null,
      hourlyState,
      touchedBuckets,
      source: typeof entry === 'string' ? defaultSource : normalizeSourceInput(entry?.source) || defaultSource
    });

    cursors.files[key] = {
      inode,
      lastIndex: result.lastIndex,
      lastMessageId: result.lastMessageId,
      lastTimestamp: result.lastTimestamp,
      updatedAt: new Date().toISOString()
    };

    filesProcessed += 1;
    eventsAggregated += result.eventsAggregated;
    if (typeof onProgress === 'function') {
      onProgress({ index: idx + 1, total: totalFiles, filePath, filesProcessed, eventsAggregated, bucketsQueued: touchedBuckets.size });
    }
  }

  const bucketsQueued = await enqueueTouchedBuckets({ queuePath, hourlyState, touchedBuckets });
  hourlyState.updatedAt = new Date().toISOString();
  cursors.hourly = hourlyState;
  return { filesProcessed, eventsAggregated, bucketsQueued };
}

function normalizeGeminiUsage(tokens) {
  const inputTokens = toNonNegativeInt(tokens?.input);
  const outputTokens = toNonNegativeInt(tokens?.output);
  const toolTokens = toNonNegativeInt(tokens?.tool);
  const cachedTokens = toNonNegativeInt(tokens?.cached);
  const reasoningTokens = toNonNegativeInt(tokens?.thoughts);
  const hasTotal = tokens && Object.prototype.hasOwnProperty.call(tokens, 'total');
  const totalTokens = hasTotal ? toNonNegativeInt(tokens?.total) : inputTokens + outputTokens + toolTokens + cachedTokens + reasoningTokens;
  return {
    input_tokens: inputTokens,
    cached_input_tokens: cachedTokens,
    output_tokens: outputTokens + toolTokens,
    reasoning_output_tokens: reasoningTokens,
    total_tokens: totalTokens
  };
}
```

**Step 2: Run tests**

Run: `node --test test/rollout-parser.test.js`
Expected: PASS for Gemini tests.

**Step 3: Commit**

```bash
git add src/lib/rollout.js
git commit -m "feat(cli): add gemini session parsing"
```

---

### Task 3: Wire Gemini source into sync flow

**Files:**
- Modify: `src/commands/sync.js`

**Step 1: Update sync command**

```js
const { listGeminiSessionFiles, parseGeminiIncremental } = require('../lib/rollout');

const geminiHome = process.env.GEMINI_HOME || path.join(home, '.gemini');
const geminiTmpDir = path.join(geminiHome, 'tmp');
const geminiFiles = await listGeminiSessionFiles(geminiTmpDir);

let geminiResult = { filesProcessed: 0, eventsAggregated: 0, bucketsQueued: 0 };
if (geminiFiles.length > 0) {
  geminiResult = await parseGeminiIncremental({
    sessionFiles: geminiFiles,
    cursors,
    queuePath,
    onProgress: (p) => { /* progress update similar to Claude */ },
    source: 'gemini'
  });
}
```

**Step 2: Run tests**

Run: `node --test test/*.test.js`
Expected: PASS.

**Step 3: Commit**

```bash
git add src/commands/sync.js
git commit -m "feat(cli): ingest gemini usage in sync"
```

---

### Task 4: Regression & documentation alignment

**Files:**
- Modify: `openspec/changes/2025-12-26-add-gemini-cli-usage/tasks.md` (checklist)
- Modify: `openspec/changes/2025-12-26-add-gemini-cli-usage/specs/vibescore-tracker/spec.md`

**Step 1: Ensure checklist matches actual work**
- Mark tasks complete only after code + tests pass.

**Step 2: Run full regression**

Run: `npm test`
Expected: PASS (record in verification report).

**Step 3: Commit**

```bash
git add openspec/changes/2025-12-26-add-gemini-cli-usage
git commit -m "docs(openspec): add gemini usage change proposal"
```
