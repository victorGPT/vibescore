const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadDashboardModule } = require("./helpers/load-dashboard-module");

async function loadRedirectModule() {
  return loadDashboardModule("dashboard/src/lib/auth-redirect.ts");
}

function createStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

test("redirect parsing and loopback validation accepts http loopback", async () => {
  const { parseRedirectParam, validateLoopbackHttpRedirect } =
    await loadRedirectModule();
  const redirect = parseRedirectParam("?redirect=http://127.0.0.1:1234/callback");
  assert.equal(redirect, "http://127.0.0.1:1234/callback");
  assert.equal(
    validateLoopbackHttpRedirect(redirect),
    "http://127.0.0.1:1234/callback"
  );
});

test("redirect validation rejects https and non-loopback hosts", async () => {
  const { validateLoopbackHttpRedirect } = await loadRedirectModule();
  assert.equal(
    validateLoopbackHttpRedirect("https://localhost:3000/callback"),
    null
  );
  assert.equal(
    validateLoopbackHttpRedirect("http://example.com/callback"),
    null
  );
});

test("buildRedirectUrl preserves existing query params", async () => {
  const { buildRedirectUrl } = await loadRedirectModule();
  const url = buildRedirectUrl("http://127.0.0.1:4000/callback?foo=bar", {
    accessToken: "token",
    userId: "user-1",
    email: "user@example.com",
    name: "User",
  });
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get("foo"), "bar");
  assert.equal(parsed.searchParams.get("access_token"), "token");
  assert.equal(parsed.searchParams.get("user_id"), "user-1");
  assert.equal(parsed.searchParams.get("email"), "user@example.com");
  assert.equal(parsed.searchParams.get("name"), "User");
});

test("stored redirect is consumed once", async () => {
  const { saveRedirectToStorage, consumeRedirectFromStorage } =
    await loadRedirectModule();
  const storage = createStorage();
  const target = "http://127.0.0.1:4321/callback";
  saveRedirectToStorage(target, storage);
  assert.equal(consumeRedirectFromStorage(storage), target);
  assert.equal(consumeRedirectFromStorage(storage), null);
});

test("storeRedirectFromSearch reports when redirect is not saved", async () => {
  const { storeRedirectFromSearch } = await loadRedirectModule();
  const storage = { getItem: () => null };
  const result = storeRedirectFromSearch(
    "?redirect=http://127.0.0.1:5555/callback",
    storage
  );
  assert.equal(result.raw, "http://127.0.0.1:5555/callback");
  assert.equal(result.valid, "http://127.0.0.1:5555/callback");
  assert.equal(result.saved, false);
});

