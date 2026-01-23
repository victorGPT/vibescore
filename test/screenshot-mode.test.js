const test = require("node:test");
const assert = require("node:assert/strict");

async function loadModule() {
  return import("../dashboard/src/lib/screenshot-mode.js");
}

test("screenshot mode detection", async () => {
  const { isScreenshotModeEnabled } = await loadModule();
  assert.equal(isScreenshotModeEnabled(""), false);
  assert.equal(isScreenshotModeEnabled("?screenshot=1"), true);
  assert.equal(isScreenshotModeEnabled("?screenshot=true"), true);
  assert.equal(isScreenshotModeEnabled("?screenshot=TRUE"), true);
  assert.equal(isScreenshotModeEnabled("?screenshot=0"), false);
  assert.equal(isScreenshotModeEnabled("?foo=bar&screenshot=1"), true);
});
