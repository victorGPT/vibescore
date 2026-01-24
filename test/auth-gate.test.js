const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadDashboardModule } = require("./helpers/load-dashboard-module");

async function loadAuthGate() {
  return loadDashboardModule("dashboard/src/lib/auth-gate.js");
}

test("auth gate returns loading while auth is pending", async () => {
  const { resolveAuthGate } = await loadAuthGate();
  const result = resolveAuthGate({
    publicMode: false,
    mockEnabled: false,
    sessionSoftExpired: false,
    signedIn: false,
    authPending: true,
  });
  assert.equal(result, "loading");
});

test("auth gate returns landing when signed out and not pending", async () => {
  const { resolveAuthGate } = await loadAuthGate();
  const result = resolveAuthGate({
    publicMode: false,
    mockEnabled: false,
    sessionSoftExpired: false,
    signedIn: false,
    authPending: false,
  });
  assert.equal(result, "landing");
});

test("auth gate returns dashboard when signed in", async () => {
  const { resolveAuthGate } = await loadAuthGate();
  const result = resolveAuthGate({
    publicMode: false,
    mockEnabled: false,
    sessionSoftExpired: false,
    signedIn: true,
    authPending: false,
  });
  assert.equal(result, "dashboard");
});
