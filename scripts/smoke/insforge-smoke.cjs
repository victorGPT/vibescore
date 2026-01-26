#!/usr/bin/env node
'use strict';

/**
 * Developer smoke test (requires a verified email/password account).
 *
 * Env:
 * - VIBEUSAGE_INSFORGE_BASE_URL (default https://5tmappuk.us-east.insforge.app)
 * - VIBEUSAGE_SMOKE_EMAIL (required)
 * - VIBEUSAGE_SMOKE_PASSWORD (required)
 * - VIBEUSAGE_SMOKE_ALLOW_NO_HEATMAP ("1" to ignore missing heatmap endpoint)
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
loadDotEnv();

const AUTH_RETRY_DELAY_MS = normalizePositiveInt(process.env.VIBEUSAGE_SMOKE_AUTH_RETRY_MS, 5000);
const AUTH_RETRIES = normalizePositiveInt(process.env.VIBEUSAGE_SMOKE_AUTH_RETRIES, 6);

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});

function loadDotEnv() {
  const root = path.resolve(__dirname, '..', '..');
  for (const filename of ['.env', '.env.local']) {
    const filePath = path.join(root, filename);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;
      const key = match[1];
      if (process.env[key] !== undefined) continue;
      let value = match[2] ?? '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

async function main() {
  const baseUrl = process.env.VIBEUSAGE_INSFORGE_BASE_URL || 'https://5tmappuk.us-east.insforge.app';
  const email = process.env.VIBEUSAGE_SMOKE_EMAIL || '';
  const password = process.env.VIBEUSAGE_SMOKE_PASSWORD || '';
  const allowNoHeatmap = process.env.VIBEUSAGE_SMOKE_ALLOW_NO_HEATMAP === '1';

  if (!email || !password) {
    throw new Error('Missing env: VIBEUSAGE_SMOKE_EMAIL / VIBEUSAGE_SMOKE_PASSWORD');
  }

  const accessToken = await signInWithPassword({ baseUrl, email, password });
  await sleep(1500);
  const beforeSummary = await withAuthRetry(() => usageSummary({ baseUrl, accessToken }));
  const beforeTotal = parseBigInt(beforeSummary?.totals?.total_tokens, 'summary.totals.total_tokens');

  const device = await issueDeviceToken({ baseUrl, accessToken, deviceName: `smoke-${Date.now()}` });

  const { eventDay, event: ev } = buildEvent();
  const first = await ingest({ baseUrl, deviceToken: device.token, events: [ev] });
  const second = await ingest({ baseUrl, deviceToken: device.token, events: [ev] });

  assert.equal(first.success, true);
  assert.equal(second.success, true);
  assert.ok(Number.isFinite(Number(first.inserted)));
  assert.ok(Number.isFinite(Number(first.skipped)));
  assert.ok(Number.isFinite(Number(second.inserted)));
  assert.ok(Number.isFinite(Number(second.skipped)));

  const afterSummary = await waitForSummaryTotalAtLeast({
    baseUrl,
    accessToken,
    minTotal: beforeTotal + 3n
  });

  const daily = await withAuthRetry(() =>
    usageDaily({ baseUrl, accessToken, from: eventDay, to: eventDay })
  );
  const dayRow = Array.isArray(daily?.data) ? daily.data.find((r) => r?.day === eventDay) : null;
  assert.ok(dayRow, `Expected usage daily to include day=${eventDay}`);
  assert.ok(parseBigInt(dayRow?.total_tokens, 'daily.data[].total_tokens') >= 3n);

  let heatmap = null;
  try {
    heatmap = await withAuthRetry(() =>
      usageHeatmap({ baseUrl, accessToken, weeks: 2, to: eventDay, weekStartsOn: 'sun' })
    );
  } catch (err) {
    if (allowNoHeatmap && String(err && err.message ? err.message : err).includes('HTTP 404')) {
      heatmap = null;
    } else {
      throw err;
    }
  }

  const leaderboardWeek = await withAuthRetry(() =>
    usageLeaderboard({ baseUrl, accessToken, period: 'week', limit: 20 })
  );
  validateLeaderboardContract(leaderboardWeek);

  const leaderboardTotal = await withAuthRetry(() =>
    usageLeaderboard({ baseUrl, accessToken, period: 'total', limit: 20 })
  );
  validateLeaderboardContract(leaderboardTotal);

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl,
        deviceId: device.deviceId,
        ingest: { first, second },
        summary: {
          before: beforeSummary?.totals || null,
          after: afterSummary?.totals || null
        },
        daily: { day: eventDay, row: dayRow || null },
        heatmap: heatmap
          ? {
              from: heatmap.from,
              to: heatmap.to,
              week_starts_on: heatmap.week_starts_on,
              active_days: heatmap.active_days,
              streak_days: heatmap.streak_days,
              weeks: Array.isArray(heatmap.weeks) ? heatmap.weeks.length : null
            }
          : null,
        leaderboard: {
          week: {
            period: leaderboardWeek.period,
            from: leaderboardWeek.from,
            to: leaderboardWeek.to,
            entries: Array.isArray(leaderboardWeek.entries) ? leaderboardWeek.entries.length : null,
            me: leaderboardWeek.me || null
          },
          total: {
            period: leaderboardTotal.period,
            from: leaderboardTotal.from,
            to: leaderboardTotal.to,
            entries: Array.isArray(leaderboardTotal.entries) ? leaderboardTotal.entries.length : null,
            me: leaderboardTotal.me || null
          }
        }
      },
      null,
      2
    )
  );
}

function buildEvent() {
  const now = new Date();
  const minutes = now.getUTCMinutes();
  const halfHour = minutes >= 30 ? 30 : 0;
  const hourStart = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    halfHour,
    0,
    0
  ));
  const eventDay = hourStart.toISOString().slice(0, 10);
  return {
    eventDay,
    event: {
      hour_start: hourStart.toISOString(),
      source: 'codex',
      model: 'smoke',
      input_tokens: 1,
      cached_input_tokens: 0,
      output_tokens: 2,
      reasoning_output_tokens: 0,
      total_tokens: 3
    }
  };
}

async function signInWithPassword({ baseUrl, email, password }) {
  const url = new URL('/api/auth/sessions', baseUrl).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const { data, error } = await readJson(res);
  if (!res.ok) throw new Error(`Sign-in failed: ${error || `HTTP ${res.status}`}`);

  const accessToken = data?.accessToken;
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    throw new Error('Sign-in failed: missing accessToken');
  }

  return accessToken;
}

async function issueDeviceToken({ baseUrl, accessToken, deviceName }) {
  const url = new URL('/functions/vibeusage-device-token-issue', baseUrl).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_name: deviceName, platform: 'macos' })
  });

  const { data, error } = await readJson(res);
  if (!res.ok) throw new Error(`Device token issue failed: ${error || `HTTP ${res.status}`}`);

  const token = data?.token;
  const deviceId = data?.device_id;
  if (typeof token !== 'string' || token.length === 0) throw new Error('Device token issue failed: missing token');
  if (typeof deviceId !== 'string' || deviceId.length === 0) throw new Error('Device token issue failed: missing device_id');

  return { token, deviceId };
}

async function ingest({ baseUrl, deviceToken, events }) {
  const url = new URL('/functions/vibeusage-ingest', baseUrl).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${deviceToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ hourly: events })
  });

  const { data, error } = await readJson(res);
  if (!res.ok) throw new Error(`Ingest failed: ${error || `HTTP ${res.status}`}`);

  return data;
}

async function usageSummary({ baseUrl, accessToken }) {
  const url = new URL('/functions/vibeusage-usage-summary', baseUrl).toString();
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const { data, error } = await readJson(res);
  if (!res.ok) throw new Error(`Usage summary failed: ${error || `HTTP ${res.status}`}`);

  return data;
}

async function usageDaily({ baseUrl, accessToken, from, to }) {
  const url = new URL('/functions/vibeusage-usage-daily', baseUrl);
  if (from) url.searchParams.set('from', from);
  if (to) url.searchParams.set('to', to);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const { data, error } = await readJson(res);
  if (!res.ok) throw new Error(`Usage daily failed: ${error || `HTTP ${res.status}`}`);

  return data;
}

async function usageHeatmap({ baseUrl, accessToken, weeks, to, weekStartsOn }) {
  const url = new URL('/functions/vibeusage-usage-heatmap', baseUrl);
  if (weeks != null) url.searchParams.set('weeks', String(weeks));
  if (to) url.searchParams.set('to', to);
  if (weekStartsOn) url.searchParams.set('week_starts_on', weekStartsOn);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const { data, error } = await readJson(res);
  if (!res.ok) throw new Error(`Usage heatmap failed: ${error || `HTTP ${res.status}`}`);

  validateHeatmapContract(data);
  return data;
}

function validateHeatmapContract(data) {
  assert.ok(data && typeof data === 'object');
  assert.ok(typeof data.from === 'string');
  assert.ok(typeof data.to === 'string');
  assert.ok(data.week_starts_on === 'sun' || data.week_starts_on === 'mon');
  assert.ok(data.thresholds && typeof data.thresholds === 'object');
  assert.ok(typeof data.thresholds.t1 === 'string');
  assert.ok(typeof data.thresholds.t2 === 'string');
  assert.ok(typeof data.thresholds.t3 === 'string');
  assert.ok(Number.isInteger(data.active_days) && data.active_days >= 0);
  assert.ok(Number.isInteger(data.streak_days) && data.streak_days >= 0);
  assert.ok(Array.isArray(data.weeks));
  for (const w of data.weeks) {
    assert.ok(Array.isArray(w) && w.length === 7);
    for (const cell of w) {
      if (cell == null) continue;
      assert.ok(typeof cell.day === 'string');
      assert.ok(typeof cell.value === 'string');
      assert.ok(Number.isInteger(cell.level) && cell.level >= 0 && cell.level <= 4);
    }
  }
}

async function usageLeaderboard({ baseUrl, accessToken, period, limit }) {
  const url = new URL('/functions/vibeusage-leaderboard', baseUrl);
  if (period) url.searchParams.set('period', period);
  if (limit != null) url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const { data, error } = await readJson(res);
  if (!res.ok) throw new Error(`Leaderboard failed: ${error || `HTTP ${res.status}`}`);

  return data;
}

function validateLeaderboardContract(data) {
  assert.ok(data && typeof data === 'object');
  assert.ok(data.period === 'day' || data.period === 'week' || data.period === 'month' || data.period === 'total');
  assert.ok(typeof data.from === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(data.from));
  assert.ok(typeof data.to === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(data.to));
  assert.ok(typeof data.generated_at === 'string' && data.generated_at.includes('T'));
  assert.ok(Array.isArray(data.entries));
  assert.ok(data.me && typeof data.me === 'object');
  assert.ok(data.me.rank === null || Number.isInteger(data.me.rank));
  assert.ok(typeof data.me.total_tokens === 'string' && /^[0-9]+$/.test(data.me.total_tokens));

  for (const e of data.entries) {
    assert.ok(e && typeof e === 'object');
    assert.ok(Number.isInteger(e.rank) && e.rank >= 1);
    assert.equal(typeof e.is_me, 'boolean');
    assert.equal(typeof e.display_name, 'string');
    assert.ok(e.avatar_url === null || typeof e.avatar_url === 'string');
    assert.ok(typeof e.total_tokens === 'string' && /^[0-9]+$/.test(e.total_tokens));
  }
}

async function waitForSummaryTotalAtLeast({ baseUrl, accessToken, minTotal }) {
  const startedAt = Date.now();
  let last = null;

  while (Date.now() - startedAt < 15_000) {
    try {
      last = await usageSummary({ baseUrl, accessToken });
    } catch (err) {
      if (String(err).includes('Unauthorized')) {
        await sleep(AUTH_RETRY_DELAY_MS);
        continue;
      }
      throw err;
    }
    const total = parseBigInt(last?.totals?.total_tokens, 'summary.totals.total_tokens');
    if (total >= minTotal) return last;
    await sleep(500);
  }

  const lastTotal = last?.totals?.total_tokens;
  throw new Error(`Usage summary did not reach expected total within timeout (last=${String(lastTotal)})`);
}

function parseBigInt(v, label) {
  if (typeof v !== 'string' || !/^[0-9]+$/.test(v)) {
    throw new Error(`Expected ${label} to be a bigint string, got: ${String(v)}`);
  }
  return BigInt(v);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withAuthRetry(fn, { retries = AUTH_RETRIES, delayMs = AUTH_RETRY_DELAY_MS } = {}) {
  let lastError = null;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!String(err).includes('Unauthorized') || attempt === retries - 1) {
        throw err;
      }
      await sleep(delayMs * (attempt + 1));
    }
  }
  throw lastError;
}

function normalizePositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
}

async function readJson(res) {
  const text = await res.text();
  if (!text) return { data: null, error: null };
  try {
    const parsed = JSON.parse(text);
    return { data: parsed, error: parsed?.error || parsed?.message || null };
  } catch (_e) {
    return { data: null, error: text.slice(0, 300) };
  }
}
