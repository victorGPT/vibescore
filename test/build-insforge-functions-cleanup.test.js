const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const { test } = require('node:test');

test('build script removes stale insforge-functions artifacts', async () => {
  const repoRoot = path.join(__dirname, '..');
  const outDir = path.join(repoRoot, 'insforge-functions');
  const stalePath = path.join(outDir, 'vibescore-stale.js');

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(stalePath, '// stale artifact\n', 'utf8');

  try {
    const result = spawnSync('node', ['scripts/build-insforge-functions.cjs'], {
      cwd: repoRoot,
      encoding: 'utf8'
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);

    const exists = await fs
      .stat(stalePath)
      .then(() => true)
      .catch(() => false);
    assert.equal(exists, false, 'expected stale artifact to be removed');
  } finally {
    await fs.rm(stalePath, { force: true }).catch(() => {});
  }
});
