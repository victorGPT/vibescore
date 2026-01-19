const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

function read(rel) {
  return fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
}

test("auth storage exposes session soft expired helpers", () => {
  const src = read("dashboard/src/lib/auth-storage.js");
  assert.match(src, /SESSION_SOFT_EXPIRED_KEY/);
  assert.match(src, /loadSessionSoftExpired/);
  assert.match(src, /setSessionSoftExpired/);
  assert.match(src, /clearSessionSoftExpired/);
  assert.match(src, /markSessionSoftExpired/);
  assert.match(src, /subscribeAuthStorage/);
  assert.match(src, /subscribeSessionSoftExpired/);
});

test("App does not use legacy auth hook", () => {
  const src = read("dashboard/src/App.jsx");
  assert.doesNotMatch(src, /useLegacyAuth/);
});

test("main wires InsForge hosted auth routes", () => {
  const src = read("dashboard/src/main.jsx");
  assert.match(src, /@insforge\/react-router/);
  assert.match(src, /getInsforgeRoutes/);
  assert.match(src, /getInsforgeBaseUrl/);
  assert.match(src, /afterSignInUrl/);
});

test("insforge auth client wrapper uses base url and anon key", () => {
  const wrapper = read("dashboard/src/lib/insforge-auth-client.js");
  assert.match(wrapper, /createInsforgeAuthClient/);

  const src = read("dashboard/src/lib/insforge-client.js");
  assert.match(src, /createInsforgeAuthClient/);
  assert.match(src, /getInsforgeBaseUrl/);
  assert.match(src, /getInsforgeAnonKey/);
});

test("App uses hosted auth routes for Landing login", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /\"\/sign-in\"/);
  assert.match(src, /\"\/sign-up\"/);
});

test("App passes hosted auth routes to DashboardPage", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /<DashboardPage[\s\S]*signInUrl=/);
  assert.match(src, /<DashboardPage[\s\S]*signUpUrl=/);
});

test("App routes LandingPage when signed out", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(
    src,
    /!publicMode\s*&&\s*!signedIn\s*&&\s*!mockEnabled\s*&&\s*!sessionSoftExpired/
  );
});

test("App uses InsForge auth hook for signed-in gating", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /@insforge\/react-router/);
  assert.match(src, /useInsforgeAuth/);
});

test("App derives signedIn from InsForge session state", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(
    src,
    /const signedIn\s*=\s*useInsforge\s*&&\s*hasInsforgeSession\s*&&\s*hasInsforgeIdentity/
  );
});

test("App keeps auth while session is soft-expired", () => {
  const src = read("dashboard/src/App.jsx");
  assert.doesNotMatch(src, /sessionSoftExpired[^;]*return\s+null/);
});

test("App provides InsForge access token resolver", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /getCurrentSession/);
  assert.match(src, /getAccessToken/);
});

test("App prefers InsForge profile name for identity", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /profile\?\.name/);
  assert.match(src, /user\?\.name/);
});

test("App subscribes to sessionSoftExpired state", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /loadSessionSoftExpired/);
  assert.match(src, /subscribeSessionSoftExpired/);
});

test("App declares getInsforgeAccessToken before revalidate effect", () => {
  const src = read("dashboard/src/App.jsx");
  const tokenIndex = src.indexOf("const getInsforgeAccessToken");
  const authMemoIndex = src.indexOf("const auth = useMemo");
  assert.ok(tokenIndex !== -1, "expected getInsforgeAccessToken declaration");
  assert.ok(authMemoIndex !== -1, "expected auth memo");
  assert.ok(tokenIndex < authMemoIndex);
});

test("App requires InsForge identity before signedIn", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /const hasInsforgeIdentity/);
  assert.match(src, /insforgeSession\?\.user/);
  assert.match(src, /const hasInsforgeSession/);
});

test("App does not use legacy safe redirects", () => {
  const src = read("dashboard/src/App.jsx");
  assert.doesNotMatch(src, /buildAuthUrl/);
  assert.doesNotMatch(src, /getSafeRedirect/);
  assert.doesNotMatch(src, /LOCAL_REDIRECT_HOSTS/);
});

test("App registers visibility revalidate for soft-expired sessions", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /visibilitychange/);
  assert.match(src, /sessionSoftExpired/);
  assert.match(src, /getCurrentSession/);
});

test("vibeusage-api resolves access token providers", () => {
  const src = read("dashboard/src/lib/vibeusage-api.js");
  assert.match(src, /resolveAccessToken/);
  assert.match(src, /typeof\s+accessToken\s*===\s*\"function\"/);
});

test("App avoids legacy auth fallback before InsForge is ready", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /insforgeLoaded\s*&&\s*insforgeSignedIn/);
});

