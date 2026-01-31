const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { runScipForPlan } = require('../scripts/graph/lib/scip-runner.cjs');

test('runScipForPlan invokes scip-typescript per domain', () => {
  const calls = [];
  let tsconfigJson = null;
  const deps = {
    fs: {
      mkdirSync: () => {},
      existsSync: (p) => p.endsWith('tsconfig.json'),
      writeFileSync: (p, v) => {
        if (p.includes('tsconfig.src.json')) {
          tsconfigJson = JSON.parse(v);
        }
      }
    },
    path,
    execFileSync: (bin, args) => calls.push([bin, args]),
    scipBin: '/bin/scip-typescript'
  };
  const plan = {
    decision: 'split',
    domains: [{ name: 'src', paths: ['src'] }, { name: 'packages', paths: ['packages'] }]
  };
  const outputs = runScipForPlan({ rootDir: '/repo', plan, deps });
  assert.equal(outputs.length, 2);
  assert.equal(calls.length, 2);
  assert.ok(calls[0][1].includes('--output'));

  const tmpDir = path.join('/repo', '.tmp', 'graph', 'auto-index');
  const expectedInclude = path.join(path.relative(tmpDir, path.join('/repo', 'src')), '**/*');
  assert.ok(tsconfigJson.include.includes(expectedInclude));
});
