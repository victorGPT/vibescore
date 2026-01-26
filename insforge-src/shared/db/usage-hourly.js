'use strict';

const { applyUsageModelFilter } = require('../model');
const { applyCanaryFilter } = require('../canary');

function buildHourlyUsageQuery({
  edgeClient,
  userId,
  source,
  usageModels,
  canonicalModel,
  startIso,
  endIso,
  select
} = {}) {
  if (!edgeClient?.database?.from) {
    throw new Error('edgeClient is required');
  }
  let query = edgeClient.database
    .from('vibeusage_tracker_hourly')
    .select(select || 'hour_start,source,model,total_tokens');

  query = query.eq('user_id', userId);
  if (source) query = query.eq('source', source);
  if (Array.isArray(usageModels) && usageModels.length > 0) {
    query = applyUsageModelFilter(query, usageModels);
  }
  query = applyCanaryFilter(query, { source, model: canonicalModel });

  if (startIso) query = query.gte('hour_start', startIso);
  if (endIso) query = query.lt('hour_start', endIso);

  return query
    .order('hour_start', { ascending: true })
    .order('device_id', { ascending: true })
    .order('source', { ascending: true })
    .order('model', { ascending: true });
}

module.exports = {
  buildHourlyUsageQuery
};
