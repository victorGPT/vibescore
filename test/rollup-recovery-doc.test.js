const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

test('rollup recovery doc references rollup scripts that query rollup table', () => {
  const repoRoot = path.join(__dirname, '..');
  const docPath = path.join(repoRoot, 'docs', 'ops', 'usage-rollup-recovery.md');
  const doc = fs.readFileSync(docPath, 'utf8');

  const scriptRefs = Array.from(doc.matchAll(/scripts\/acceptance\/([\w-]+\.cjs)/g))
    .map((match) => match[1]);

  for (const script of scriptRefs) {
    if (!script.includes('rollup')) continue;
    const scriptPath = path.join(repoRoot, 'scripts', 'acceptance', script);
    const content = fs.readFileSync(scriptPath, 'utf8');
    assert.ok(
      content.includes('vibescore_tracker_daily_rollup'),
      `Expected ${script} to reference vibescore_tracker_daily_rollup`
    );
  }
});

test('rollup recovery doc includes hourly daily acceptance script', () => {
  const repoRoot = path.join(__dirname, '..');
  const docPath = path.join(repoRoot, 'docs', 'ops', 'usage-rollup-recovery.md');
  const doc = fs.readFileSync(docPath, 'utf8');
  const scriptName = 'usage-daily-hourly.cjs';

  assert.ok(
    doc.includes(`scripts/acceptance/${scriptName}`),
    `Expected recovery doc to reference ${scriptName}`
  );

  const scriptPath = path.join(repoRoot, 'scripts', 'acceptance', scriptName);
  assert.ok(fs.existsSync(scriptPath), `Expected ${scriptName} to exist`);
});
