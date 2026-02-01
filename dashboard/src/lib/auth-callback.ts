export const AUTH_CALLBACK_RETRY_KEY =
  "vibeusage.dashboard.auth_callback_retry.v1";

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
    storage?.removeItem?.(AUTH_CALLBACK_RETRY_KEY);
    return false;
  }
  const normalizedPath = normalizePathname(pathname);
  if (normalizedPath !== "/auth/callback") return false;
  if (hasAuthCallbackParams(search)) {
    storage?.removeItem?.(AUTH_CALLBACK_RETRY_KEY);
    return false;
  }
  const hasRetry = storage?.getItem?.(AUTH_CALLBACK_RETRY_KEY);
  if (hasRetry) return false;
  storage?.setItem?.(AUTH_CALLBACK_RETRY_KEY, new Date().toISOString());
  return true;
}
