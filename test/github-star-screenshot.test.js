const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("GithubStar skips fetch in screenshot mode", () => {
  const src = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "dashboard",
      "src",
      "ui",
      "matrix-a",
      "components",
      "GithubStar.jsx"
    ),
    "utf8"
  );

  assert.match(src, /URLSearchParams/);
  assert.match(src, /screenshot/);
  assert.ok(src.includes("if (isScreenshotMode()) return;"));
});
