const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadDashboardModule } = require("./helpers/load-dashboard-module");

test("mock leaderboard returns entries and me", async () => {
  const { getMockLeaderboard } = await loadDashboardModule(
    "dashboard/src/lib/mock-data.ts"
  );
  const res = getMockLeaderboard({ seed: "demo", period: "total", limit: 5 });
  assert.equal(res.period, "total");
  assert.equal(Array.isArray(res.entries), true);
  assert.ok(res.entries.length <= 5);
  assert.ok(res.me);
  assert.equal(typeof res.me.rank, "number");
});