test("DashboardPage shows session expired banner and bypasses auth gate", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /sessionSoftExpired/);
  assert.match(src, /dashboard\.session_expired\.title/);
  assert.match(src, /requireAuthGate\s*=\s*!signedIn\s*&&\s*!mockEnabled\s*&&\s*!sessionSoftExpired/);
});

test("DashboardPage disables auth access token when session expired", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(
    src,
    /const authAccessToken\s*=\s*signedIn\s*\?\s*\(?\s*auth\?\.getAccessToken/
  );
});

test("DashboardPage uses hosted auth routes", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.doesNotMatch(src, /buildAuthUrl/);
  assert.ok(!src.includes("/auth/callback"));
});

test("vibeusage-api marks session soft expired only for jwt access tokens", () => {
  const src = read("dashboard/src/lib/vibeusage-api.js");
  assert.match(src, /markSessionSoftExpired/);
  assert.match(src, /isJwtAccessToken/);
  const markMatch = src.match(
    /function shouldMarkSessionSoftExpired\([\s\S]*?\)\s*\{[\s\S]*?\n\}/
  );
  assert.ok(markMatch, "expected shouldMarkSessionSoftExpired helper");
  assert.match(markMatch[0], /status\s*!==\s*401/);
  assert.match(markMatch[0], /canSetSessionSoftExpired/);
  const guardMatch = src.match(
    /function canSetSessionSoftExpired\([\s\S]*?\)\s*\{[\s\S]*?\n\}/
  );
  assert.ok(guardMatch, "expected canSetSessionSoftExpired helper");
  assert.match(guardMatch[0], /hasAccessTokenValue/);
  assert.match(guardMatch[0], /isJwtAccessToken\(/);
});

test("vibeusage-api clears session soft expired after successful jwt responses", () => {
  const src = read("dashboard/src/lib/vibeusage-api.js");
  assert.match(src, /clearSessionSoftExpired/);
  const match = src.match(
    /function shouldClearSessionSoftExpired\([\s\S]*?\)\s*\{[\s\S]*?\n\}/
  );
  assert.ok(match, "expected shouldClearSessionSoftExpired helper");
  assert.match(match[0], /canSetSessionSoftExpired/);
});

test("vibeusage-api retries after refresh retry errors", () => {
  const src = read("dashboard/src/lib/vibeusage-api.js");
  assert.doesNotMatch(src, /throw\s+normalizeSdkError\(\s*retryErr/);
});

test("vibeusage-api reuses refreshed http client for retries", () => {
  const src = read("dashboard/src/lib/vibeusage-api.js");
  const matches = src.match(/http\s*=\s*retryHttp/g) ?? [];
  assert.strictEqual(matches.length, 2);
});

test("vibeusage-api only marks soft expired after refresh when token missing", () => {
  const src = read("dashboard/src/lib/vibeusage-api.js");
  assert.match(
    src,
    /if\s*\(\s*hasAccessTokenValue\(refreshedToken\)\s*\)[\s\S]*?\}\s*else if\s*\([\s\S]*canSetSessionSoftExpired[\s\S]*\)[\s\S]*markSessionSoftExpired/
  );
});

test("copy registry includes session expired strings", () => {
  const src = read("dashboard/src/content/copy.csv");
  assert.ok(src.includes("dashboard.session_expired.title"));
  assert.ok(src.includes("dashboard.session_expired.subtitle"));
  assert.ok(src.includes("dashboard.session_expired.body"));
  assert.ok(src.includes("dashboard.session_expired.body_tail"));
  assert.ok(src.includes("dashboard.session_expired.copy_label"));
  assert.ok(src.includes("dashboard.session_expired.copied"));
});

test("auth storage skips localStorage when window is undefined", async () => {
  const originalLocalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;
  const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, "window");

  let setItemCalls = 0;
  globalThis.localStorage = {
    getItem() {
      throw new Error("unexpected localStorage access");
    },
    setItem() {
      setItemCalls += 1;
      throw new Error("unexpected localStorage access");
    },
    removeItem() {
      throw new Error("unexpected localStorage access");
    },
  };

  if (hadWindow) delete globalThis.window;

  const modulePath = path.resolve(
    __dirname,
    "../dashboard/src/lib/auth-storage.js"
  );
  const { setSessionSoftExpired } = await import(pathToFileURL(modulePath).href);

  assert.doesNotThrow(() => {
    setSessionSoftExpired();
  });
  assert.equal(setItemCalls, 0);

  if (hadWindow) globalThis.window = originalWindow;
  else delete globalThis.window;
  globalThis.localStorage = originalLocalStorage;
});

test("DashboardPage gates expired UI", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /const showExpiredGate\s*=\s*sessionSoftExpired\s*&&\s*!publicMode/);
  assert.match(src, /showExpiredGate\s*\?\s*\(/);
});

test("DashboardPage disables backend status when signed out or expired", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /const headerStatus\s*=\s*signedIn\s*\?\s*\(\s*<BackendStatus/);
});
