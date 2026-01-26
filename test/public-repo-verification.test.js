const assert = require('node:assert/strict');
const { test } = require('node:test');
const { hashRepoRoot, parseGitHubRepoId } = require('../src/lib/vibeusage-public-repo');

test('parseGitHubRepoId extracts owner/repo from canonical ref', () => {
  const res = parseGitHubRepoId('https://github.com/Acme/Alpha');
  assert.deepEqual(res, { owner: 'acme', repo: 'alpha', repoId: 'acme/alpha' });
});

test('hashRepoRoot returns stable hex hash', () => {
  const a = hashRepoRoot('/tmp/repo');
  const b = hashRepoRoot('/tmp/repo');
  assert.equal(a, b);
  assert.equal(a.length, 64);
});
