# Unknown Model Backfill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reassign unknown token totals to the dominant known model within the same source + half-hour bucket, without merging known models, and align every-code unknown buckets to the nearest codex dominant model.

**Architecture:** Keep parsing logic unchanged, but adjust enqueue logic to group touched buckets by source + hour, then move unknown totals into the dominant known model (max total_tokens, tie-breaker lexicographic). Emit unknown only if no known models exist. Preserve per-model buckets for known models. After that, align every-code unknown buckets to the nearest codex bucket (absolute time distance, tie-breaker earlier hour_start).

**Tech Stack:** Node.js CLI, parser in `src/lib/rollout.js`, tests via `node --test`.

### Task 1: Add failing tests for unknown backfill

**Files:**
- Modify: `test/rollout-parser.test.js`

**Step 1: Write the failing tests**

Add tests near existing rollout parser model tests:

```js
test('parseRolloutIncremental backfills unknown into dominant known model', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibescore-rollout-'));
  try {
    const rolloutPath = path.join(tmp, 'rollout-test.jsonl');
    const queuePath = path.join(tmp, 'queue.jsonl');
    const cursors = { version: 1, files: {}, updatedAt: null };

    const usageUnknown = { input_tokens: 1, cached_input_tokens: 0, output_tokens: 1, reasoning_output_tokens: 0, total_tokens: 2 };
    const usageA = { input_tokens: 2, cached_input_tokens: 0, output_tokens: 1, reasoning_output_tokens: 0, total_tokens: 3 };
    const usageB = { input_tokens: 3, cached_input_tokens: 0, output_tokens: 1, reasoning_output_tokens: 0, total_tokens: 4 };

    const lines = [
      buildTokenCountLine({ ts: '2025-12-17T00:05:00.000Z', last: usageUnknown, total: usageUnknown }),
      buildTurnContextLine({ model: 'gpt-4o' }),
      buildTokenCountLine({ ts: '2025-12-17T00:10:00.000Z', last: usageA, total: usageA }),
      buildTurnContextLine({ model: 'gpt-4o-mini' }),
      buildTokenCountLine({ ts: '2025-12-17T00:15:00.000Z', last: usageB, total: usageB })
    ];

    await fs.writeFile(rolloutPath, lines.join('\n') + '\n', 'utf8');

    const res = await parseRolloutIncremental({ rolloutFiles: [rolloutPath], cursors, queuePath });
    assert.equal(res.bucketsQueued, 2);

    const queued = await readJsonLines(queuePath);
    assert.equal(queued.length, 2);
    const byModel = new Map(queued.map((row) => [row.model, row]));
    assert.ok(byModel.has('gpt-4o'));
    assert.ok(byModel.has('gpt-4o-mini'));
    assert.equal(byModel.get('gpt-4o').total_tokens, usageA.total_tokens);
    assert.equal(byModel.get('gpt-4o-mini').total_tokens, usageB.total_tokens + usageUnknown.total_tokens);
    assert.ok(!byModel.has('unknown'));
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('parseRolloutIncremental chooses dominant model deterministically on tie', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibescore-rollout-'));
  try {
    const rolloutPath = path.join(tmp, 'rollout-test.jsonl');
    const queuePath = path.join(tmp, 'queue.jsonl');
    const cursors = { version: 1, files: {}, updatedAt: null };

    const usageUnknown = { input_tokens: 1, cached_input_tokens: 0, output_tokens: 0, reasoning_output_tokens: 0, total_tokens: 1 };
    const usageA = { input_tokens: 2, cached_input_tokens: 0, output_tokens: 1, reasoning_output_tokens: 0, total_tokens: 3 };
    const usageB = { input_tokens: 2, cached_input_tokens: 0, output_tokens: 1, reasoning_output_tokens: 0, total_tokens: 3 };

    const lines = [
      buildTokenCountLine({ ts: '2025-12-17T00:05:00.000Z', last: usageUnknown, total: usageUnknown }),
      buildTurnContextLine({ model: 'gpt-4o-mini' }),
      buildTokenCountLine({ ts: '2025-12-17T00:10:00.000Z', last: usageB, total: usageB }),
      buildTurnContextLine({ model: 'gpt-4o' }),
      buildTokenCountLine({ ts: '2025-12-17T00:15:00.000Z', last: usageA, total: usageA })
    ];

    await fs.writeFile(rolloutPath, lines.join('\n') + '\n', 'utf8');

    const res = await parseRolloutIncremental({ rolloutFiles: [rolloutPath], cursors, queuePath });
    assert.equal(res.bucketsQueued, 2);

    const queued = await readJsonLines(queuePath);
    const byModel = new Map(queued.map((row) => [row.model, row]));
    assert.ok(byModel.has('gpt-4o'));
    assert.ok(byModel.has('gpt-4o-mini'));
    assert.equal(byModel.get('gpt-4o').total_tokens, usageA.total_tokens + usageUnknown.total_tokens);
    assert.equal(byModel.get('gpt-4o-mini').total_tokens, usageB.total_tokens);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('parseRolloutIncremental aligns every-code unknown to nearest codex model', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibescore-rollout-'));
  try {
    const codexPath = path.join(tmp, 'rollout-codex.jsonl');
    const everyPath = path.join(tmp, 'rollout-every.jsonl');
    const queuePath = path.join(tmp, 'queue.jsonl');
    const cursors = { version: 1, files: {}, updatedAt: null };

    const codexUsage = { input_tokens: 4, cached_input_tokens: 0, output_tokens: 1, reasoning_output_tokens: 0, total_tokens: 5 };
    const everyUsage = { input_tokens: 1, cached_input_tokens: 0, output_tokens: 0, reasoning_output_tokens: 0, total_tokens: 1 };

    const codexLines = [
      buildTurnContextLine({ model: 'gpt-4o' }),
      buildTokenCountLine({ ts: '2025-12-17T00:30:00.000Z', last: codexUsage, total: codexUsage })
    ];
    const everyLines = [
      buildTokenCountLine({ ts: '2025-12-17T00:10:00.000Z', last: everyUsage, total: everyUsage })
    ];

    await fs.writeFile(codexPath, codexLines.join('\\n') + '\\n', 'utf8');
    await fs.writeFile(everyPath, everyLines.join('\\n') + '\\n', 'utf8');

    const res = await parseRolloutIncremental({
      rolloutFiles: [
        { path: codexPath, source: 'codex' },
        { path: everyPath, source: 'every-code' }
      ],
      cursors,
      queuePath
    });
    assert.equal(res.bucketsQueued, 2);

    const queued = await readJsonLines(queuePath);
    const bySource = new Map(queued.map((row) => [row.source, row]));
    assert.equal(bySource.get('every-code').model, 'gpt-4o');
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('parseRolloutIncremental breaks ties by earlier codex bucket', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibescore-rollout-'));
  try {
    const codexPath = path.join(tmp, 'rollout-codex.jsonl');
    const everyPath = path.join(tmp, 'rollout-every.jsonl');
    const queuePath = path.join(tmp, 'queue.jsonl');
    const cursors = { version: 1, files: {}, updatedAt: null };

    const usage = { input_tokens: 2, cached_input_tokens: 0, output_tokens: 0, reasoning_output_tokens: 0, total_tokens: 2 };

    const codexLines = [
      buildTurnContextLine({ model: 'gpt-4o' }),
      buildTokenCountLine({ ts: '2025-12-17T00:00:00.000Z', last: usage, total: usage }),
      buildTurnContextLine({ model: 'gpt-4o-mini' }),
      buildTokenCountLine({ ts: '2025-12-17T01:00:00.000Z', last: usage, total: usage })
    ];
    const everyLines = [
      buildTokenCountLine({ ts: '2025-12-17T00:30:00.000Z', last: usage, total: usage })
    ];

    await fs.writeFile(codexPath, codexLines.join('\\n') + '\\n', 'utf8');
    await fs.writeFile(everyPath, everyLines.join('\\n') + '\\n', 'utf8');

    const res = await parseRolloutIncremental({
      rolloutFiles: [
        { path: codexPath, source: 'codex' },
        { path: everyPath, source: 'every-code' }
      ],
      cursors,
      queuePath
    });
    assert.equal(res.bucketsQueued, 2);

    const queued = await readJsonLines(queuePath);
    const bySource = new Map(queued.map((row) => [row.source, row]));
    assert.equal(bySource.get('every-code').model, 'gpt-4o');
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/rollout-parser.test.js`
Expected: FAIL with assertions about unknown backfill.

