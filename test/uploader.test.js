const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const { test } = require('node:test');

function stubIngestHourly() {
  const calls = [];
  const apiPath = require.resolve('../src/lib/vibeusage-api');
  const uploaderPath = require.resolve('../src/lib/uploader');
  const original = require.cache[apiPath];
  const originalUploader = require.cache[uploaderPath];
  require.cache[apiPath] = {
    exports: {
      ingestHourly: async ({ hourly, project_hourly, device_subscriptions }) => {
        calls.push({ hourly, project_hourly, device_subscriptions });
        return {
          inserted: (hourly?.length || 0) + (project_hourly?.length || 0),
          skipped: 0
        };
      }
    }
  };
  delete require.cache[uploaderPath];

  const restore = () => {
    if (original) require.cache[apiPath] = original;
    else delete require.cache[apiPath];
    if (originalUploader) require.cache[uploaderPath] = originalUploader;
    else delete require.cache[uploaderPath];
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
    assert.equal(stub.calls[0].hourly.length, 1);
    assert.equal(stub.calls[0].hourly[0].source, 'codex');
    assert.equal(stub.calls[0].hourly[0].model, 'unknown');
  } finally {
    stub.restore();
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('drainQueueToCloud forwards device subscriptions on first batch only', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibescore-uploader-subscriptions-'));
  const queuePath = path.join(tmp, 'queue.jsonl');
  const queueStatePath = path.join(tmp, 'queue.state.json');

  const bucketA = {
    hour_start: '2025-12-17T00:00:00.000Z',
    source: 'codex',
    model: 'unknown',
    input_tokens: 1,
    cached_input_tokens: 0,
    output_tokens: 1,
    reasoning_output_tokens: 0,
    total_tokens: 2
  };
  const bucketB = {
    ...bucketA,
    hour_start: '2025-12-17T00:30:00.000Z'
  };
  await fs.writeFile(queuePath, `${JSON.stringify(bucketA)}\n${JSON.stringify(bucketB)}\n`, 'utf8');

  const stub = stubIngestHourly();
  try {
    const { drainQueueToCloud } = require('../src/lib/uploader');
    await drainQueueToCloud({
      baseUrl: 'http://localhost',
      deviceToken: 'device-token',
      deviceSubscriptions: [
        { tool: 'codex', provider: 'openai', product: 'chatgpt', planType: 'pro' },
        { tool: 'claude', provider: 'anthropic', product: 'subscription', planType: 'max' }
      ],
      queuePath,
      queueStatePath,
      maxBatches: 2,
      batchSize: 1
    });

    assert.equal(stub.calls.length, 2);
    assert.equal(stub.calls[0].device_subscriptions.length, 2);
    assert.equal(stub.calls[1].device_subscriptions, undefined);
  } finally {
    stub.restore();
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('drainQueueToCloud keeps buckets separate per model when hour/source match', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibescore-uploader-'));
  const queuePath = path.join(tmp, 'queue.jsonl');
  const queueStatePath = path.join(tmp, 'queue.state.json');

  const lines = [
    JSON.stringify({
      hour_start: '2025-12-17T00:00:00.000Z',
      source: 'codex',
      model: 'gpt-4o',
      input_tokens: 1,
      cached_input_tokens: 0,
      output_tokens: 1,
      reasoning_output_tokens: 0,
      total_tokens: 2
    }),
    JSON.stringify({
      hour_start: '2025-12-17T00:00:00.000Z',
      source: 'codex',
      model: 'unknown',
      input_tokens: 2,
      cached_input_tokens: 0,
      output_tokens: 2,
      reasoning_output_tokens: 0,
      total_tokens: 4
    })
  ];

  await fs.writeFile(queuePath, lines.join('\n') + '\n', 'utf8');

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
    assert.equal(stub.calls[0].hourly.length, 2);
    const byModel = new Map(stub.calls[0].hourly.map((row) => [row.model, row]));
    assert.ok(byModel.has('gpt-4o'));
    assert.ok(byModel.has('unknown'));
    assert.equal(byModel.get('gpt-4o').total_tokens, 2);
    assert.equal(byModel.get('unknown').total_tokens, 4);
  } finally {
    stub.restore();
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('drainQueueToCloud uploads project buckets even when hourly queue is empty', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibescore-uploader-'));
  const queuePath = path.join(tmp, 'queue.jsonl');
  const queueStatePath = path.join(tmp, 'queue.state.json');
  const projectQueuePath = path.join(tmp, 'project.queue.jsonl');
  const projectQueueStatePath = path.join(tmp, 'project.queue.state.json');

  const projectBucket = {
    project_ref: 'https://github.com/acme/alpha',
    project_key: 'https://github.com/acme/alpha',
    source: 'codex',
    hour_start: '2025-12-17T00:00:00.000Z',
    input_tokens: 1,
    cached_input_tokens: 1,
    output_tokens: 0,
    reasoning_output_tokens: 0,
    total_tokens: 2
  };

  await fs.writeFile(projectQueuePath, JSON.stringify(projectBucket) + '\n', 'utf8');

  const stub = stubIngestHourly();
  try {
    const { drainQueueToCloud } = require('../src/lib/uploader');
    await drainQueueToCloud({
      baseUrl: 'http://localhost',
      deviceToken: 'device-token',
      queuePath,
      queueStatePath,
      projectQueuePath,
      projectQueueStatePath,
      maxBatches: 1,
      batchSize: 10
    });

    assert.equal(stub.calls.length, 1);
    assert.equal(stub.calls[0].hourly.length, 0);
    assert.equal(stub.calls[0].project_hourly.length, 1);
    assert.equal(stub.calls[0].project_hourly[0].project_ref, projectBucket.project_ref);
    assert.equal(stub.calls[0].project_hourly[0].project_key, projectBucket.project_key);
  } finally {
    stub.restore();
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('drainQueueToCloud caps combined batch size across queues', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibescore-uploader-'));
  const queuePath = path.join(tmp, 'queue.jsonl');
  const queueStatePath = path.join(tmp, 'queue.state.json');
  const projectQueuePath = path.join(tmp, 'project.queue.jsonl');
  const projectQueueStatePath = path.join(tmp, 'project.queue.state.json');

  const hourly = [
    '2025-12-17T00:00:00.000Z',
    '2025-12-17T00:30:00.000Z',
    '2025-12-17T01:00:00.000Z',
    '2025-12-17T01:30:00.000Z'
  ].map((hourStart) =>
    JSON.stringify({
      source: 'codex',
      model: 'unknown',
      hour_start: hourStart,
      input_tokens: 1,
      cached_input_tokens: 0,
      output_tokens: 0,
      reasoning_output_tokens: 0,
      total_tokens: 1
    })
  );

  const project = [
    '2025-12-17T02:00:00.000Z',
    '2025-12-17T02:30:00.000Z',
    '2025-12-17T03:00:00.000Z',
    '2025-12-17T03:30:00.000Z'
  ].map((hourStart) =>
    JSON.stringify({
      project_ref: 'https://github.com/acme/alpha',
      project_key: 'acme/alpha',
      source: 'codex',
      hour_start: hourStart,
      input_tokens: 1,
      cached_input_tokens: 0,
      output_tokens: 0,
      reasoning_output_tokens: 0,
      total_tokens: 1
    })
  );

  await fs.writeFile(queuePath, hourly.join('\n') + '\n', 'utf8');
  await fs.writeFile(projectQueuePath, project.join('\n') + '\n', 'utf8');

  const stub = stubIngestHourly();
  try {
    const { drainQueueToCloud } = require('../src/lib/uploader');
    await drainQueueToCloud({
      baseUrl: 'http://localhost',
      deviceToken: 'device-token',
      queuePath,
      queueStatePath,
      projectQueuePath,
      projectQueueStatePath,
      maxBatches: 1,
      batchSize: 4
    });

    assert.equal(stub.calls.length, 1);
    const combined = stub.calls[0].hourly.length + stub.calls[0].project_hourly.length;
    assert.equal(combined, 4);
    assert.ok(stub.calls[0].hourly.length > 0);
    assert.ok(stub.calls[0].project_hourly.length > 0);
  } finally {
    stub.restore();
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('drainQueueToCloud reports combined offset in progress callback', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibescore-uploader-'));
  const queuePath = path.join(tmp, 'queue.jsonl');
  const queueStatePath = path.join(tmp, 'queue.state.json');
  const projectQueuePath = path.join(tmp, 'project.queue.jsonl');
  const projectQueueStatePath = path.join(tmp, 'project.queue.state.json');

  const hourlyBucket = {
    source: 'codex',
    model: 'unknown',
    hour_start: '2025-12-17T00:00:00.000Z',
    input_tokens: 1,
    cached_input_tokens: 0,
    output_tokens: 0,
    reasoning_output_tokens: 0,
    total_tokens: 1
  };
  const projectBucket = {
    project_ref: 'https://github.com/acme/alpha',
    project_key: 'https://github.com/acme/alpha',
    source: 'codex',
    hour_start: '2025-12-17T00:00:00.000Z',
    input_tokens: 1,
    cached_input_tokens: 0,
    output_tokens: 0,
    reasoning_output_tokens: 0,
    total_tokens: 1
  };

  await fs.writeFile(queuePath, JSON.stringify(hourlyBucket) + '\n', 'utf8');
  await fs.writeFile(projectQueuePath, JSON.stringify(projectBucket) + '\n', 'utf8');

  const progress = [];
  const stub = stubIngestHourly();
  try {
    const { drainQueueToCloud } = require('../src/lib/uploader');
    await drainQueueToCloud({
      baseUrl: 'http://localhost',
      deviceToken: 'device-token',
      queuePath,
      queueStatePath,
      projectQueuePath,
      projectQueueStatePath,
      maxBatches: 1,
      batchSize: 10,
      onProgress: (update) => progress.push(update)
    });

    assert.ok(progress.length > 0);
    const last = progress[progress.length - 1];
    assert.equal(last.offset, last.queueSize);
  } finally {
    stub.restore();
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('drainQueueToCloud requires projectQueueStatePath when projectQueuePath is set', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibescore-uploader-'));
  const queuePath = path.join(tmp, 'queue.jsonl');
  const queueStatePath = path.join(tmp, 'queue.state.json');
  const projectQueuePath = path.join(tmp, 'project.queue.jsonl');

  const projectBucket = {
    project_ref: 'https://github.com/acme/alpha',
    project_key: 'https://github.com/acme/alpha',
    source: 'codex',
    hour_start: '2025-12-17T00:00:00.000Z',
    input_tokens: 1,
    cached_input_tokens: 0,
    output_tokens: 0,
    reasoning_output_tokens: 0,
    total_tokens: 1
  };

  await fs.writeFile(queuePath, '', 'utf8');
  await fs.writeFile(projectQueuePath, JSON.stringify(projectBucket) + '\n', 'utf8');

  const stub = stubIngestHourly();
  try {
    const { drainQueueToCloud } = require('../src/lib/uploader');
    await assert.rejects(
      drainQueueToCloud({
        baseUrl: 'http://localhost',
        deviceToken: 'device-token',
        queuePath,
        queueStatePath,
        projectQueuePath,
        maxBatches: 1,
        batchSize: 10
      }),
      /projectQueueStatePath/
    );
  } finally {
    stub.restore();
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
