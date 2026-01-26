const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { purgeProjectUsage } = require('../src/lib/project-usage-purge');

async function readJsonLines(filePath) {
  const raw = await fs.readFile(filePath, 'utf8').catch(() => '');
  if (!raw.trim()) return [];
  return raw
    .trim()
    .split(/\n+/)
    .map((line) => JSON.parse(line));
}

test('purgeProjectUsage removes project buckets and resets queue state', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibescore-purge-'));
  try {
    const projectQueuePath = path.join(tmp, 'project.queue.jsonl');
    const projectQueueStatePath = path.join(tmp, 'project.queue.state.json');

    const projectA = {
      project_key: 'acme/alpha',
      project_ref: 'https://github.com/acme/alpha',
      source: 'codex',
      hour_start: '2025-12-17T00:00:00.000Z',
      input_tokens: 1,
      cached_input_tokens: 0,
      output_tokens: 0,
      reasoning_output_tokens: 0,
      total_tokens: 1
    };
    const projectB = {
      project_key: 'acme/beta',
      project_ref: 'https://github.com/acme/beta',
      source: 'codex',
      hour_start: '2025-12-17T00:00:00.000Z',
      input_tokens: 2,
      cached_input_tokens: 0,
      output_tokens: 0,
      reasoning_output_tokens: 0,
      total_tokens: 2
    };

    await fs.writeFile(projectQueuePath, `${JSON.stringify(projectA)}\n${JSON.stringify(projectB)}\n`, 'utf8');
    await fs.writeFile(projectQueueStatePath, JSON.stringify({ offset: 123 }), 'utf8');

    const projectState = {
      version: 2,
      buckets: {
        'acme/alpha|codex|2025-12-17T00:00:00.000Z': { project_key: 'acme/alpha' },
        'acme/beta|codex|2025-12-17T00:00:00.000Z': { project_key: 'acme/beta' }
      },
      projects: {}
    };

    const result = await purgeProjectUsage({
      projectKey: 'acme/alpha',
      projectQueuePath,
      projectQueueStatePath,
      projectState
    });

    assert.equal(result.removed, 1);
    assert.equal(Object.keys(projectState.buckets).length, 1);
    const lines = await readJsonLines(projectQueuePath);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].project_key, 'acme/beta');
    const state = JSON.parse(await fs.readFile(projectQueueStatePath, 'utf8'));
    assert.equal(state.offset, 0);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
