const assert = require('node:assert/strict');
const test = require('node:test');

const { validateScipCoverage } = require('../scripts/graph/lib/validate.cjs');

test('validateScipCoverage accepts relative_path fields', () => {
  const result = validateScipCoverage({
    scipOutputs: [
      {
        scipPath: '/tmp/index.scip',
        domain: { name: 'src', paths: ['src'] }
      }
    ],
    thresholds: { maxNoiseRatio: 1 },
    deps: {
      parseScipFile: () => ({
        documents: [{ relative_path: 'src/foo.ts' }]
      })
    }
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.failures, []);
});