test("storeRedirectFromSearch clears stale storage when save fails", async () => {
  const { storeRedirectFromSearch, consumeRedirectFromStorage } =
    await loadRedirectModule();
  const store = new Map([["vibeusage.dashboard.redirect.v1", "http://127.0.0.1:1/old"]]);
  const storage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: () => {
      throw new Error("quota exceeded");
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
  storeRedirectFromSearch("?redirect=http://127.0.0.1:5555/callback", storage);
  assert.equal(consumeRedirectFromStorage(storage), null);
});

test("resolveRedirectTarget uses memory fallback when storage fails and query is gone", async () => {
  const { storeRedirectFromSearch, resolveRedirectTarget } =
    await loadRedirectModule();
  const storage = {
    getItem: () => null,
    setItem: () => {
      throw new Error("quota exceeded");
    },
    removeItem: () => {},
  };
  storeRedirectFromSearch("?redirect=http://127.0.0.1:4242/callback", storage);
  assert.equal(resolveRedirectTarget("", storage), "http://127.0.0.1:4242/callback");
  assert.equal(resolveRedirectTarget("", storage), null);
});

test("saveRedirectToStorage returns false when storage setItem throws", async () => {
  const { saveRedirectToStorage } = await loadRedirectModule();
  const storage = {
    setItem: () => {
      throw new Error("quota exceeded");
    },
  };
  const saved = saveRedirectToStorage(
    "http://127.0.0.1:5678/callback",
    storage
  );
  assert.equal(saved, false);
});

test("storeRedirectFromSearch saves loopback redirect when storage is available", async () => {
  const { storeRedirectFromSearch, consumeRedirectFromStorage } =
    await loadRedirectModule();
  const storage = createStorage();
  const result = storeRedirectFromSearch(
    "?redirect=http://127.0.0.1:7777/callback",
    storage
  );
  assert.equal(result.saved, true);
  assert.equal(consumeRedirectFromStorage(storage), result.valid);
});

test("resolveRedirectTarget prefers query redirect over stored value", async () => {
  const { resolveRedirectTarget, saveRedirectToStorage } =
    await loadRedirectModule();
  const storage = createStorage();
  const stored = "http://127.0.0.1:9090/callback";
  saveRedirectToStorage(stored, storage);
  const result = resolveRedirectTarget(
    "?redirect=http://127.0.0.1:9999/callback",
    storage
  );
  assert.equal(result, "http://127.0.0.1:9999/callback");
});

test("resolveRedirectTarget ignores stored redirect when invalid", async () => {
  const { resolveRedirectTarget } = await loadRedirectModule();
  const storage = createStorage();
  storage.setItem("vibeusage.dashboard.redirect.v1", "http://example.com/bad");
  const result = resolveRedirectTarget(
    "?redirect=http://127.0.0.1:7777/callback",
    storage
  );
  assert.equal(result, "http://127.0.0.1:7777/callback");
});

test("resolveRedirectTarget uses stored redirect when query missing", async () => {
  const { resolveRedirectTarget, saveRedirectToStorage } =
    await loadRedirectModule();
  const storage = createStorage();
  const stored = "http://127.0.0.1:6060/callback";
  saveRedirectToStorage(stored, storage);
  const result = resolveRedirectTarget("", storage);
  assert.equal(result, stored);
});

test("resolveRedirectTarget falls back to valid query redirect", async () => {
  const { resolveRedirectTarget } = await loadRedirectModule();
  const storage = createStorage();
  const result = resolveRedirectTarget(
    "?redirect=http://127.0.0.1:8888/callback",
    storage
  );
  assert.equal(result, "http://127.0.0.1:8888/callback");
});

test("validateNextPath accepts internal paths and rejects external redirects", async () => {
  const { validateNextPath } = await loadRedirectModule();
  assert.equal(validateNextPath("/share/demo"), "/share/demo");
  assert.equal(
    validateNextPath("/share/demo?period=week#top"),
    "/share/demo?period=week#top"
  );
  assert.equal(validateNextPath("share/demo"), null);
  assert.equal(validateNextPath("//evil.com"), null);
  assert.equal(validateNextPath("https://evil.com"), null);
});

test("post-auth next path is saved and consumed once", async () => {
  const { storePostAuthPathFromSearch, consumePostAuthPath } =
    await loadRedirectModule();
  const storage = createStorage();
  const result = storePostAuthPathFromSearch(
    "?next=%2Fshare%2Fdemo%3Fperiod%3Dweek%23top",
    storage
  );
  assert.equal(result.valid, "/share/demo?period=week#top");
  assert.equal(result.saved, true);
  assert.equal(consumePostAuthPath(storage), "/share/demo?period=week#top");
  assert.equal(consumePostAuthPath(storage), null);
});

test("post-auth next path ignores external URLs", async () => {
  const { storePostAuthPathFromSearch, consumePostAuthPath } =
    await loadRedirectModule();
  const storage = createStorage();
  const result = storePostAuthPathFromSearch("?next=https://evil.com", storage);
  assert.equal(result.valid, null);
  assert.equal(result.saved, false);
  assert.equal(consumePostAuthPath(storage), null);
});

test("stripNextParam removes next while preserving other query params", async () => {
  const { stripNextParam } = await loadRedirectModule();
  const nextUrl = stripNextParam(
    "http://127.0.0.1:7777/sign-in?next=%2Fshare%2Fdemo&foo=bar"
  );
  assert.ok(nextUrl);
  const parsed = new URL(nextUrl);
  assert.equal(parsed.searchParams.get("next"), null);
  assert.equal(parsed.searchParams.get("foo"), "bar");
});
