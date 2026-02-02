import React, { useCallback, useEffect, useMemo, useState } from "react";

import { copy } from "../lib/copy";
import { getLeaderboard } from "../lib/vibeusage-api";
import { isMockEnabled } from "../lib/mock-data";
import { isAccessTokenReady, resolveAuthAccessToken } from "../lib/auth-token";
import { LeaderboardView } from "../ui/matrix-a/views/LeaderboardView.jsx";

const DEFAULT_PERIOD = "total";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function LeaderboardPage({ baseUrl, auth }: any = {}) {
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mockEnabled = isMockEnabled();
  const tokenReady = isAccessTokenReady(auth);

  const periods = useMemo(
    () => [
      { key: "day", label: copy("leaderboard.period.day") },
      { key: "week", label: copy("leaderboard.period.week") },
      { key: "month", label: copy("leaderboard.period.month") },
      { key: "total", label: copy("leaderboard.period.total") },
    ],
    []
  );

  const refresh = useCallback(async () => {
    const resolvedToken = await resolveAuthAccessToken(auth);
    if (!resolvedToken && !mockEnabled) {
      setEntries([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await getLeaderboard({
        baseUrl,
        accessToken: resolvedToken,
        period,
        limit,
      });
      setEntries(Array.isArray(res?.entries) ? res.entries : []);
    } catch (err) {
      const message = (err as any)?.message || String(err);
      setError(message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [auth, baseUrl, limit, mockEnabled, period]);

  useEffect(() => {
    if (!tokenReady && !mockEnabled) {
      setEntries([]);
      setError(null);
      setLoading(false);
      return;
    }
    refresh();
  }, [mockEnabled, refresh, tokenReady]);

  const handlePeriodChange = useCallback((next: string) => {
    if (!next || next === period) return;
    setPeriod(next);
    setLimit(DEFAULT_LIMIT);
  }, [period]);

  const handleLoadMore = useCallback(() => {
    if (loading) return;
    setLimit((prev) => Math.min(MAX_LIMIT, prev + DEFAULT_LIMIT));
  }, [loading]);

  const rows = useMemo(() => {
    return (entries || []).map((entry) => {
      const name =
        typeof entry?.display_name === "string" && entry.display_name.trim()
          ? entry.display_name
          : copy("shared.placeholder.anon_mark");
      return {
        rank: entry?.rank,
        name,
        value: entry?.total_tokens,
        isAnon: !entry?.display_name,
        isSelf: Boolean(entry?.is_me),
        isTheOne: entry?.rank === 1,
      };
    });
  }, [entries]);

  const showLoadMore = useMemo(() => {
    if (loading) return false;
    if (!Array.isArray(entries)) return false;
    return entries.length >= limit && limit < MAX_LIMIT;
  }, [entries, limit, loading]);

  return (
    <LeaderboardView
      copy={copy}
      period={period}
      periods={periods}
      rows={rows}
      loading={loading}
      error={error}
      onPeriodChange={handlePeriodChange}
      onLoadMore={handleLoadMore}
      showLoadMore={showLoadMore}
    />
  );
}
