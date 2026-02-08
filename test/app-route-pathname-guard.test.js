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

test("App.jsx does not route to removed leaderboard page", () => {
  const appPath = path.join(repoRoot, "dashboard/src/App.jsx");
  const source = fs.readFileSync(appPath, "utf8");
  assert.equal(
    source.includes('"/rankings"'),
    false,
    "Removed /rankings route should not exist"
  );
  assert.equal(
    source.includes('"/leaderboard"'),
    false,
    "Removed /leaderboard route should not exist"
  );
  assert.equal(
    source.includes("LeaderboardPage"),
    false,
    "Removed LeaderboardPage should not be referenced"
  );
});
