const test = require('node:test');
const assert = require('node:assert');
const { validateScipCoverage } = require('../scripts/graph/lib/validate.cjs');

test('validateScipCoverage fails when domain has zero docs', () => {
  const deps = {
    parseScipFile: () => ({ documents: [] })
  };
  const result = validateScipCoverage({
    scipOutputs: [{ domain: { name: 'src', paths: ['src'] }, scipPath: '/repo/index.src.scip' }],
    thresholds: { maxNoiseRatio: 0.15 },
    deps
  });
  assert.equal(result.ok, false);
});

test('validateScipCoverage accepts root domain by including all docs', () => {
  const deps = {
    parseScipFile: () => ({
      documents: [
        { relative_path: 'src/a.ts', occurrences: [] },
        { relativePath: 'lib/b.ts', occurrences: [] }
      ]
    })
  };
  const result = validateScipCoverage({
    scipOutputs: [{ domain: { name: 'root', paths: ['.'] }, scipPath: '/repo/index.root.scip' }],
    thresholds: { maxNoiseRatio: 0.15 },
    deps
  });
  assert.equal(result.ok, true);
});
