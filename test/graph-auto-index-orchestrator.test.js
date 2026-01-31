const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { buildPlan } = require('../scripts/graph/auto-index.cjs');

test('buildPlan returns decision and domains', () => {
  const plan = buildPlan({
    rootDir: '/repo',
    deps: {
      fs: {
        readdirSync: () => ['tsconfig.json'],
        existsSync: () => false,
        statSync: () => ({ isDirectory: () => false, isFile: () => true })
      },
      path
    }
  });
  assert.ok(plan.decision);
  assert.ok(plan.domains);
});
