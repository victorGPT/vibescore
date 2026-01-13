const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

function read(rel) {
  return fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
}

test("auth storage exposes session expired helpers", () => {
  const src = read("dashboard/src/lib/auth-storage.js");
  assert.match(src, /SESSION_EXPIRED_KEY/);
  assert.match(src, /loadSessionExpired/);
  assert.match(src, /setSessionExpired/);
  assert.match(src, /clearSessionExpired/);
  assert.match(src, /markSessionExpired/);
  assert.match(src, /subscribeAuthStorage/);
});

test("useAuth tracks sessionExpired and gates signedIn", () => {
  const src = read("dashboard/src/hooks/use-auth.js");
  assert.match(src, /sessionExpired/);
  assert.match(src, /signedIn/);
  assert.match(src, /!sessionExpired/);
});

test("useAuth accepts auth callback on root path", () => {
  const src = read("dashboard/src/hooks/use-auth.js");
  assert.match(src, /path\s*===\s*""/);
  assert.match(src, /\/auth\/callback/);
});

test("App routes LandingPage when signed out", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /!signedIn\s*&&\s*!mockEnabled/);
  assert.doesNotMatch(
    src,
    /!signedIn\s*&&\s*!mockEnabled\s*&&\s*!sessionExpired/
  );
});

test("DashboardPage shows session expired banner and bypasses auth gate", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /sessionExpired/);
  assert.match(src, /dashboard\.session_expired\.title/);
  assert.match(src, /requireAuthGate\s*=\s*!signedIn\s*&&\s*!mockEnabled\s*&&\s*!sessionExpired/);
});

test("vibescore-api marks session expired only for jwt access tokens", () => {
  const src = read("dashboard/src/lib/vibescore-api.js");
  assert.match(src, /markSessionExpired/);
  assert.match(src, /isJwtAccessToken/);
  const match = src.match(/function shouldMarkSessionExpired[\s\S]*?\n}/);
  assert.ok(match, "expected shouldMarkSessionExpired helper");
  assert.match(match[0], /status\s*(?:===|!==)\s*401/);
  assert.match(match[0], /hasAccessTokenValue/);
  assert.match(match[0], /isJwtAccessToken\(/);
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
  const { setSessionExpired } = await import(pathToFileURL(modulePath).href);

  assert.doesNotThrow(() => {
    setSessionExpired();
  });
  assert.equal(setItemCalls, 0);

  if (hadWindow) globalThis.window = originalWindow;
  else delete globalThis.window;
  globalThis.localStorage = originalLocalStorage;
});
