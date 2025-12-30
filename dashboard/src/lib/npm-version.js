import { safeGetItem, safeSetItem } from "./safe-browser.js";

const VERSION_CACHE_KEY = "vibescore.latest_tracker_version";
const VERSION_CACHE_AT_KEY = "vibescore.latest_tracker_version_at";
const VERSION_TTL_MS = 6 * 60 * 60 * 1000;
const REGISTRY_URL = "https://registry.npmjs.org/@vibescore/tracker/latest";

function isValidVersion(value) {
  return typeof value === "string" && /^\d+\.\d+\.\d+/.test(value);
}

function readCachedVersion(nowMs) {
  const cached = safeGetItem(VERSION_CACHE_KEY);
  if (!isValidVersion(cached)) return null;
  const cachedAtRaw = safeGetItem(VERSION_CACHE_AT_KEY);
  const cachedAt = Number(cachedAtRaw);
  if (!Number.isFinite(cachedAt)) return null;
  if (nowMs - cachedAt > VERSION_TTL_MS) return null;
  return cached;
}

function readStaleVersion() {
  const cached = safeGetItem(VERSION_CACHE_KEY);
  return isValidVersion(cached) ? cached : null;
}

function writeCachedVersion(version, nowMs) {
  safeSetItem(VERSION_CACHE_KEY, version);
  safeSetItem(VERSION_CACHE_AT_KEY, String(nowMs));
}

export async function fetchLatestTrackerVersion({ allowStale = true } = {}) {
  const nowMs = Date.now();
  const cached = readCachedVersion(nowMs);
  if (cached) return cached;

  if (typeof fetch !== "function") {
    return allowStale ? readStaleVersion() : null;
  }

  let timeoutId = null;
  let controller = null;
  const scheduleTimeout =
    typeof window !== "undefined" && window.setTimeout
      ? window.setTimeout
      : setTimeout;
  const clearTimeoutFn =
    typeof window !== "undefined" && window.clearTimeout
      ? window.clearTimeout
      : clearTimeout;
  if (typeof AbortController !== "undefined") {
    controller = new AbortController();
    timeoutId = scheduleTimeout(() => controller.abort(), 2500);
  }

  try {
    const response = await fetch(REGISTRY_URL, {
      headers: { accept: "application/json" },
      signal: controller?.signal,
    });
    if (!response.ok) return allowStale ? readStaleVersion() : null;
    const data = await response.json();
    const version = typeof data?.version === "string" ? data.version : "";
    if (!isValidVersion(version)) return allowStale ? readStaleVersion() : null;
    writeCachedVersion(version, nowMs);
    return version;
  } catch (_e) {
    return allowStale ? readStaleVersion() : null;
  } finally {
    if (timeoutId) clearTimeoutFn(timeoutId);
  }
}
