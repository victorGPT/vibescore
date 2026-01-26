const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadDashboardModule } = require("./helpers/load-dashboard-module");

test("paginateRows slices detail rows by page size", async () => {
  const mod = await loadDashboardModule("dashboard/src/lib/details.ts");
  const { paginateRows } = mod;

  const rows = Array.from({ length: 25 }, (_v, i) => ({ id: i }));

  const page0 = paginateRows(rows, 0, 12);
  assert.equal(page0.length, 12);
  assert.equal(page0[0].id, 0);
  assert.equal(page0[11].id, 11);

  const page1 = paginateRows(rows, 1, 12);
  assert.equal(page1.length, 12);
  assert.equal(page1[0].id, 12);
  assert.equal(page1[11].id, 23);

  const page2 = paginateRows(rows, 2, 12);
  assert.equal(page2.length, 1);
  assert.equal(page2[0].id, 24);
});
