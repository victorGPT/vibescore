const test = require('node:test');
const assert = require('node:assert');
const { decideSplit } = require('../scripts/graph/lib/split-decision.cjs');

test('decideSplit chooses split when size threshold reached', () => {
  const decision = decideSplit({
    metrics: [{ name: 'src', fileCount: 500, noiseRatio: 0.05 }],
    thresholds: { splitMinFiles: 200, maxNoiseRatio: 0.15, minDomainsToSplit: 1 }
  });
  assert.equal(decision.decision, 'split');
});
