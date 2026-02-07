import { beforeEach, describe, expect, it } from "vitest";

import {
  AUTH_CALLBACK_RETRY_KEY,
  getSafeSessionStorage,
  resetAuthCallbackRetryState,
  shouldRedirectFromAuthCallback,
} from "../auth-callback";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
  };
}

function createThrowingStorage(): Storage {
  const fail = () => {
    throw new Error("storage blocked");
  };

  return {
    get length() {
      return fail();
    },
    clear() {
      fail();
    },
    key(_index: number) {
      return fail();
    },
    getItem(_key: string) {
      return fail();
    },
    setItem(_key: string, _value: string) {
      fail();
    },
    removeItem(_key: string) {
      fail();
    },
  };
}

describe("shouldRedirectFromAuthCallback", () => {
  beforeEach(() => {
    resetAuthCallbackRetryState();
    // Prevent cross-test leakage from the window.name fallback marker.
    window.name = "";
  });

  it("redirects once on naked /auth/callback without a session", () => {
    const storage = createMemoryStorage();
    const first = shouldRedirectFromAuthCallback({
      pathname: "/auth/callback",
      search: "",
      hasSession: false,
      sessionResolved: true,
      storage,
    });
    expect(first).toBe(true);
    expect(storage.getItem(AUTH_CALLBACK_RETRY_KEY)).toBeTruthy();

    const second = shouldRedirectFromAuthCallback({
      pathname: "/auth/callback",
      search: "",
      hasSession: false,
      sessionResolved: true,
      storage,
    });
    expect(second).toBe(false);
  });

  it("does not redirect when access token params are present", () => {
    const storage = createMemoryStorage();
    const shouldRedirect = shouldRedirectFromAuthCallback({
      pathname: "/auth/callback",
      search: "?access_token=token&user_id=1&email=test@example.com",
      hasSession: false,
      sessionResolved: true,
      storage,
    });
    expect(shouldRedirect).toBe(false);
  });

  it("does not redirect when PKCE OAuth code is present", () => {
    const storage = createMemoryStorage();
    const shouldRedirect = shouldRedirectFromAuthCallback({
      pathname: "/auth/callback",
      search: "?insforge_code=code",
      hasSession: false,
      sessionResolved: true,
      storage,
    });
    expect(shouldRedirect).toBe(false);
  });

  it("clears retry flag once session exists", () => {
    const storage = createMemoryStorage();
    storage.setItem(AUTH_CALLBACK_RETRY_KEY, "1");
    const shouldRedirect = shouldRedirectFromAuthCallback({
      pathname: "/auth/callback",
      search: "",
      hasSession: true,
      sessionResolved: true,
      storage,
    });
    expect(shouldRedirect).toBe(false);
    expect(storage.getItem(AUTH_CALLBACK_RETRY_KEY)).toBeNull();
  });

  it("handles storage errors without crashing", () => {
    const storage = createThrowingStorage();
    const first = shouldRedirectFromAuthCallback({
      pathname: "/auth/callback",
      search: "",
      hasSession: false,
      sessionResolved: true,
      storage,
    });
    expect(first).toBe(true);

    const second = shouldRedirectFromAuthCallback({
      pathname: "/auth/callback",
      search: "",
      hasSession: false,
      sessionResolved: true,
      storage,
    });
    expect(second).toBe(false);
  });

  it("skips redirect until session is resolved", () => {
    const storage = createMemoryStorage();
    const shouldRedirect = shouldRedirectFromAuthCallback({
      pathname: "/auth/callback",
      search: "",
      hasSession: false,
      sessionResolved: false,
      storage,
    });
    expect(shouldRedirect).toBe(false);
    expect(storage.getItem(AUTH_CALLBACK_RETRY_KEY)).toBeNull();
  });

  it("returns null when sessionStorage getter throws", () => {
    const storage = getSafeSessionStorage(() => {
      throw new Error("storage blocked");
    });
    expect(storage).toBeNull();
  });

  it("uses window.name fallback when storage is unavailable (prevents reload loops)", () => {
    const marker = "__vibeusage_auth_callback_retry_v1__=";
    const first = shouldRedirectFromAuthCallback({
      pathname: "/auth/callback",
      search: "",
      hasSession: false,
      sessionResolved: true,
      storage: null,
    });
    expect(first).toBe(true);
    expect(window.name.includes(marker)).toBe(true);

    // Simulate a full page reload: module memory is reset, window.name survives.
    resetAuthCallbackRetryState();
    const second = shouldRedirectFromAuthCallback({
      pathname: "/auth/callback",
      search: "",
      hasSession: false,
      sessionResolved: true,
      storage: null,
    });
    expect(second).toBe(false);

    // Once session exists, the fallback marker should be cleared.
    const third = shouldRedirectFromAuthCallback({
      pathname: "/auth/callback",
      search: "",
      hasSession: true,
      sessionResolved: true,
      storage: null,
    });
    expect(third).toBe(false);
    expect(window.name.includes(marker)).toBe(false);
  });
});
