'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');

const guardedFunctions = [
  'vibeusage-usage-summary.js',
  'vibeusage-usage-daily.js',
  'vibeusage-usage-hourly.js',
  'vibeusage-usage-monthly.js',
  'vibeusage-usage-heatmap.js',
  'vibeusage-usage-model-breakdown.js',
  'vibeusage-project-usage-summary.js',
];

test('usage endpoints enforce concurrency guard', () => {
  for (const file of guardedFunctions) {
    const filePath = path.join(rootDir, 'insforge-src', 'functions', file);
    const content = fs.readFileSync(filePath, 'utf8');
    assert.match(content, /usageGuard\?\.acquire/);
    assert.match(content, /Too many requests/);
    assert.match(content, /guard\?\.release/);
  }
});
