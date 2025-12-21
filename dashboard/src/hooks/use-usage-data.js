import { useCallback, useEffect, useState } from "react";

import { getUsageDaily, getUsageSummary } from "../lib/vibescore-api.js";
import { isMockEnabled } from "../lib/mock-data.js";

export function useUsageData({
  baseUrl,
  accessToken,
  from,
  to,
  includeDaily = true,
  cacheKey,
} = {}) {
  const [daily, setDaily] = useState([]);
  const [summary, setSummary] = useState(null);
  const [source, setSource] = useState("edge");
  const [fetchedAt, setFetchedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mockEnabled = isMockEnabled();

  const storageKey = (() => {
    if (!cacheKey) return null;
    const host = safeHost(baseUrl) || "default";
    const dailyKey = includeDaily ? "daily" : "summary";
    return `vibescore.usage.${cacheKey}.${host}.${from}.${to}.${dailyKey}`;
  })();

  const readCache = useCallback(() => {
    if (!storageKey || typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.summary) return null;
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
        // ignore write errors (quota/private mode)
      }
    },
    [storageKey]
  );

  const refresh = useCallback(async () => {
    if (!accessToken && !mockEnabled) return;
    setLoading(true);
    setError(null);
    try {
      const promises = [getUsageSummary({ baseUrl, accessToken, from, to })];
      if (includeDaily) {
        promises.unshift(getUsageDaily({ baseUrl, accessToken, from, to }));
      }

      const results = await Promise.all(promises);
      const summaryRes = includeDaily ? results[1] : results[0];
      const dailyRes = includeDaily ? results[0] : null;

      const nextDaily =
        includeDaily && Array.isArray(dailyRes?.data) ? dailyRes.data : [];
      const nextSummary = summaryRes?.totals || null;
      const nowIso = new Date().toISOString();

      setDaily(nextDaily);
      setSummary(nextSummary);
      setSource("edge");
      setFetchedAt(nowIso);

      if (nextSummary) {
        writeCache({
          summary: nextSummary,
          daily: nextDaily,
          from,
          to,
          includeDaily,
          fetchedAt: nowIso,
        });
      }
    } catch (e) {
      const cached = readCache();
      if (cached?.summary) {
        setSummary(cached.summary);
        setDaily(Array.isArray(cached.daily) ? cached.daily : []);
        setSource("cache");
        setFetchedAt(cached.fetchedAt || null);
        setError(null);
      } else {
        setError(e?.message || String(e));
        setDaily([]);
        setSummary(null);
        setSource("edge");
        setFetchedAt(null);
      }
    } finally {
      setLoading(false);
    }
  }, [
    accessToken,
    baseUrl,
    from,
    includeDaily,
    mockEnabled,
    readCache,
    to,
    writeCache,
  ]);

  useEffect(() => {
    if (!accessToken && !mockEnabled) {
      setDaily([]);
      setSummary(null);
      setError(null);
      setLoading(false);
      setSource("edge");
      setFetchedAt(null);
      return;
    }
    const cached = readCache();
    if (cached?.summary) {
      setSummary(cached.summary);
      setDaily(Array.isArray(cached.daily) ? cached.daily : []);
      setSource("cache");
      setFetchedAt(cached.fetchedAt || null);
    }
    refresh();
  }, [accessToken, mockEnabled, readCache, refresh]);

  const normalizedSource = mockEnabled ? "mock" : source;

  return {
    daily,
    summary,
    source: normalizedSource,
    fetchedAt,
    loading,
    error,
    refresh,
  };
}

function safeHost(baseUrl) {
  try {
    const u = new URL(baseUrl);
    return u.host;
  } catch (_e) {
    return null;
  }
}
