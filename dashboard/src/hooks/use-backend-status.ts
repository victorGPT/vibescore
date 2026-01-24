import { useCallback, useEffect, useRef, useState } from "react";

import { probeBackend } from "../lib/vibeusage-api";
import {
  createProbeCadence,
  DEFAULT_PROBE_INTERVAL_MS,
} from "../lib/backend-probe-scheduler";

type UseBackendStatusOptions = {
  baseUrl?: string;
  accessToken?: string;
  intervalMs?: number;
  timeoutMs?: number;
  retryDelayMs?: number;
  failureThreshold?: number;
};

type ProbeResult =
  | { ok: true; status?: number }
  | { ok: false; error: any };

export function useBackendStatus({
  baseUrl,
  accessToken,
  intervalMs = DEFAULT_PROBE_INTERVAL_MS,
  timeoutMs = 2500,
  retryDelayMs = 300,
  failureThreshold = 2,
}: UseBackendStatusOptions = {}) {
  const [status, setStatus] = useState("unknown"); // unknown | active | error | down
  const [checking, setChecking] = useState(false);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [lastOkAt, setLastOkAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inFlightRef = useRef(false);
  const failureCountRef = useRef(0);
  const cadenceRef = useRef(createProbeCadence({ intervalMs }));
  const nextDelayRef = useRef(cadenceRef.current.getNextDelay());
  const scheduleNextRef = useRef<((delayMs: number) => void) | null>(null);
  const threshold = Number.isFinite(Number(failureThreshold))
    ? Math.max(1, Math.floor(Number(failureThreshold)))
    : 2;

  useEffect(() => {
    cadenceRef.current = createProbeCadence({ intervalMs });
    nextDelayRef.current = cadenceRef.current.getNextDelay();
    if (scheduleNextRef.current) {
      scheduleNextRef.current(nextDelayRef.current);
    }
  }, [intervalMs]);

  const applyCadence = useCallback((outcome: string) => {
    const cadence = cadenceRef.current;
    if (!cadence) return nextDelayRef.current;

    if (outcome === "success") {
      nextDelayRef.current = cadence.onSuccess();
    } else if (outcome === "failure") {
      nextDelayRef.current = cadence.onFailure();
    } else {
      nextDelayRef.current = cadence.onError();
    }

    return nextDelayRef.current;
  }, []);

  const refresh = useCallback(async ({ reschedule = true }: { reschedule?: boolean } = {}) => {
    let outcome = "error";
    if (!baseUrl) {
      setStatus("error");
      setChecking(false);
      setHttpStatus(null);
      setLastCheckedAt(new Date().toISOString());
      setError("Missing baseUrl");
      applyCadence(outcome);
      if (reschedule && scheduleNextRef.current) {
        scheduleNextRef.current(nextDelayRef.current);
      }
      return;
    }

    try {
      new URL(baseUrl);
    } catch (_e) {
      setStatus("error");
      setChecking(false);
      setHttpStatus(null);
      setLastCheckedAt(new Date().toISOString());
      setError("Invalid baseUrl");
      applyCadence(outcome);
      if (reschedule && scheduleNextRef.current) {
        scheduleNextRef.current(nextDelayRef.current);
      }
      return;
    }

    if (inFlightRef.current) {
      if (reschedule && scheduleNextRef.current) {
        scheduleNextRef.current(nextDelayRef.current);
      }
      return;
    }
    inFlightRef.current = true;
    setChecking(true);
    setError(null);

    try {
      const result = await probeWithRetry({
        baseUrl,
        accessToken,
        timeoutMs,
        retryDelayMs,
      });

      if (!result.ok) {
        throw result.error;
      }

      outcome = "success";
      failureCountRef.current = 0;
      setHttpStatus(result.status ?? 200);
      const now = new Date().toISOString();
      setLastCheckedAt(now);
      setStatus("active");
      setError(null);
      setLastOkAt(now);
    } catch (e) {
      const statusCode = (e as any)?.status ?? (e as any)?.statusCode;
      setHttpStatus(Number.isFinite(statusCode) ? statusCode : null);
      setLastCheckedAt(new Date().toISOString());

      if (statusCode === 401 || statusCode === 403) {
        failureCountRef.current = 0;
        setStatus("error");
        setError("Unauthorized");
      } else if (typeof statusCode === "number" && statusCode < 500) {
        failureCountRef.current = 0;
        setStatus("error");
        setError(`HTTP ${statusCode}`);
      } else {
        outcome = "failure";
        failureCountRef.current += 1;
        const nextStatus = failureCountRef.current >= threshold ? "down" : "error";
        setStatus(nextStatus);
        setError((e as any)?.name === "AbortError" ? "Timeout" : (e as any)?.message || "Fetch failed");
      }
    } finally {
      inFlightRef.current = false;
      setChecking(false);
      applyCadence(outcome);
      if (reschedule && scheduleNextRef.current) {
        scheduleNextRef.current(nextDelayRef.current);
      }
    }
  }, [
    accessToken,
    applyCadence,
    baseUrl,
    retryDelayMs,
    threshold,
    timeoutMs,
  ]);

  useEffect(() => {
    let id: ReturnType<typeof setTimeout> | null = null;

    const stop = () => {
      if (id != null) window.clearTimeout(id);
      id = null;
    };

    const scheduleNext = (delayMs: number) => {
      stop();
      if (typeof document !== "undefined" && document.hidden) return;
      id = window.setTimeout(() => {
        refresh({ reschedule: true });
      }, delayMs);
    };

    scheduleNextRef.current = scheduleNext;

    const start = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (id) return;
      refresh({ reschedule: true });
    };

    const onVisibility = () => {
      if (typeof document !== "undefined" && document.hidden) stop();
      else start();
    };

    start();
    document?.addEventListener?.("visibilitychange", onVisibility);
    return () => {
      stop();
      scheduleNextRef.current = null;
      document?.removeEventListener?.("visibilitychange", onVisibility);
    };
  }, [refresh]);

  return {
    status,
    checking,
    httpStatus,
    lastCheckedAt,
    lastOkAt,
    error,
    refresh,
  };
}

async function probeWithRetry({
  baseUrl,
  accessToken,
  timeoutMs,
  retryDelayMs,
}: {
  baseUrl: string;
  accessToken?: string;
  timeoutMs: number;
  retryDelayMs: number;
}): Promise<ProbeResult> {
  const first = await probeOnce({ baseUrl, accessToken, timeoutMs });
  if (first.ok) return first;
  if (!shouldRetry((first as { ok: false; error: any }).error)) return first;
  if (retryDelayMs > 0) {
    await sleep(retryDelayMs);
  }
  return probeOnce({ baseUrl, accessToken, timeoutMs });
}

async function probeOnce({
  baseUrl,
  accessToken,
  timeoutMs,
}: {
  baseUrl: string;
  accessToken?: string;
  timeoutMs: number;
}): Promise<ProbeResult> {
  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await probeBackend({
      baseUrl,
      accessToken,
      signal: controller.signal,
    });
    return { ok: true, status: res?.status ?? 200 };
  } catch (error) {
    return { ok: false, error: error as any };
  } finally {
    window.clearTimeout(t);
  }
}

function shouldRetry(error: any) {
  if (!error) return false;
  if (error.retryable) return true;
  const statusCode = error?.status ?? error?.statusCode;
  if (statusCode >= 500) return true;
  return error?.name === "AbortError";
}

function sleep(ms: number) {
  if (!ms || ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}
