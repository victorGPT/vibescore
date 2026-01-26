const REDIRECT_STORAGE_KEY = "vibeusage.dashboard.redirect.v1";
let memoryRedirect: string | null = null;

function getRedirectStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage || null;
  } catch (_e) {
    return null;
  }
}

export function parseRedirectParam(search: any) {
  if (typeof search !== "string" || search.length === 0) return null;
  const normalized = search.startsWith("?") ? search : `?${search}`;
  const params = new URLSearchParams(normalized);
  const redirect = params.get("redirect");
  if (!redirect) return null;
  return redirect;
}

function isLoopbackHost(hostname: any) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function validateLoopbackHttpRedirect(value: any) {
  if (typeof value !== "string" || value.length === 0) return null;
  let url;
  try {
    url = new URL(value);
  } catch (_e) {
    return null;
  }
  if (url.protocol !== "http:") return null;
  if (!isLoopbackHost(url.hostname)) return null;
  return url.toString();
}

export function saveRedirectToStorage(target: any, storage: any = getRedirectStorage()) {
  if (!storage || typeof storage.setItem !== "function") return false;
  if (typeof target !== "string" || target.length === 0) return false;
  try {
    storage.setItem(REDIRECT_STORAGE_KEY, target);
    return true;
  } catch (_e) {
    return false;
  }
}

export function clearRedirectFromStorage(storage: any = getRedirectStorage()) {
  if (!storage || typeof storage.removeItem !== "function") return false;
  try {
    storage.removeItem(REDIRECT_STORAGE_KEY);
    return true;
  } catch (_e) {
    return false;
  }
}

export function consumeRedirectFromStorage(storage: any = getRedirectStorage()) {
  if (!storage || typeof storage.getItem !== "function") return null;
  const value = storage.getItem(REDIRECT_STORAGE_KEY);
  if (!value) return null;
  if (typeof storage.removeItem === "function") {
    storage.removeItem(REDIRECT_STORAGE_KEY);
  }
  return value;
}

export function stripRedirectParam(urlString: any) {
  if (typeof urlString !== "string" || urlString.length === 0) return null;
  let url;
  try {
    url = new URL(urlString);
  } catch (_e) {
    return null;
  }
  if (!url.searchParams.has("redirect")) return null;
  url.searchParams.delete("redirect");
  return url.toString();
}

export function buildRedirectUrl(
  target: any,
  { accessToken, userId, email, name }: Record<string, any> = {}
) {
  const url = new URL(target);
  if (typeof accessToken === "string" && accessToken.length > 0) {
    url.searchParams.set("access_token", accessToken);
  }
  if (typeof userId === "string" && userId.length > 0) {
    url.searchParams.set("user_id", userId);
  }
  if (typeof email === "string" && email.length > 0) {
    url.searchParams.set("email", email);
  }
  if (typeof name === "string" && name.length > 0) {
    url.searchParams.set("name", name);
  }
  return url.toString();
}

export function storeRedirectFromSearch(
  search: any,
  storage: any = getRedirectStorage()
) {
  const raw = parseRedirectParam(search);
  const valid = validateLoopbackHttpRedirect(raw);
  const saved = valid ? saveRedirectToStorage(valid, storage) : false;
  if (valid && !saved) {
    memoryRedirect = valid;
    clearRedirectFromStorage(storage);
  }
  if (saved) {
    memoryRedirect = null;
  }
  return { raw, valid, saved };
}

export function resolveRedirectTarget(
  search: any,
  storage: any = getRedirectStorage()
) {
  const raw = parseRedirectParam(search);
  const fromQuery = validateLoopbackHttpRedirect(raw);
  if (fromQuery) {
    memoryRedirect = null;
    consumeRedirectFromStorage(storage);
    return fromQuery;
  }
  if (memoryRedirect) {
    const value = memoryRedirect;
    memoryRedirect = null;
    consumeRedirectFromStorage(storage);
    return value;
  }
  const stored = consumeRedirectFromStorage(storage);
  if (stored) {
    const validated = validateLoopbackHttpRedirect(stored);
    if (validated) {
      memoryRedirect = null;
      return validated;
    }
  }
  return null;
}
