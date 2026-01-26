const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const modulePath = pathToFileURL(
  path.resolve("dashboard/src/ui/matrix-a/util/should-run-live-sniffer.js")
).href;

test("shouldRunLiveSniffer disables animation in reduced motion or screenshot", async () => {
  const { shouldRunLiveSniffer } = await import(modulePath);

  assert.equal(
    shouldRunLiveSniffer({
      prefersReducedMotion: true,
      screenshotMode: false,
    }),
    false
  );

  assert.equal(
    shouldRunLiveSniffer({
      prefersReducedMotion: false,
      screenshotMode: true,
    }),
    false
  );

  assert.equal(
    shouldRunLiveSniffer({
      prefersReducedMotion: false,
      screenshotMode: false,
    }),
    true
  );
});
