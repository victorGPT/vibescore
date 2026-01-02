#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sqlPath = path.join(
  __dirname,
  '..',
  '..',
  'openspec',
  'changes',
  '2026-01-02-optimize-usage-summary-db-aggregation',
  'sql',
  '001_usage_summary_agg.sql'
);

const sql = fs.readFileSync(sqlPath, 'utf8');
const grantMatch = sql.match(/grant\s+execute\s+on\s+function\s+public\.vibescore_usage_summary_agg[\s\S]*?;/i);
assert.ok(grantMatch, 'expected grant execute on vibescore_usage_summary_agg');
const grant = grantMatch[0].toLowerCase();
assert.ok(grant.includes('anon'), 'expected grant to anon');
assert.ok(grant.includes('authenticated'), 'expected grant to authenticated');

process.stdout.write(JSON.stringify({ ok: true, file: sqlPath }) + '\n');
