const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { transform } = require("esbuild");

const repoRoot = path.join(__dirname, "..");

async function parseDashboardFile(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  await transform(source, {
    loader: "jsx",
    sourcefile: relativePath,
  });
}

test("App.jsx parses without duplicate identifier errors", async () => {
  await assert.doesNotReject(parseDashboardFile("dashboard/src/App.jsx"));
});

test("LeaderboardPage.jsx parses as JSX (no TS annotations)", async () => {
  await assert.doesNotReject(
    parseDashboardFile("dashboard/src/pages/LeaderboardPage.jsx")
  );
});

test("App.jsx routes rankings without using /leaderboard", () => {
  const appPath = path.join(repoRoot, "dashboard/src/App.jsx");
  const source = fs.readFileSync(appPath, "utf8");
  assert.ok(source.includes('"/rankings"'), "Expected /rankings route");
  assert.equal(
    source.includes('"/leaderboard"'),
    false,
    "Legacy /leaderboard route should be removed"
  );
});
