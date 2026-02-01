import { beforeEach, describe, expect, it } from "vitest";

import {
  AUTH_CALLBACK_RETRY_KEY,
  getSafeSessionStorage,
  resetAuthCallbackRetryState,
  shouldRedirectFromAuthCallback,
} from "../auth-callback";

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
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

describe("shouldRedirectFromAuthCallback", () => {
  beforeEach(() => {
    resetAuthCallbackRetryState();
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
    const storage = {
      getItem() {
        throw new Error("storage blocked");
      },
      setItem() {
        throw new Error("storage blocked");
      },
      removeItem() {
        throw new Error("storage blocked");
      },
    };
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
});
