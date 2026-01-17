const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { test } = require('node:test');

const repoRoot = path.join(__dirname, '..');
const targets = [
  'README.md',
  'README.zh-CN.md',
  'BACKEND_API.md',
  path.join('docs', 'dashboard', 'api.md'),
  path.join('docs', 'ops', 'usage-rollup-recovery.md'),
  path.join('scripts', 'acceptance', 'ingest-concurrency-guard.cjs'),
  path.join('scripts', 'acceptance', 'npm-install-smoke.cjs'),
  path.join('scripts', 'ops', 'backfill-codex-unknown.cjs'),
  path.join('scripts', 'ops', 'billable-total-tokens-backfill.cjs'),
  path.join('scripts', 'ops', 'ingest-canary.cjs'),
  path.join('scripts', 'ops', 'opencode-usage-audit.cjs'),
  path.join('scripts', 'smoke', 'insforge-smoke.cjs')
];

async function read(relPath) {
  return fs.readFile(path.join(repoRoot, relPath), 'utf8');
}

test('docs and smoke script do not reference vibescore naming', async () => {
  for (const relPath of targets) {
    const content = await read(relPath);
    assert.ok(!/vibescore/i.test(content), `${relPath} should not reference vibescore`);
  }
});
