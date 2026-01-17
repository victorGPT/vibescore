#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { createClient } = require('@insforge/sdk');

async function main() {
  const baseUrl =
    process.env.VIBEUSAGE_INSFORGE_BASE_URL ||
    process.env.VIBESCORE_INSFORGE_BASE_URL ||
    process.env.INSFORGE_BASE_URL ||
    'https://5tmappuk.us-east.insforge.app';

  const anonKey = process.env.INSFORGE_ANON_KEY || '';
  const serviceRoleKey =
    process.env.INSFORGE_SERVICE_ROLE_KEY ||
    process.env.INSFORGE_API_KEY ||
    '';

  if (!anonKey && !serviceRoleKey) {
    throw new Error('Missing INSFORGE_ANON_KEY or INSFORGE_SERVICE_ROLE_KEY / INSFORGE_API_KEY');
  }

  const edgeFunctionToken =
    serviceRoleKey && serviceRoleKey.split('.').length === 3 ? serviceRoleKey : undefined;

  const client = createClient({
    baseUrl,
    anonKey: anonKey || serviceRoleKey,
    edgeFunctionToken
  });

  const { data, error } = await client.database
    .from('vibeusage_model_aliases')
    .select('usage_model')
    .limit(1);

  if (error) {
    throw new Error(
      `vibeusage_model_aliases missing or inaccessible: ${error.message || error}`
    );
  }

  assert.ok(Array.isArray(data));

  process.stdout.write(
    JSON.stringify({ ok: true, table: 'vibeusage_model_aliases' }, null, 2) + '\n'
  );
}

main().catch((err) => {
  process.stderr.write(`${err?.stack || err}\n`);
  process.exit(1);
});
