const assert = require('node:assert/strict');
const { test } = require('node:test');

const { shapeRetroOutput } = require('../scripts/ops/pr-retro.cjs');

test('summarizes non-picked prs while keeping picked full', () => {
  const prs = [
    {
      number: 1,
      title: 'PR one',
      url: 'https://example.com/1',
      closedAt: '2026-02-01T00:00:00Z',
      mergedAt: '2026-02-01T00:00:00Z',
      author: 'dev1',
      labels: ['alpha'],
      frontend: true,
      backend: false,
      cycles: 3,
      reviews: [{ author: 'reviewer', state: 'COMMENTED' }],
      comments: [{ author: 'commenter' }],
      commits: [{ oid: 'a' }],
      files: ['a.js', 'b.js']
    },
    {
      number: 2,
      title: 'PR two',
      url: 'https://example.com/2',
      closedAt: '2026-02-02T00:00:00Z',
      mergedAt: '2026-02-02T00:00:00Z',
      author: 'dev2',
      labels: ['beta'],
      frontend: false,
      backend: true,
      cycles: 2,
      reviews: [{ author: 'reviewer2', state: 'APPROVED' }],
      comments: [{ author: 'commenter2' }],
      commits: [{ oid: 'b' }, { oid: 'c' }],
      files: ['c.js']
    }
  ];

  const result = shapeRetroOutput(prs, [1]);

  assert.equal(result.picked.length, 1);
  assert.equal(result.picked[0].number, 1);
  assert.equal(result.picked[0].reviews.length, 1);

  const summaryOne = result.prs.find((pr) => pr.number === 1);
  const summaryTwo = result.prs.find((pr) => pr.number === 2);

  assert.ok(summaryOne);
  assert.ok(summaryTwo);

  assert.equal(summaryOne.reviewCount, 1);
  assert.equal(summaryOne.commentCount, 1);
  assert.equal(summaryOne.commitCount, 1);
  assert.equal(summaryOne.fileCount, 2);

  assert.equal(summaryTwo.reviewCount, 1);
  assert.equal(summaryTwo.commentCount, 1);
  assert.equal(summaryTwo.commitCount, 2);
  assert.equal(summaryTwo.fileCount, 1);

  assert.equal(Object.hasOwn(summaryOne, 'reviews'), false);
  assert.equal(Object.hasOwn(summaryOne, 'comments'), false);
  assert.equal(Object.hasOwn(summaryOne, 'commits'), false);
  assert.equal(Object.hasOwn(summaryOne, 'files'), false);
});
