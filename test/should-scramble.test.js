const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const modulePath = pathToFileURL(
  path.resolve("dashboard/src/ui/matrix-a/util/should-scramble.js")
).href;

test("shouldScrambleText respects reduced motion and screenshot mode", async () => {
  const { shouldScrambleText } = await import(modulePath);

  assert.equal(
    shouldScrambleText({
      scrambleRespectReducedMotion: true,
      prefersReducedMotion: true,
      screenshotMode: false,
    }),
    false
  );

  assert.equal(
    shouldScrambleText({
      scrambleRespectReducedMotion: true,
      prefersReducedMotion: false,
      screenshotMode: false,
    }),
    true
  );

  assert.equal(
    shouldScrambleText({
      scrambleRespectReducedMotion: false,
      prefersReducedMotion: true,
      screenshotMode: false,
    }),
    true
  );

  assert.equal(
    shouldScrambleText({
      scrambleRespectReducedMotion: false,
      prefersReducedMotion: false,
      screenshotMode: true,
    }),
    false
  );
});
