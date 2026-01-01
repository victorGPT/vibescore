const assert = require('node:assert/strict');
const { test } = require('node:test');

const { fetchRollupRows } = require('../insforge-src/shared/usage-rollup');

const ROW_LIMIT = 1000;

function buildRows(count) {
  return Array.from({ length: count }, (_, index) => ({
    day: `2025-01-${String((index % 30) + 1).padStart(2, '0')}`,
    source: 'codex',
    model: 'gpt-test',
    total_tokens: 1,
    input_tokens: 1,
    cached_input_tokens: 0,
    output_tokens: 0,
    reasoning_output_tokens: 0
  }));
}

function createEdgeClient(rows) {
  const stats = {
    rangeCalls: 0,
    orderCalls: []
  };

  const createQuery = () => {
    const query = {
      select() {
        return query;
      },
      eq() {
        return query;
      },
      gte() {
        return query;
      },
      lte() {
        return query;
      },
      neq() {
        return query;
      },
      order(column) {
        stats.orderCalls.push(column);
        return query;
      },
      range(start, end) {
        stats.rangeCalls += 1;
        return Promise.resolve({ data: rows.slice(start, end + 1), error: null });
      },
      then(onFulfilled, onRejected) {
        return Promise.resolve({ data: rows.slice(0, ROW_LIMIT), error: null }).then(
          onFulfilled,
          onRejected
        );
      }
    };

    return query;
  };

  return {
    edgeClient: {
      database: {
        from() {
          return createQuery();
        }
      }
    },
    stats
  };
}

test('fetchRollupRows paginates past db row limit', async () => {
  const rows = buildRows(ROW_LIMIT + 5);
  const { edgeClient, stats } = createEdgeClient(rows);

  const result = await fetchRollupRows({
    edgeClient,
    userId: 'user_123',
    fromDay: '2025-01-01',
    toDay: '2025-12-31'
  });

  assert.equal(result.ok, true);
  assert.equal(result.rows.length, rows.length);
  assert.ok(stats.rangeCalls >= 2, 'expected paginated range calls');
});

test('fetchRollupRows orders by day, source, model for deterministic pagination', async () => {
  const rows = buildRows(ROW_LIMIT + 1);
  const { edgeClient, stats } = createEdgeClient(rows);

  const result = await fetchRollupRows({
    edgeClient,
    userId: 'user_123',
    fromDay: '2025-01-01',
    toDay: '2025-12-31'
  });

  assert.equal(result.ok, true);
  assert.ok(stats.orderCalls.length >= 3, 'expected multiple order calls');
  assert.deepEqual(stats.orderCalls.slice(0, 3), ['day', 'source', 'model']);
});
