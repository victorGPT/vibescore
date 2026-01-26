const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { runScipForPlan } = require('../scripts/graph/lib/scip-runner.cjs');

test('runScipForPlan throws when no tsconfig is available', () => {
  const fakeFs = {
    mkdirSync: () => {},
    writeFileSync: () => {},
    existsSync: () => false
  };

  assert.throws(
    () => runScipForPlan({
      rootDir: '/repo',
      plan: { domains: [{ name: 'root', paths: ['.'] }] },
      deps: { fs: fakeFs, execFileSync: () => {}, path }
    }),
    /tsconfig/i
  );
});
