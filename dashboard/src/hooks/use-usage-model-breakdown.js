import { useCallback, useEffect, useMemo, useState } from "react";

import { getUsageModelBreakdown } from "../lib/vibescore-api.js";
import { isMockEnabled } from "../lib/mock-data.js";
import { getTimeZoneCacheKey } from "../lib/timezone.js";

export function useUsageModelBreakdown({
  baseUrl,
  accessToken,
  from,
  to,
  cacheKey,
  timeZone,
  tzOffsetMinutes,
} = {}) {
  const [breakdown, setBreakdown] = useState(null);
  const [source, setSource] = useState("edge");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mockEnabled = isMockEnabled();

  const storageKey = useMemo(() => {
    if (!cacheKey) return null;
    const host = safeHost(baseUrl) || "default";
    const tzKey = getTimeZoneCacheKey({ timeZone, offsetMinutes: tzOffsetMinutes });
    return `vibeusage.modelBreakdown.${cacheKey}.${host}.${from}.${to}.${tzKey}`;
  }, [baseUrl, cacheKey, from, timeZone, to, tzOffsetMinutes]);

  const readCache = useCallback(() => {
    if (!storageKey || typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.breakdown) return null;
      return parsed;
    } catch (_e) {
      return null;
    }
  }, [storageKey]);

  const writeCache = useCallback(
    (payload) => {
      if (!storageKey || typeof window === "undefined") return;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch (_e) {
        // ignore write errors
      }
    },
    [storageKey]
  );

  const refresh = useCallback(async () => {
    if (!accessToken && !mockEnabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getUsageModelBreakdown({
        baseUrl,
        accessToken,
        from,
        to,
        timeZone,
        tzOffsetMinutes,
      });
      setBreakdown(res || null);
      setSource("edge");
      if (res) {
        writeCache({ breakdown: res, fetchedAt: new Date().toISOString() });
      }
    } catch (e) {
      const cached = readCache();
      if (cached?.breakdown) {
        setBreakdown(cached.breakdown);
        setSource("cache");
        setError(null);
      } else {
        setBreakdown(null);
        setSource("edge");
        setError(e?.message || String(e));
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, baseUrl, from, mockEnabled, readCache, timeZone, to, tzOffsetMinutes, writeCache]);

  useEffect(() => {
    if (!accessToken && !mockEnabled) {
      setBreakdown(null);
      setSource("edge");
      setError(null);
      setLoading(false);
      return;
    }
    const cached = readCache();
    if (cached?.breakdown) {
      setBreakdown(cached.breakdown);
      setSource("cache");
    }
    refresh();
  }, [accessToken, mockEnabled, readCache, refresh]);

  const normalizedSource = mockEnabled ? "mock" : source;

  return {
    breakdown,
    source: normalizedSource,
    loading,
    error,
    refresh,
  };
}

function safeHost(baseUrl) {
  try {
    const url = new URL(baseUrl);
    return url.host;
  } catch (_e) {
    return null;
  }
}
