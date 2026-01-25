'use strict';

const { normalizeSource } = require('../source');
const { normalizeUsageModel } = require('../model');
const { computeBillableTotalTokens } = require('../usage-billable');

const DEFAULT_MODEL = 'unknown';
const BILLABLE_RULE_VERSION = 1;

function normalizeHourlyPayload(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.hourly)) return data.hourly;
    if (Array.isArray(data.data)) return data.data;
    if (data.data && typeof data.data === 'object' && Array.isArray(data.data.hourly)) {
      return data.data.hourly;
    }
  }
  return null;
}

function parseUtcHalfHourStart(value) {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const dt = new Date(value);
  if (!Number.isFinite(dt.getTime())) return null;
  const minutes = dt.getUTCMinutes();
  if ((minutes !== 0 && minutes !== 30) || dt.getUTCSeconds() !== 0 || dt.getUTCMilliseconds() !== 0) {
    return null;
  }
  const hourStart = new Date(
    Date.UTC(
      dt.getUTCFullYear(),
      dt.getUTCMonth(),
      dt.getUTCDate(),
      dt.getUTCHours(),
      minutes >= 30 ? 30 : 0,
      0,
      0
    )
  );
  return hourStart.toISOString();
}

function toNonNegativeInt(n) {
  if (typeof n !== 'number') return null;
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  if (n < 0) return null;
  return n;
}

function parseHourlyBucket(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Invalid half-hour bucket' };

  const hourStart = parseUtcHalfHourStart(raw.hour_start);
  if (!hourStart) {
    return { ok: false, error: 'hour_start must be an ISO timestamp at UTC half-hour boundary' };
  }

  const source = normalizeSource(raw.source);
  const model = normalizeUsageModel(raw.model) || DEFAULT_MODEL;
  const input = toNonNegativeInt(raw.input_tokens);
  const cached = toNonNegativeInt(raw.cached_input_tokens);
  const output = toNonNegativeInt(raw.output_tokens);
  const reasoning = toNonNegativeInt(raw.reasoning_output_tokens);
  const total = toNonNegativeInt(raw.total_tokens);

  if ([input, cached, output, reasoning, total].some((n) => n == null)) {
    return { ok: false, error: 'Token fields must be non-negative integers' };
  }

  return {
    ok: true,
    value: {
      source,
      model,
      hour_start: hourStart,
      input_tokens: input,
      cached_input_tokens: cached,
      output_tokens: output,
      reasoning_output_tokens: reasoning,
      total_tokens: total
    }
  };
}

function buildRows({ hourly, tokenRow, nowIso, billableRuleVersion = BILLABLE_RULE_VERSION }) {
  const byHour = new Map();

  for (const raw of hourly) {
    const parsed = parseHourlyBucket(raw);
    if (!parsed.ok) return { error: parsed.error, data: [] };
    const source = parsed.value.source || 'codex';
    const model = parsed.value.model || DEFAULT_MODEL;
    const dedupeKey = `${parsed.value.hour_start}::${source}::${model}`;
    byHour.set(dedupeKey, { ...parsed.value, source, model });
  }

  const rows = [];
  for (const bucket of byHour.values()) {
    const billable = computeBillableTotalTokens({ source: bucket.source, totals: bucket });
    rows.push({
      user_id: tokenRow.user_id,
      device_id: tokenRow.device_id,
      device_token_id: tokenRow.id,
      source: bucket.source,
      model: bucket.model,
      hour_start: bucket.hour_start,
      input_tokens: bucket.input_tokens,
      cached_input_tokens: bucket.cached_input_tokens,
      output_tokens: bucket.output_tokens,
      reasoning_output_tokens: bucket.reasoning_output_tokens,
      total_tokens: bucket.total_tokens,
      billable_total_tokens: billable.toString(),
      billable_rule_version: billableRuleVersion,
      updated_at: nowIso
    });
  }

  return { error: null, data: rows };
}

function deriveMetricsSource(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const sources = new Set();
  for (const row of rows) {
    const source = typeof row?.source === 'string' ? row.source.trim() : '';
    if (source) sources.add(source);
  }
  if (sources.size === 1) return Array.from(sources)[0];
  if (sources.size > 1) return 'mixed';
  return null;
}

module.exports = {
  DEFAULT_MODEL,
  BILLABLE_RULE_VERSION,
  normalizeHourlyPayload,
  parseUtcHalfHourStart,
  toNonNegativeInt,
  parseHourlyBucket,
  buildRows,
  deriveMetricsSource
};
