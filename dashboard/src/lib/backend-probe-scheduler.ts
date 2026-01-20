export const DEFAULT_PROBE_INTERVAL_MS = 120_000;
export const DEFAULT_PROBE_MAX_INTERVAL_MS = 300_000;
export const DEFAULT_PROBE_FAILURE_RETRY_MS = 10_000;

type ProbeCadenceConfig = {
  intervalMs?: number;
  maxIntervalMs?: number;
  failureRetryMs?: number;
  backoffStepMs?: number;
};

export function resolveProbeCadenceConfig({
  intervalMs = DEFAULT_PROBE_INTERVAL_MS,
  maxIntervalMs = DEFAULT_PROBE_MAX_INTERVAL_MS,
  failureRetryMs = DEFAULT_PROBE_FAILURE_RETRY_MS,
  backoffStepMs,
}: ProbeCadenceConfig = {}) {
  const baseIntervalMs = normalizePositiveInt(intervalMs, DEFAULT_PROBE_INTERVAL_MS);
  const maxIntervalCandidate = normalizePositiveInt(
    maxIntervalMs,
    DEFAULT_PROBE_MAX_INTERVAL_MS
  );
  const resolvedMaxIntervalMs = Math.max(baseIntervalMs, maxIntervalCandidate);
  const defaultBackoffStepMs = Math.max(1000, Math.round(baseIntervalMs * 0.5));
  const resolvedBackoffStepMs = normalizePositiveInt(backoffStepMs, defaultBackoffStepMs);
  const failureRetryCandidate = normalizePositiveInt(
    failureRetryMs,
    DEFAULT_PROBE_FAILURE_RETRY_MS
  );
  const resolvedFailureRetryMs = Math.min(
    baseIntervalMs,
    Math.max(1000, failureRetryCandidate)
  );

  return {
    baseIntervalMs,
    maxIntervalMs: resolvedMaxIntervalMs,
    backoffStepMs: resolvedBackoffStepMs,
    failureRetryMs: resolvedFailureRetryMs,
  };
}

export function createProbeCadence(config: ProbeCadenceConfig = {}) {
  const resolved = resolveProbeCadenceConfig(config);
  let successStreak = 0;
  let nextDelayMs = resolved.baseIntervalMs;

  const onSuccess = () => {
    successStreak += 1;
    const steps = Math.max(0, successStreak - 1);
    nextDelayMs = clampDelay(
      resolved.baseIntervalMs + resolved.backoffStepMs * steps,
      resolved.baseIntervalMs,
      resolved.maxIntervalMs
    );
    return nextDelayMs;
  };

  const onFailure = () => {
    successStreak = 0;
    nextDelayMs = clampDelay(
      resolved.failureRetryMs,
      1000,
      resolved.maxIntervalMs
    );
    return nextDelayMs;
  };

  const onError = () => {
    successStreak = 0;
    nextDelayMs = clampDelay(
      resolved.baseIntervalMs,
      resolved.baseIntervalMs,
      resolved.maxIntervalMs
    );
    return nextDelayMs;
  };

  const reset = () => {
    successStreak = 0;
    nextDelayMs = resolved.baseIntervalMs;
    return nextDelayMs;
  };

  return {
    onSuccess,
    onFailure,
    onError,
    reset,
    getNextDelay() {
      return nextDelayMs;
    },
    getConfig() {
      return { ...resolved };
    },
  };
}

function normalizePositiveInt(value: any, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n <= 0) return fallback;
  return Math.floor(n);
}

function clampDelay(value: any, min: number, max: number) {
  const n = normalizePositiveInt(value, min);
  if (n < min) return min;
  if (n > max) return max;
  return n;
}
