const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadDashboardModule } = require("./helpers/load-dashboard-module");

async function loadAppVersion() {
  return loadDashboardModule("dashboard/src/lib/app-version.js");
}

test("app version prefers VITE_APP_VERSION when set", async () => {
  const { getAppVersion } = await loadAppVersion();
  const version = getAppVersion({ VITE_APP_VERSION: "1.2.3", MODE: "dev" });
  assert.equal(version, "1.2.3");
});

test("app version falls back to MODE when version is missing", async () => {
  const { getAppVersion } = await loadAppVersion();
  const version = getAppVersion({ MODE: "dev" });
  assert.equal(version, "dev");
});

test("app version returns unknown when inputs are empty", async () => {
  const { getAppVersion } = await loadAppVersion();
  const version = getAppVersion({ VITE_APP_VERSION: "  ", MODE: "  " });
  assert.equal(version, "unknown");
});
