export const AUTH_CALLBACK_RETRY_KEY =
  "vibeusage.dashboard.auth_callback_retry.v1";
let memoryRetry: string | null = null;

function safeGet(storage: Storage | null | undefined, key: string) {
  try {
    return storage?.getItem?.(key) ?? null;
  } catch (_e) {
    return null;
  }
}

function safeSet(storage: Storage | null | undefined, key: string, value: string) {
  try {
    storage?.setItem?.(key, value);
    return true;
  } catch (_e) {
    return false;
  }
}

function safeRemove(storage: Storage | null | undefined, key: string) {
  try {
    storage?.removeItem?.(key);
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
  storage,
}: {
  pathname: any;
  search: any;
  hasSession: boolean;
  storage?: Storage | null;
}) {
  if (hasSession) {
    safeRemove(storage, AUTH_CALLBACK_RETRY_KEY);
    memoryRetry = null;
    return false;
  }
  const normalizedPath = normalizePathname(pathname);
  if (normalizedPath !== "/auth/callback") return false;
  if (hasAuthCallbackParams(search)) {
    safeRemove(storage, AUTH_CALLBACK_RETRY_KEY);
    memoryRetry = null;
    return false;
  }
  const storedRetry = safeGet(storage, AUTH_CALLBACK_RETRY_KEY);
  if (storedRetry) {
    memoryRetry = null;
  }
  const hasRetry = storedRetry || memoryRetry;
  if (hasRetry) return false;
  const nextRetry = new Date().toISOString();
  if (!safeSet(storage, AUTH_CALLBACK_RETRY_KEY, nextRetry)) {
    memoryRetry = nextRetry;
  }
  return true;
}
