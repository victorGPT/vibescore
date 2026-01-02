const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

function readFile(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), 'utf8');
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

function normalize(content) {
  return content.replace(/\s+/g, '');
}

test('usage pagination uses deterministic ordering', () => {
  const hourlyOrder =
    "order('hour_start',{ascending:true}).order('device_id',{ascending:true}).order('source',{ascending:true}).order('model',{ascending:true})";
  const rollupOrder =
    "order('day',{ascending:true}).order('source',{ascending:true}).order('model',{ascending:true})";
  const adminOrder =
    "order('hour_start',{ascending:true}).order('user_id',{ascending:true}).order('device_id',{ascending:true}).order('source',{ascending:true}).order('model',{ascending:true})";

  assert.ok(normalize(readFile('insforge-src/shared/usage-rollup.js')).includes(rollupOrder));
  assert.equal(
    countOccurrences(
      normalize(readFile('insforge-src/functions/vibescore-usage-summary.js')),
      hourlyOrder
    ),
    0
  );
  assert.equal(
    countOccurrences(
      normalize(readFile('insforge-src/functions/vibescore-usage-daily.js')),
      hourlyOrder
    ),
    1
  );
  assert.equal(
    countOccurrences(
      normalize(readFile('insforge-src/functions/vibescore-usage-model-breakdown.js')),
      hourlyOrder
    ),
    1
  );
  assert.equal(
    countOccurrences(
      normalize(readFile('insforge-src/functions/vibescore-usage-monthly.js')),
      hourlyOrder
    ),
    1
  );
  assert.equal(
    countOccurrences(
      normalize(readFile('insforge-src/functions/vibescore-usage-heatmap.js')),
      hourlyOrder
    ),
    2
  );
  assert.equal(
    countOccurrences(
      normalize(readFile('insforge-src/functions/vibescore-usage-hourly.js')),
      hourlyOrder
    ),
    2
  );
  assert.ok(
    normalize(readFile('insforge-src/functions/vibescore-pricing-sync.js')).includes(adminOrder)
  );
});
