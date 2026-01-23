const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadDashboardModule } = require("./helpers/load-dashboard-module");

test("sortDetailRows sorts day/hour/month keys by time", async () => {
  const mod = await loadDashboardModule("dashboard/src/lib/detail-sort.ts");
  const sortDetailRows = mod.sortDetailRows;

  const dayRows = [
    { day: "2025-12-22", total_tokens: 10 },
    { day: "2025-12-23", total_tokens: 5 },
  ];
  const dayDesc = sortDetailRows(dayRows, { key: "day", dir: "desc" });
  assert.equal(dayDesc[0].day, "2025-12-23");
  const dayAsc = sortDetailRows(dayRows, { key: "day", dir: "asc" });
  assert.equal(dayAsc[0].day, "2025-12-22");

  const hourRows = [
    { hour: "2025-12-23T00:00:00Z", total_tokens: 1 },
    { hour: "2025-12-23T12:30:00Z", total_tokens: 2 },
  ];
  const hourDesc = sortDetailRows(hourRows, { key: "hour", dir: "desc" });
  assert.equal(hourDesc[0].hour, "2025-12-23T12:30:00Z");

  const monthRows = [
    { month: "2025-11", total_tokens: 1 },
    { month: "2025-12", total_tokens: 2 },
  ];
  const monthDesc = sortDetailRows(monthRows, { key: "month", dir: "desc" });
  assert.equal(monthDesc[0].month, "2025-12");
});
