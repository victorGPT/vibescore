import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getUsageDaily,
  getUsageHourly,
  getUsageMonthly,
} from "../lib/vibescore-api.js";
import { isMockEnabled } from "../lib/mock-data.js";

const DEFAULT_MONTHS = 24;

export function useTrendData({
  baseUrl,
  accessToken,
  period,
  from,
  to,
  months = DEFAULT_MONTHS,
  cacheKey,
} = {}) {
  const [rows, setRows] = useState([]);
  const [range, setRange] = useState(() => ({ from, to }));
  const [source, setSource] = useState("edge");
  const [fetchedAt, setFetchedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mockEnabled = isMockEnabled();

  const mode = useMemo(() => {
    if (period === "day") return "hourly";
    if (period === "total") return "monthly";
    return "daily";
  }, [period]);

  const storageKey = (() => {
    if (!cacheKey) return null;
    const host = safeHost(baseUrl) || "default";
    if (mode === "hourly") {
      const dayKey = to || from || "day";
      return `vibescore.trend.${cacheKey}.${host}.hourly.${dayKey}`;
    }
    if (mode === "monthly") {
      const toKey = to || "today";
      return `vibescore.trend.${cacheKey}.${host}.monthly.${months}.${toKey}`;
    }
    const rangeKey = `${from || ""}.${to || ""}`;
    return `vibescore.trend.${cacheKey}.${host}.daily.${rangeKey}`;
  })();

  const readCache = useCallback(() => {
    if (!storageKey || typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.rows)) return null;
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
      let response;
      if (mode === "hourly") {
        const day = to || from;
        response = await getUsageHourly({ baseUrl, accessToken, day });
      } else if (mode === "monthly") {
        response = await getUsageMonthly({ baseUrl, accessToken, months, to });
      } else {
        response = await getUsageDaily({ baseUrl, accessToken, from, to });
      }

      const nextRows = Array.isArray(response?.data) ? response.data : [];
      const nextFrom = response?.from || from || response?.day || null;
      const nextTo = response?.to || to || response?.day || null;
      const nowIso = new Date().toISOString();

      setRows(nextRows);
      setRange({ from: nextFrom, to: nextTo });
      setSource("edge");
      setFetchedAt(nowIso);

      writeCache({
        rows: nextRows,
        from: nextFrom,
        to: nextTo,
        mode,
        fetchedAt: nowIso,
      });
    } catch (e) {
      const cached = readCache();
      if (cached?.rows) {
        setRows(Array.isArray(cached.rows) ? cached.rows : []);
        setRange({ from: cached.from || from, to: cached.to || to });
        setSource("cache");
        setFetchedAt(cached.fetchedAt || null);
        setError(null);
      } else {
        setRows([]);
        setRange({ from, to });
        setSource("edge");
        setFetchedAt(null);
        setError(e?.message || String(e));
      }
    } finally {
      setLoading(false);
    }
  }, [
    accessToken,
    baseUrl,
    from,
    mockEnabled,
    mode,
    months,
    readCache,
    to,
    writeCache,
  ]);

  useEffect(() => {
    if (!accessToken && !mockEnabled) {
      setRows([]);
      setRange({ from, to });
      setError(null);
      setLoading(false);
      setSource("edge");
      setFetchedAt(null);
      return;
    }
    const cached = readCache();
    if (cached?.rows) {
      setRows(Array.isArray(cached.rows) ? cached.rows : []);
      setRange({ from: cached.from || from, to: cached.to || to });
      setSource("cache");
      setFetchedAt(cached.fetchedAt || null);
    }
    refresh();
  }, [accessToken, mockEnabled, readCache, refresh]);

  const normalizedSource = mockEnabled ? "mock" : source;

  return {
    rows,
    from: range.from || from,
    to: range.to || to,
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
