const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

test('init handles background sync spawn errors', () => {
  const script = path.join(__dirname, 'fixtures', 'init-spawn-error.cjs');
  const result = spawnSync(process.execPath, [script], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
});
