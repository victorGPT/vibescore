#!/usr/bin/env node
'use strict';

const { execSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

function env(name) {
  return process.env[name];
}

function requireEnv(name) {
  const value = env(name);
  if (!value) {
    console.error(`Missing ${name}`);
    process.exit(1);
  }
  return value;
}

const baseUrl = requireEnv('VIBEUSAGE_INSFORGE_BASE_URL');
const serviceKey = requireEnv('VIBEUSAGE_SERVICE_ROLE_KEY');
const sqlPath = resolve(__dirname, 'insforge2-db-validate.sql');
const sql = readFileSync(sqlPath, 'utf8');

function runSql(query) {
  const curl = [
    'curl -sS',
    "-H 'Content-Type: application/json'",
    `-H 'Authorization: Bearer ${serviceKey}'`,
    `--data '${JSON.stringify({ query })}'`,
    `${baseUrl.replace(/\/$/, '')}/api/database/query`
  ].join(' ');
  const raw = execSync(curl, { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
  try {
    return JSON.parse(raw);
  } catch (_e) {
    console.error(raw);
    throw new Error('invalid JSON response');
  }
}

const sections = sql.split(/;\s*\n/).map((chunk) => chunk.trim()).filter(Boolean);
let failed = false;
let index = 0;
for (const query of sections) {
  index += 1;
  const result = runSql(query);
  const rows = Array.isArray(result?.rows) ? result.rows : [];
  if (index === 1) {
    const names = rows.map((row) => row.proname);
    const required = [
      'vibeusage_request_headers',
      'vibeusage_request_header',
      'vibeusage_device_token_hash'
    ];
    const missing = required.filter((name) => !names.includes(name));
    if (missing.length) {
      failed = true;
      console.error(`Missing helper functions: ${missing.join(', ')}`);
    }
  } else {
    if (rows.length) {
      failed = true;
      console.error(`Legacy leak in check #${index}:`);
      console.error(JSON.stringify(rows, null, 2));
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log('insforge2-db-validate: OK');
