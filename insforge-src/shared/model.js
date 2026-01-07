'use strict';

function normalizeModel(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeUsageModel(value) {
  const normalized = normalizeModel(value);
  if (!normalized) return null;
  const lowered = normalized.toLowerCase();
  if (!lowered) return null;
  const slashIndex = lowered.lastIndexOf('/');
  const candidate = slashIndex >= 0 ? lowered.slice(slashIndex + 1) : lowered;
  return candidate ? candidate : null;
}

function getModelParam(url) {
  if (!url || typeof url.searchParams?.get !== 'function') {
    return { ok: false, error: 'Invalid request URL' };
  }
  const raw = url.searchParams.get('model');
  if (raw == null) return { ok: true, model: null };
  if (raw.trim() === '') return { ok: true, model: null };
  const normalized = normalizeUsageModel(raw);
  if (!normalized) return { ok: false, error: 'Invalid model' };
  return { ok: true, model: normalized };
}

module.exports = {
  normalizeModel,
  normalizeUsageModel,
  getModelParam
};
