const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const required = [
  path.resolve("docs/screenshots/baselines/2026-01-23/dashboard-desktop.png"),
  path.resolve("docs/screenshots/baselines/2026-01-23/dashboard-mobile.png"),
  path.resolve("docs/screenshots/baselines/2026-01-23/landing-desktop.png"),
  path.resolve("docs/screenshots/baselines/2026-01-23/share-desktop.png"),
];

test("visual baselines exist", () => {
  for (const file of required) {
    assert.ok(fs.existsSync(file), `missing baseline: ${file}`);
  }
});
