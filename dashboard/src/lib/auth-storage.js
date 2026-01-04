const STORAGE_KEY = "vibeusage.dashboard.auth.v1";
const LEGACY_STORAGE_KEY = "vibescore.dashboard.auth.v1";
const SESSION_EXPIRED_KEY = "vibeusage.dashboard.session_expired.v1";
const LEGACY_SESSION_EXPIRED_KEY = "vibescore.dashboard.session_expired.v1";
const AUTH_EVENT_NAME = "vibeusage:auth-storage";

function emitAuthStorageChange() {
  if (typeof window === "undefined" || !window.dispatchEvent) return;
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

function getStorage() {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

export function loadAuthFromStorage() {
  try {
    const storage = getStorage();
    if (!storage || typeof storage.getItem !== "function") return null;
    let raw = storage.getItem(STORAGE_KEY);
    if (!raw) raw = storage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.accessToken !== "string" ||
      parsed.accessToken.length === 0
    )
      return null;
    if (!storage.getItem(STORAGE_KEY)) {
      storage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      storage.removeItem(LEGACY_STORAGE_KEY);
    }
    return parsed;
  } catch (_e) {
    return null;
  }
}

export function saveAuthToStorage(auth) {
  const storage = getStorage();
  if (!storage || typeof storage.setItem !== "function") return;
  storage.setItem(STORAGE_KEY, JSON.stringify(auth));
  emitAuthStorageChange();
}

export function clearAuthStorage() {
  const storage = getStorage();
  if (!storage || typeof storage.removeItem !== "function") return;
  storage.removeItem(STORAGE_KEY);
  storage.removeItem(LEGACY_STORAGE_KEY);
  emitAuthStorageChange();
}

export function loadSessionExpired() {
  try {
    const storage = getStorage();
    if (!storage || typeof storage.getItem !== "function") return false;
    let raw = storage.getItem(SESSION_EXPIRED_KEY);
    if (!raw) raw = storage.getItem(LEGACY_SESSION_EXPIRED_KEY);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.expiredAt === "string") {
        if (!storage.getItem(SESSION_EXPIRED_KEY)) {
          storage.setItem(
            SESSION_EXPIRED_KEY,
            JSON.stringify({ expiredAt: parsed.expiredAt })
          );
          storage.removeItem(LEGACY_SESSION_EXPIRED_KEY);
        }
        return true;
      }
    } catch (_e) {
      if (!storage.getItem(SESSION_EXPIRED_KEY)) {
        storage.setItem(SESSION_EXPIRED_KEY, JSON.stringify({ expiredAt: new Date().toISOString() }));
        storage.removeItem(LEGACY_SESSION_EXPIRED_KEY);
      }
      return raw === "true";
    }
    if (!storage.getItem(SESSION_EXPIRED_KEY)) {
      storage.setItem(SESSION_EXPIRED_KEY, JSON.stringify({ expiredAt: new Date().toISOString() }));
      storage.removeItem(LEGACY_SESSION_EXPIRED_KEY);
    }
    return raw === "true";
  } catch (_e) {
    return false;
  }
}

export function setSessionExpired() {
  try {
    const storage = getStorage();
    if (!storage || typeof storage.setItem !== "function") return;
    storage.setItem(
      SESSION_EXPIRED_KEY,
      JSON.stringify({ expiredAt: new Date().toISOString() })
    );
  } catch (_e) {
    // ignore storage errors
  } finally {
    emitAuthStorageChange();
  }
}

export function clearSessionExpired() {
  try {
    const storage = getStorage();
    if (!storage || typeof storage.removeItem !== "function") return;
    storage.removeItem(SESSION_EXPIRED_KEY);
    storage.removeItem(LEGACY_SESSION_EXPIRED_KEY);
  } catch (_e) {
    // ignore storage errors
  } finally {
    emitAuthStorageChange();
  }
}

export function markSessionExpired() {
  setSessionExpired();
  clearAuthStorage();
}

export function subscribeAuthStorage(handler) {
  if (typeof window === "undefined" || !window.addEventListener) {
    return () => {};
  }
  const onChange = () => {
    handler({
      auth: loadAuthFromStorage(),
      sessionExpired: loadSessionExpired(),
    });
  };
  window.addEventListener(AUTH_EVENT_NAME, onChange);
  return () => window.removeEventListener(AUTH_EVENT_NAME, onChange);
}
