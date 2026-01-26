const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const { test } = require('node:test');

function stubUploader() {
  const calls = [];
  const uploaderPath = require.resolve('../src/lib/uploader');
  const syncPath = require.resolve('../src/commands/sync');
  const originalUploader = require.cache[uploaderPath];
  const originalSync = require.cache[syncPath];

  require.cache[uploaderPath] = {
    exports: {
      drainQueueToCloud: async (args) => {
        calls.push(args);
        return { inserted: 0, skipped: 0, attempted: 1 };
      }
    }
  };
  delete require.cache[syncPath];

  const restore = () => {
    if (originalUploader) require.cache[uploaderPath] = originalUploader;
    else delete require.cache[uploaderPath];
    if (originalSync) require.cache[syncPath] = originalSync;
    else delete require.cache[syncPath];
  };

  return { calls, restore };
}

test('sync uploads when only project queue has data', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibeusage-sync-project-'));
  const prevHome = process.env.HOME;
  const prevCodexHome = process.env.CODEX_HOME;

  const stub = stubUploader();
  try {
    process.env.HOME = tmp;
    process.env.CODEX_HOME = path.join(tmp, '.codex');

    const trackerDir = path.join(tmp, '.vibeusage', 'tracker');
    await fs.mkdir(trackerDir, { recursive: true });
    await fs.mkdir(process.env.CODEX_HOME, { recursive: true });

    await fs.writeFile(
      path.join(trackerDir, 'config.json'),
      JSON.stringify({ baseUrl: 'https://example.invalid', deviceToken: 'token', deviceId: 'device' }, null, 2) + '\n',
      'utf8'
    );

    const projectBucket = {
      project_ref: 'https://github.com/acme/alpha',
      project_key: 'acme/alpha',
      source: 'codex',
      hour_start: '2025-12-23T00:00:00.000Z',
      input_tokens: 1,
      cached_input_tokens: 0,
      output_tokens: 0,
      reasoning_output_tokens: 0,
      total_tokens: 1
    };

    const queuePath = path.join(trackerDir, 'queue.jsonl');
    const queueStatePath = path.join(trackerDir, 'queue.state.json');
    const projectQueuePath = path.join(trackerDir, 'project.queue.jsonl');
    const projectQueueStatePath = path.join(trackerDir, 'project.queue.state.json');

    await fs.writeFile(queuePath, '', 'utf8');
    await fs.writeFile(queueStatePath, JSON.stringify({ offset: 0 }) + '\n', 'utf8');
    await fs.writeFile(projectQueuePath, JSON.stringify(projectBucket) + '\n', 'utf8');
    await fs.writeFile(projectQueueStatePath, JSON.stringify({ offset: 0 }) + '\n', 'utf8');

    const { cmdSync } = require('../src/commands/sync');
    await cmdSync([]);

    assert.equal(stub.calls.length, 1);
    assert.equal(stub.calls[0].projectQueuePath, projectQueuePath);
    assert.equal(stub.calls[0].projectQueueStatePath, projectQueueStatePath);
  } finally {
    stub.restore();
    if (prevHome === undefined) delete process.env.HOME;
    else process.env.HOME = prevHome;
    if (prevCodexHome === undefined) delete process.env.CODEX_HOME;
    else process.env.CODEX_HOME = prevCodexHome;
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
