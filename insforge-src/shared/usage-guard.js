'use strict';

const { createConcurrencyGuard } = require('./concurrency');

const usageGuard = createConcurrencyGuard({
  name: 'vibeusage-usage',
  envKey: ['VIBEUSAGE_USAGE_MAX_INFLIGHT'],
  defaultMax: 8,
  retryAfterEnvKey: ['VIBEUSAGE_USAGE_RETRY_AFTER_MS'],
  defaultRetryAfterMs: 1000
});

module.exports = {
  usageGuard
};