### Task 2: Implement unknown backfill in enqueue logic

**Files:**
- Modify: `src/lib/rollout.js`

**Step 1: Implement minimal change**
- In `enqueueTouchedBuckets`, build a per-group map (source + hour) for non-legacy groups.
- For each group, if known models exist and unknown totals exist:
  - Choose dominant known model by `total_tokens`, tie-break lexicographic.
  - Add unknown totals to dominant model totals.
  - Remove unknown bucket from output (and state if necessary).
- Preserve known model buckets as-is.
- For every-code buckets that remain unknown, align to nearest codex dominant model (absolute time distance, tie-breaker earlier hour_start).

**Step 2: Run tests to verify pass**
Run: `node --test test/rollout-parser.test.js`
Expected: PASS

### Task 3: Regression + verification updates

**Files:**
- Modify: `openspec/changes/2025-12-27-backfill-unknown-models/tasks.md`
- Modify: `openspec/changes/2025-12-27-backfill-unknown-models/verification-report.md`

**Step 1: Run regression**
Run: `node --test test/*.test.js`
Expected: PASS

**Step 2: Update verification report**
- Record commands and results.

### Task 4: Commit

**Step 1: Commit**
```bash
git add test/rollout-parser.test.js src/lib/rollout.js openspec/changes/2025-12-27-backfill-unknown-models/tasks.md openspec/changes/2025-12-27-backfill-unknown-models/verification-report.md

git commit -m "feat: backfill unknown model totals"
```
