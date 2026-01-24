const STORAGE_KEY = "vibeusage.dashboard.auth.v1";
const SESSION_EXPIRED_KEY = "vibeusage.dashboard.session_expired.v1";
const SESSION_SOFT_EXPIRED_KEY = "vibeusage.dashboard.session_soft_expired.v1";
const AUTH_EVENT_NAME = "vibeusage:auth-storage";

function emitAuthStorageChange() {
  if (typeof window === "undefined" || !window.dispatchEvent) return;
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    return storage || null;
  } catch (_e) {
    return null;
  }
}

export function loadAuthFromStorage() {
  try {
    const storage = getStorage();
    if (!storage || typeof storage.getItem !== "function") return null;
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.accessToken !== "string" ||
      parsed.accessToken.length === 0
    )
      return null;
    return parsed;
  } catch (_e) {
    return null;
  }
}

export function saveAuthToStorage(auth: any) {
  const storage = getStorage();
  if (!storage || typeof storage.setItem !== "function") return;
  storage.setItem(STORAGE_KEY, JSON.stringify(auth));
  emitAuthStorageChange();
}

export function clearAuthStorage() {
  const storage = getStorage();
  if (!storage || typeof storage.removeItem !== "function") return;
  storage.removeItem(STORAGE_KEY);
  emitAuthStorageChange();
}

export function loadSessionExpired() {
  try {
    const storage = getStorage();
    if (!storage || typeof storage.getItem !== "function") return false;
    const raw = storage.getItem(SESSION_EXPIRED_KEY);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.expiredAt === "string") {
        return true;
      }
    } catch (_e) {
      return raw === "true";
    }
    return raw === "true";
  } catch (_e) {
    return false;
  }
}

export function loadSessionSoftExpired() {
  try {
    const storage = getStorage();
    if (!storage || typeof storage.getItem !== "function") return false;
    const raw = storage.getItem(SESSION_SOFT_EXPIRED_KEY);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.expiredAt === "string") {
        return true;
      }
    } catch (_e) {
      return raw === "true";
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

export function setSessionSoftExpired() {
  try {
    const storage = getStorage();
    if (!storage || typeof storage.setItem !== "function") return;
    storage.setItem(
      SESSION_SOFT_EXPIRED_KEY,
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
  } catch (_e) {
    // ignore storage errors
  } finally {
    emitAuthStorageChange();
  }
}

export function clearSessionSoftExpired() {
  try {
    const storage = getStorage();
    if (!storage || typeof storage.removeItem !== "function") return;
    storage.removeItem(SESSION_SOFT_EXPIRED_KEY);
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

export function markSessionSoftExpired() {
  setSessionSoftExpired();
}

export function subscribeAuthStorage(handler: any) {
  if (typeof window === "undefined" || !window.addEventListener) {
    return () => {};
  }
  const onChange = () => {
    handler({
      auth: loadAuthFromStorage(),
      sessionExpired: loadSessionExpired(),
      sessionSoftExpired: loadSessionSoftExpired(),
    });
  };
  window.addEventListener(AUTH_EVENT_NAME, onChange);
  return () => window.removeEventListener(AUTH_EVENT_NAME, onChange);
}

export function subscribeSessionExpired(handler: any) {
  if (typeof window === "undefined" || !window.addEventListener) {
    return () => {};
  }
  const onChange = () => {
    handler(loadSessionExpired());
  };
  window.addEventListener(AUTH_EVENT_NAME, onChange);
  return () => window.removeEventListener(AUTH_EVENT_NAME, onChange);
}

export function subscribeSessionSoftExpired(handler: any) {
  if (typeof window === "undefined" || !window.addEventListener) {
    return () => {};
  }
  const onChange = () => {
    handler(loadSessionSoftExpired());
  };
  window.addEventListener(AUTH_EVENT_NAME, onChange);
  return () => window.removeEventListener(AUTH_EVENT_NAME, onChange);
}
