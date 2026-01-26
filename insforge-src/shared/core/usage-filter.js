'use strict';

const { normalizeUsageModel } = require('../model');
const { extractDateKey, resolveIdentityAtDate } = require('../model-alias-timeline');

function shouldIncludeUsageRow({ row, canonicalModel, hasModelFilter, aliasTimeline, to }) {
  if (!hasModelFilter) return true;
  const rawModel = normalizeUsageModel(row?.model);
  const dateKey = extractDateKey(row?.hour_start || row?.day) || to;
  const identity = resolveIdentityAtDate({ rawModel, dateKey, timeline: aliasTimeline });
  const filterIdentity = resolveIdentityAtDate({
    rawModel: canonicalModel,
    usageKey: canonicalModel,
    dateKey,
    timeline: aliasTimeline
  });
  return identity.model_id === filterIdentity.model_id;
}

module.exports = {
  shouldIncludeUsageRow
};
