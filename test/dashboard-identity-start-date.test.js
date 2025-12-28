const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pagePath = path.join(
  __dirname,
  '..',
  'dashboard',
  'src',
  'pages',
  'DashboardPage.jsx'
);

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('DashboardPage maps earliest usage day to identity start date label', () => {
  const src = readFile(pagePath);
  assert.ok(src.includes('identityStartDate'), 'expected identity start date helper');
  assert.ok(src.includes('heatmapDaily'), 'expected heatmap daily usage scan');
  assert.ok(src.includes('heatmap?.weeks'), 'expected heatmap weeks scan');
});

test('IdentityCard renders rank value in yellow', () => {
  const componentPath = path.join(
    __dirname,
    '..',
    'dashboard',
    'src',
    'ui',
    'matrix-a',
    'components',
    'IdentityCard.jsx'
  );
  const src = readFile(componentPath);
  const match = src.match(
    /identity_card\.rank_label[\s\S]*?<div className="([^"]*)">\s*\{rankValue\}/
  );
  assert.ok(match, 'expected rank value class');
  assert.ok(
    match[1].includes('text-yellow-400'),
    'expected rank value to use yellow color'
  );
});
