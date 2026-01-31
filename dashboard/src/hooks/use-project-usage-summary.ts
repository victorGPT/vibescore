import { useCallback, useEffect, useState } from "react";

import { getProjectUsageSummary } from "../lib/vibeusage-api";
import { isMockEnabled } from "../lib/mock-data";
import { isAccessTokenReady, resolveAuthAccessToken } from "../lib/auth-token";

export function useProjectUsageSummary({
  baseUrl,
  accessToken,
  limit = 3,
  from,
  to,
  source,
  timeZone,
  tzOffsetMinutes,
}: any = {}) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mockEnabled = isMockEnabled();
  const tokenReady = isAccessTokenReady(accessToken);

  const refresh = useCallback(async () => {
    const resolvedToken = await resolveAuthAccessToken(accessToken);
    if (!resolvedToken && !mockEnabled) {
      setEntries([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getProjectUsageSummary({
        baseUrl,
        accessToken: resolvedToken,
        limit,
        from,
        to,
        source,
        timeZone,
        tzOffsetMinutes,
      });
      setEntries(Array.isArray(res?.entries) ? res.entries : []);
    } catch (err) {
      const message = (err as any)?.message || String(err);
      setError(message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [
    accessToken,
    baseUrl,
    from,
    limit,
    mockEnabled,
    source,
    timeZone,
    to,
    tzOffsetMinutes,
  ]);

  useEffect(() => {
    if (!tokenReady && !mockEnabled) {
      setEntries([]);
      setError(null);
      setLoading(false);
      return;
    }
    refresh();
  }, [mockEnabled, refresh, tokenReady]);

  return { entries, loading, error, refresh };
}
