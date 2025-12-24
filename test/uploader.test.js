const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const { test } = require('node:test');

function stubIngestHourly() {
  const calls = [];
  const apiPath = require.resolve('../src/lib/vibescore-api');
  const original = require.cache[apiPath];
  require.cache[apiPath] = {
    exports: {
      ingestHourly: async ({ hourly }) => {
        calls.push(hourly);
        return { inserted: hourly.length, skipped: 0 };
      }
    }
  };

  const restore = () => {
    if (original) require.cache[apiPath] = original;
    else delete require.cache[apiPath];
  };

  return { calls, restore };
}

test('drainQueueToCloud defaults missing source to codex', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibescore-uploader-'));
  const queuePath = path.join(tmp, 'queue.jsonl');
  const queueStatePath = path.join(tmp, 'queue.state.json');

  const bucket = {
    hour_start: '2025-12-17T00:00:00.000Z',
    input_tokens: 1,
    cached_input_tokens: 0,
    output_tokens: 2,
    reasoning_output_tokens: 0,
    total_tokens: 3
  };

  await fs.writeFile(queuePath, JSON.stringify(bucket) + '\n', 'utf8');

  const stub = stubIngestHourly();
  try {
    const { drainQueueToCloud } = require('../src/lib/uploader');
    await drainQueueToCloud({
      baseUrl: 'http://localhost',
      deviceToken: 'device-token',
      queuePath,
      queueStatePath,
      maxBatches: 1,
      batchSize: 10
    });

    assert.equal(stub.calls.length, 1);
    assert.equal(stub.calls[0].length, 1);
    assert.equal(stub.calls[0][0].source, 'codex');
  } finally {
    stub.restore();
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
