const test = require('node:test');
const assert = require('node:assert');
const { writePlan } = require('../scripts/graph/lib/plan-writer.cjs');

test('writePlan writes graph.plan.json', () => {
  let written = null;
  const fakeFs = {
    writeFileSync: (p, v) => { written = { p, v }; }
  };
  writePlan({ rootDir: '/repo', fs: fakeFs, plan: { decision: 'split' } });
  assert.equal(written.p, '/repo/graph.plan.json');
  assert.ok(written.v.includes('"decision": "split"'));
});
