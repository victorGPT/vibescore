const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const { parseRolloutIncremental } = require('../src/lib/rollout');

test('parseRolloutIncremental ignores non-remote url sections in git config', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibeusage-gitcfg-'));
  const repoRoot = path.join(tmp, 'repo');
  const gitDir = path.join(repoRoot, '.git');
  await fs.mkdir(gitDir, { recursive: true });
  const configPath = path.join(gitDir, 'config');

  const config = [
    '[remote "origin"]',
    '\turl = https://github.com/acme/repo.git',
    '[branch "main"]',
    '\tremote = origin',
    '[url "https://example.com/"]',
    '\tinsteadOf = https://github.com/',
    '\turl = https://example.com/override',
    ''
  ].join('\n');
  await fs.writeFile(configPath, config, 'utf8');

  const rolloutPath = path.join(repoRoot, 'rollout-2026-01-01.jsonl');
  await fs.writeFile(rolloutPath, '{}\n', 'utf8');

  const queuePath = path.join(tmp, 'queue.jsonl');
  const projectQueuePath = path.join(tmp, 'project.queue.jsonl');

  const cursors = {};
  let captured = null;
  const resolver = async ({ projectRef, repoRoot }) => {
    captured = { projectRef, repoRoot };
    return { status: 'public_verified', projectKey: 'pkey', projectRef };
  };

  await parseRolloutIncremental({
    rolloutFiles: [rolloutPath],
    cursors,
    queuePath,
    projectQueuePath,
    source: 'codex',
    publicRepoResolver: resolver
  });

  assert.ok(captured, 'resolver should be called');
  assert.equal(captured.projectRef, 'https://github.com/acme/repo');
});
