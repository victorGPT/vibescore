'use strict';

const { createTotals } = require('../usage-rollup');

function getSourceEntry(map, source) {
  if (map.has(source)) return map.get(source);
  const entry = {
    source,
    totals: createTotals()
  };
  map.set(source, entry);
  return entry;
}

function resolveDisplayName(identityMap, modelId) {
  if (!modelId || !identityMap || typeof identityMap.values !== 'function') return modelId || null;
  for (const entry of identityMap.values()) {
    if (entry?.model_id === modelId && entry?.model) return entry.model;
  }
  return modelId;
}

function buildPricingBucketKey(sourceKey, usageKey, dateKey) {
  return JSON.stringify([sourceKey || '', usageKey || '', dateKey || '']);
}

function parsePricingBucketKey(bucketKey, defaultDate) {
  if (typeof bucketKey === 'string' && bucketKey.startsWith('[')) {
    try {
      const parsed = JSON.parse(bucketKey);
      if (Array.isArray(parsed)) {
        const usageKey = parsed[1] ?? parsed[0] ?? '';
        const dateKey = parsed[2] ?? defaultDate;
        return {
          usageKey: String(usageKey || ''),
          dateKey: String(dateKey || defaultDate)
        };
      }
    } catch (_e) {
      // fall through to legacy parsing
    }
  }
  if (typeof bucketKey === 'string') {
    const parts = bucketKey.split('::');
    let usageKey = null;
    let dateKey = null;
    if (parts.length >= 3) {
      usageKey = parts[1];
      dateKey = parts[2];
    } else if (parts.length === 2) {
      usageKey = parts[0];
      dateKey = parts[1];
    } else {
      usageKey = bucketKey;
    }
    return { usageKey, dateKey: dateKey || defaultDate };
  }
  return { usageKey: bucketKey, dateKey: defaultDate };
}

module.exports = {
  getSourceEntry,
  resolveDisplayName,
  buildPricingBucketKey,
  parsePricingBucketKey
};
