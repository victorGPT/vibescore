'use strict';

const { applyCanaryFilter } = require('./canary');
const { toBigInt } = require('./numbers');

function createTotals() {
  return {
    total_tokens: 0n,
    input_tokens: 0n,
    cached_input_tokens: 0n,
    output_tokens: 0n,
    reasoning_output_tokens: 0n
  };
}

function addRowTotals(target, row) {
  if (!target || !row) return;
  target.total_tokens += toBigInt(row?.total_tokens);
  target.input_tokens += toBigInt(row?.input_tokens);
  target.cached_input_tokens += toBigInt(row?.cached_input_tokens);
  target.output_tokens += toBigInt(row?.output_tokens);
  target.reasoning_output_tokens += toBigInt(row?.reasoning_output_tokens);
}

async function fetchRollupRows({ edgeClient, userId, fromDay, toDay, source, model }) {
  let query = edgeClient.database
    .from('vibescore_tracker_daily_rollup')
    .select('day,source,model,total_tokens,input_tokens,cached_input_tokens,output_tokens,reasoning_output_tokens')
    .eq('user_id', userId)
    .gte('day', fromDay)
    .lte('day', toDay);
  if (source) query = query.eq('source', source);
  if (model) query = query.eq('model', model);
  query = applyCanaryFilter(query, { source, model });
  const { data, error } = await query.order('day', { ascending: true });
  if (error) return { ok: false, error };
  return { ok: true, rows: Array.isArray(data) ? data : [] };
}

function sumRollupRows(rows) {
  const totals = createTotals();
  for (const row of Array.isArray(rows) ? rows : []) {
    addRowTotals(totals, row);
  }
  return totals;
}

module.exports = {
  createTotals,
  addRowTotals,
  fetchRollupRows,
  sumRollupRows
};
