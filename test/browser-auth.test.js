const assert = require("node:assert/strict");
const { test } = require("node:test");

const { beginBrowserAuth } = require("../src/lib/browser-auth");

test("browser auth callback redirects to dashboard when available", async () => {
  const dashboardUrl = "http://127.0.0.1:9999";
  const { authUrl, waitForCallback } = await beginBrowserAuth({
    baseUrl: "https://example.invalid",
    dashboardUrl,
    timeoutMs: 2000,
    open: false,
  });

  const auth = new URL(authUrl);
  const redirectParam = auth.searchParams.get("redirect");
  assert.ok(redirectParam, "expected redirect param on authUrl");

  const callbackUrl = new URL(redirectParam);
  callbackUrl.searchParams.set("access_token", "test-token");
  callbackUrl.searchParams.set("user_id", "user-1");

  const res = await fetch(callbackUrl.toString(), { redirect: "manual" });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), `${dashboardUrl}/`);

  const callback = await waitForCallback();
  assert.equal(callback.accessToken, "test-token");
  assert.equal(callback.userId, "user-1");
});

test("browser auth uses dashboard url as login entry when configured", async () => {
  const baseUrl = "https://example.invalid";
  const dashboardUrl = "http://127.0.0.1:9999";
  const { authUrl, waitForCallback } = await beginBrowserAuth({
    baseUrl,
    dashboardUrl,
    timeoutMs: 2000,
    open: false,
  });

  const auth = new URL(authUrl);
  const redirectParam = auth.searchParams.get("redirect");
  assert.ok(redirectParam, "expected redirect param on authUrl");

  try {
    assert.equal(auth.searchParams.get("base_url"), baseUrl);
    assert.equal(auth.origin, dashboardUrl);
    assert.equal(auth.pathname, "/");
  } finally {
    const callbackUrl = new URL(redirectParam);
    callbackUrl.searchParams.set("access_token", "test-token");
    callbackUrl.searchParams.set("user_id", "user-1");
    await fetch(callbackUrl.toString(), { redirect: "manual" });
    await waitForCallback();
  }
});

test("browser auth callback stays on success page when dashboard is missing", async () => {
  const { authUrl, waitForCallback } = await beginBrowserAuth({
    baseUrl: "https://example.invalid",
    timeoutMs: 2000,
    open: false,
  });

  const auth = new URL(authUrl);
  assert.equal(auth.pathname, "/auth/sign-up");
  const redirectParam = auth.searchParams.get("redirect");
  assert.ok(redirectParam, "expected redirect param on authUrl");

  const callbackUrl = new URL(redirectParam);
  callbackUrl.searchParams.set("access_token", "test-token");
  callbackUrl.searchParams.set("user_id", "user-2");

  const res = await fetch(callbackUrl.toString(), { redirect: "manual" });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("location"), null);

  const callback = await waitForCallback();
  assert.equal(callback.accessToken, "test-token");
  assert.equal(callback.userId, "user-2");
});
