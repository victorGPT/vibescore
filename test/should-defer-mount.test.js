const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const modulePath = pathToFileURL(
  path.resolve("dashboard/src/pages/should-defer-mount.js")
).href;

test("shouldDeferMount disables deferral in reduced motion or screenshot mode", async () => {
  const { shouldDeferMount } = await import(modulePath);

  assert.equal(
    shouldDeferMount({
      prefersReducedMotion: true,
      screenshotMode: false,
    }),
    false
  );

  assert.equal(
    shouldDeferMount({
      prefersReducedMotion: false,
      screenshotMode: true,
    }),
    false
  );

  assert.equal(
    shouldDeferMount({
      prefersReducedMotion: false,
      screenshotMode: false,
    }),
    true
  );
});
