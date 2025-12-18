import { useCallback, useEffect, useState } from "react";

import { fetchJson } from "../lib/http.js";

export function useUsageData({ baseUrl, accessToken, from, to }) {
  const [daily, setDaily] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const dailyUrl = new URL("/functions/vibescore-usage-daily", baseUrl);
      dailyUrl.searchParams.set("from", from);
      dailyUrl.searchParams.set("to", to);

      const summaryUrl = new URL("/functions/vibescore-usage-summary", baseUrl);
      summaryUrl.searchParams.set("from", from);
      summaryUrl.searchParams.set("to", to);

      const [dailyRes, summaryRes] = await Promise.all([
        fetchJson(dailyUrl.toString(), { headers }),
        fetchJson(summaryUrl.toString(), { headers }),
      ]);

      setDaily(Array.isArray(dailyRes?.data) ? dailyRes.data : []);
      setSummary(summaryRes?.totals || null);
    } catch (e) {
      setError(e?.message || String(e));
      setDaily([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, baseUrl, from, to]);

  useEffect(() => {
    if (!accessToken) {
      setDaily([]);
      setSummary(null);
      setError(null);
      setLoading(false);
      return;
    }
    refresh();
  }, [accessToken, refresh]);

  return { daily, summary, loading, error, refresh };
}

