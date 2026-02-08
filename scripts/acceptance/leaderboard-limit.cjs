#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');

class QueryStub {
  constructor(parent, table) {
    this.parent = parent;
    this.table = table;
  }

  select() {
    return this;
  }

  order() {
    return this;
  }

  range(from, to) {
    this.parent.ranges.set(this.table, { from, to });
    const rows = this.parent.entries.slice(from, to + 1);
    return { data: rows, error: null };
  }

  maybeSingle() {
    return { data: { rank: 2, gpt_tokens: '40', claude_tokens: '59', total_tokens: '99' }, error: null };
  }
}

class DatabaseStub {
  constructor(entries) {
    this.entries = entries;
    this.ranges = new Map();
  }

  from(table) {
    return new QueryStub(this, table);
  }
}

async function main() {
  process.env.INSFORGE_INTERNAL_URL = 'http://insforge:7130';
  process.env.INSFORGE_ANON_KEY = 'anon';
  process.env.INSFORGE_SERVICE_ROLE_KEY = '';

  global.Deno = {
    env: {
      get(key) {
        const v = process.env[key];
        return v == null || v === '' ? null : v;
      }
    }
  };

  const entries = [
    { rank: 1, is_me: true, display_name: 'Alpha', avatar_url: null, gpt_tokens: '6', claude_tokens: '4', total_tokens: '10' },
    { rank: 2, is_me: false, display_name: 'Beta', avatar_url: null, gpt_tokens: '5', claude_tokens: '4', total_tokens: '9' }
  ];

  const db = new DatabaseStub(entries);

  global.createClient = () => ({
    auth: {
      async getCurrentUser() {
        return { data: { user: { id: 'user-id' } }, error: null };
      }
    },
    database: db
  });

  const leaderboard = require('../../insforge-src/functions/vibeusage-leaderboard.js');
  const res = await leaderboard(
    new Request('http://local/functions/vibeusage-leaderboard?period=week&metric=gpt&limit=1&offset=0', {
      method: 'GET',
      headers: { Authorization: 'Bearer user-jwt' }
    })
  );

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.metric, 'gpt');
  assert.equal(body.entries.length, 1);

  const entriesView = 'vibeusage_leaderboard_gpt_week_current';
  assert.deepEqual(db.ranges.get(entriesView), { from: 0, to: 0 });

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        range: db.ranges.get(entriesView),
        entries: body.entries
      },
      null,
      2
    ) + '\n'
  );
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
