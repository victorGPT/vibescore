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
const copyPath = path.join(__dirname, '..', 'dashboard', 'src', 'content', 'copy.csv');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readCopyValue(csv, key) {
  const line = csv
    .split(/\r?\n/)
    .find((row) => row.startsWith(`${key},`));
  assert.ok(line, `missing copy key: ${key}`);
  const match = line.match(/^[^,]+,(?:[^,]*,){4}"([^"]*)"/);
  assert.ok(match, `missing copy value for key: ${key}`);
  return match[1];
}

test('DashboardPage maps earliest usage day to identity start date label', () => {
  const src = readFile(pagePath);
  assert.ok(src.includes('identityStartDate'), 'expected identity start date helper');
  assert.ok(src.includes('heatmapDaily'), 'expected heatmap daily usage scan');
  assert.ok(src.includes('heatmap?.weeks'), 'expected heatmap weeks scan');
});

test('DashboardPage uses active days for identity stats', () => {
  const src = readFile(pagePath);
  assert.ok(src.includes('active_days'), 'expected active days usage');
});

test('IdentityCard renders rank value in gold', () => {
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
    match[1].includes('text-gold'),
    'expected rank value to use gold color'
  );
});

test('Dashboard identity wiring includes subscription badges', () => {
  const pageSrc = readFile(pagePath);
  assert.ok(pageSrc.includes('identitySubscriptions'), 'expected identity subscriptions state');

  const viewPath = path.join(
    __dirname,
    '..',
    'dashboard',
    'src',
    'ui',
    'matrix-a',
    'views',
    'DashboardView.jsx'
  );
  const viewSrc = readFile(viewPath);
  assert.ok(
    viewSrc.includes('subscriptions={identitySubscriptions}'),
    'expected DashboardView to pass subscriptions into IdentityCard'
  );

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
  const componentSrc = readFile(componentPath);
  assert.ok(
    componentSrc.includes('identity_card.subscriptions_label'),
    'expected IdentityCard subscription section label'
  );
  assert.ok(
    componentSrc.includes('identity_card.subscription_item'),
    'expected IdentityCard subscription badge copy template'
  );
});

test('copy registry labels active days and start without underscores', () => {
  const csv = readFile(copyPath);
  assert.equal(readCopyValue(csv, 'identity_card.rank_label'), 'START');
  assert.equal(readCopyValue(csv, 'identity_card.streak_label'), 'ACTIVE');
  assert.equal(readCopyValue(csv, 'identity_card.streak_value'), '{{days}} DAY');
  assert.equal(readCopyValue(csv, 'identity_panel.rank_label'), 'START');
  assert.equal(readCopyValue(csv, 'identity_panel.streak_label'), 'ACTIVE');
  assert.equal(readCopyValue(csv, 'identity_panel.streak_value'), '{{days}} DAY');
  assert.equal(readCopyValue(csv, 'identity_card.subscriptions_label'), 'SUBSCRIPTIONS');
  assert.equal(readCopyValue(csv, 'identity_card.subscription_item'), '{{tool}} {{plan}}');
});
