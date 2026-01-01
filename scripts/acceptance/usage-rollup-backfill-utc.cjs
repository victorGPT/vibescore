#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sqlPath = path.join(__dirname, '../ops/usage-daily-rollup-backfill.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const hasUtcStart = /hour_start\s*>=\s*\([\s\S]*?at time zone\s+'utc'/i.test(sql);
const hasUtcEnd = /hour_start\s*<\s*\([\s\S]*?at time zone\s+'utc'/i.test(sql);

assert.ok(hasUtcStart, 'backfill start boundary must be UTC-based');
assert.ok(hasUtcEnd, 'backfill end boundary must be UTC-based');

process.stdout.write(JSON.stringify({ ok: true }) + '\n');
