export const AUTH_CALLBACK_RETRY_KEY =
  "vibeusage.dashboard.auth_callback_retry.v1";

// Fallback for environments where sessionStorage is blocked (Safari private mode,
// some in-app webviews, strict tracking protection). window.name survives reloads
// within the same tab, which avoids auth callback redirect loops.
const WINDOW_NAME_RETRY_KEY = "__vibeusage_auth_callback_retry_v1__";
let memoryRetry: string | null = null;

export function getSafeSessionStorage(
  getter: () => Storage | null = () =>
    typeof window === "undefined" ? null : window.sessionStorage
) {
  try {
    return getter();
  } catch (_e) {
    return null;
  }
}

export function resetAuthCallbackRetryState() {
  memoryRetry = null;
}

function safeGet(storage: Storage | null | undefined, key: string) {
  try {
    return storage?.getItem?.(key) ?? null;
  } catch (_e) {
    return null;
  }
}

function safeSet(storage: Storage | null | undefined, key: string, value: string) {
  try {
    if (!storage || typeof storage.setItem !== "function") return false;
    storage.setItem(key, value);
    return true;
  } catch (_e) {
    return false;
  }
}

function safeRemove(storage: Storage | null | undefined, key: string) {
  try {
    if (!storage || typeof storage.removeItem !== "function") return false;
    storage.removeItem(key);
    return true;
  } catch (_e) {
    return false;
  }
}

function safeReadWindowNameRetry() {
  if (typeof window === "undefined") return null;
  try {
    const rawName = String(window.name || "");
    if (!rawName) return null;
    const prefix = `${WINDOW_NAME_RETRY_KEY}=`;
    const idx = rawName.indexOf(prefix);
    if (idx < 0) return null;
    const start = idx + prefix.length;
    const end = rawName.indexOf("\n", start);
    const rawValue = end < 0 ? rawName.slice(start) : rawName.slice(start, end);
    if (!rawValue) return null;
    try {
      return decodeURIComponent(rawValue);
    } catch (_e) {
      return rawValue;
    }
  } catch (_e) {
    return null;
  }
}

function safeWriteWindowNameRetry(value: string) {
  if (typeof window === "undefined") return false;
  if (typeof value !== "string" || value.length === 0) return false;
  try {
    const rawName = String(window.name || "");
    const prefix = `${WINDOW_NAME_RETRY_KEY}=`;
    const encoded = encodeURIComponent(value);
    const idx = rawName.indexOf(prefix);
    if (idx < 0) {
      const needsNewline = rawName.length > 0 && !rawName.endsWith("\n");
      window.name = `${rawName}${needsNewline ? "\n" : ""}${prefix}${encoded}`;
      return true;
    }
    const start = idx + prefix.length;
    const end = rawName.indexOf("\n", start);
    const before = rawName.slice(0, start);
    const after = end < 0 ? "" : rawName.slice(end);
    window.name = `${before}${encoded}${after}`;
    return true;
  } catch (_e) {
    return false;
  }
}

function safeClearWindowNameRetry() {
  if (typeof window === "undefined") return false;
  try {
    const rawName = String(window.name || "");
    if (!rawName) return true;
    const prefix = `${WINDOW_NAME_RETRY_KEY}=`;
    const idx = rawName.indexOf(prefix);
    if (idx < 0) return true;
    const lineStart = rawName.lastIndexOf("\n", idx);
    const start = lineStart < 0 ? 0 : lineStart;
    const lineEnd = rawName.indexOf("\n", idx);
    const end = lineEnd < 0 ? rawName.length : lineEnd + 1;
    const next = `${rawName.slice(0, start)}${rawName.slice(end)}`;
    window.name = next.replace(/^\n+/, "").replace(/\n+$/, "");
    return true;
  } catch (_e) {
    return false;
  }
}

function normalizeSearch(search: any) {
  if (typeof search !== "string") return "";
  if (search.length === 0) return "";
  return search.startsWith("?") ? search : `?${search}`;
}

function normalizePathname(pathname: any) {
  if (typeof pathname !== "string" || pathname.length === 0) return "";
  return pathname.replace(/\/+$/, "") || "/";
}

export function hasAuthCallbackParams(search: any) {
  const normalized = normalizeSearch(search);
  if (!normalized) return false;
  const params = new URLSearchParams(normalized);
  return Boolean(
    params.get("access_token") ||
      params.get("user_id") ||
      params.get("email") ||
      params.get("csrf_token") ||
      params.get("error")
  );
}

export function shouldRedirectFromAuthCallback({
  pathname,
  search,
  hasSession,
  sessionResolved = true,
  storage,
}: {
  pathname: any;
  search: any;
  hasSession: boolean;
  sessionResolved?: boolean;
  storage?: Storage | null;
}) {
  if (!sessionResolved) return false;
  if (hasSession) {
    safeRemove(storage, AUTH_CALLBACK_RETRY_KEY);
    memoryRetry = null;
    safeClearWindowNameRetry();
    return false;
  }
  const normalizedPath = normalizePathname(pathname);
  if (normalizedPath !== "/auth/callback") return false;
  if (hasAuthCallbackParams(search)) {
    safeRemove(storage, AUTH_CALLBACK_RETRY_KEY);
    memoryRetry = null;
    safeClearWindowNameRetry();
    return false;
  }
  const storedRetry = safeGet(storage, AUTH_CALLBACK_RETRY_KEY);
  if (storedRetry) {
    memoryRetry = null;
    safeClearWindowNameRetry();
  }
  const windowRetry = storedRetry ? null : safeReadWindowNameRetry();
  if (windowRetry) {
    memoryRetry = null;
  }
  const hasRetry = storedRetry || windowRetry || memoryRetry;
  if (hasRetry) return false;
  const nextRetry = new Date().toISOString();
  if (!safeSet(storage, AUTH_CALLBACK_RETRY_KEY, nextRetry)) {
    if (!safeWriteWindowNameRetry(nextRetry)) {
      memoryRetry = nextRetry;
    }
  } else {
    safeClearWindowNameRetry();
    memoryRetry = null;
  }
  return true;
}
