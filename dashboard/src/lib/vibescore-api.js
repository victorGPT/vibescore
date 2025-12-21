import { createInsforgeClient } from "./insforge-client.js";
import { formatDateUTC } from "./date-range.js";
import {
  getMockUsageDaily,
  getMockUsageHourly,
  getMockUsageHeatmap,
  getMockUsageMonthly,
  getMockUsageSummary,
  isMockEnabled,
} from "./mock-data.js";

const BACKEND_RUNTIME_UNAVAILABLE =
  "Backend runtime unavailable (InsForge). Please retry later.";

const PATHS = {
  usageSummary: "/functions/vibescore-usage-summary",
  usageDaily: "/functions/vibescore-usage-daily",
  usageHourly: "/functions/vibescore-usage-hourly",
  usageMonthly: "/functions/vibescore-usage-monthly",
  usageHeatmap: "/functions/vibescore-usage-heatmap",
};

export async function probeBackend({ baseUrl, accessToken, signal } = {}) {
  const today = formatDateUTC(new Date());
  await requestJson({
    baseUrl,
    accessToken,
    path: PATHS.usageSummary,
    params: { from: today, to: today },
    fetchOptions: { cache: "no-store", signal },
    retry: false,
  });
  return { status: 200 };
}

export async function getUsageSummary({ baseUrl, accessToken, from, to }) {
  if (isMockEnabled()) {
    return getMockUsageSummary({ from, to, seed: accessToken });
  }
  return requestJson({
    baseUrl,
    accessToken,
    path: PATHS.usageSummary,
    params: { from, to },
  });
}

export async function getUsageDaily({ baseUrl, accessToken, from, to }) {
  if (isMockEnabled()) {
    return getMockUsageDaily({ from, to, seed: accessToken });
  }
  return requestJson({
    baseUrl,
    accessToken,
    path: PATHS.usageDaily,
    params: { from, to },
  });
}

export async function getUsageHourly({ baseUrl, accessToken, day }) {
  if (isMockEnabled()) {
    return getMockUsageHourly({ day, seed: accessToken });
  }
  return requestJson({
    baseUrl,
    accessToken,
    path: PATHS.usageHourly,
    params: day ? { day } : undefined,
  });
}

export async function getUsageMonthly({ baseUrl, accessToken, months, to }) {
  if (isMockEnabled()) {
    return getMockUsageMonthly({ months, to, seed: accessToken });
  }
  return requestJson({
    baseUrl,
    accessToken,
    path: PATHS.usageMonthly,
    params: {
      ...(months ? { months: String(months) } : {}),
      ...(to ? { to } : {}),
    },
  });
}

export async function getUsageHeatmap({
  baseUrl,
  accessToken,
  weeks,
  to,
  weekStartsOn,
}) {
  if (isMockEnabled()) {
    return getMockUsageHeatmap({
      weeks,
      to,
      weekStartsOn,
      seed: accessToken,
    });
  }
  return requestJson({
    baseUrl,
    accessToken,
    path: PATHS.usageHeatmap,
    params: {
      weeks: String(weeks),
      to,
      week_starts_on: weekStartsOn,
    },
  });
}

async function requestJson({
  baseUrl,
  accessToken,
  path,
  params,
  fetchOptions,
  errorPrefix,
  retry,
}) {
  const client = createInsforgeClient({ baseUrl, accessToken });
  const http = client.getHttpClient();
  const retryOptions = normalizeRetryOptions(retry, "GET");
  let attempt = 0;

  while (true) {
    try {
      return await http.get(path, { params, ...(fetchOptions || {}) });
    } catch (e) {
      if (e?.name === "AbortError") throw e;
      const err = normalizeSdkError(e, errorPrefix);
      if (!shouldRetry({ err, attempt, retryOptions })) throw err;
      const delayMs = computeRetryDelayMs({ retryOptions, attempt });
      await sleep(delayMs);
      attempt += 1;
    }
  }
}

function normalizeSdkError(error, errorPrefix) {
  const raw = error?.message || String(error || "Unknown error");
  const msg = normalizeBackendErrorMessage(raw);
  const err = new Error(errorPrefix ? `${errorPrefix}: ${msg}` : msg);
  err.cause = error;
  const status = error?.statusCode ?? error?.status;
  if (typeof status === "number") {
    err.status = status;
    err.statusCode = status;
  }
  err.retryable = isRetryableStatus(status) || isRetryableMessage(raw);
  if (msg !== raw) err.originalMessage = raw;
  if (error?.nextActions) err.nextActions = error.nextActions;
  if (error?.error) err.error = error.error;
  return err;
}

function normalizeBackendErrorMessage(message) {
  if (!isBackendRuntimeDownMessage(message)) return String(message || "Unknown error");
  return BACKEND_RUNTIME_UNAVAILABLE;
}

function isBackendRuntimeDownMessage(message) {
  const s = String(message || "").toLowerCase();
  if (!s) return false;
  if (s.includes("deno:") || s.includes("deno")) return true;
  if (s.includes("econnreset") || s.includes("econnrefused")) return true;
  if (s.includes("etimedout")) return true;
  if (s.includes("timeout") && s.includes("request")) return true;
  if (s.includes("upstream") && (s.includes("deno") || s.includes("connect")))
    return true;
  return false;
}

function isRetryableStatus(status) {
  return status === 502 || status === 503 || status === 504;
}

function isRetryableMessage(message) {
  const s = String(message || "").toLowerCase();
  if (!s) return false;
  if (isBackendRuntimeDownMessage(s)) return true;
  if (s.includes("econnreset") || s.includes("econnrefused")) return true;
  if (s.includes("etimedout") || s.includes("timeout")) return true;
  if (s.includes("networkerror") || s.includes("failed to fetch")) return true;
  if (s.includes("socket hang up") || s.includes("connection reset")) return true;
  return false;
}

function normalizeRetryOptions(retry, method) {
  const upperMethod = (method || "GET").toUpperCase();
  const defaultRetry =
    upperMethod === "GET"
      ? { maxRetries: 2, baseDelayMs: 300, maxDelayMs: 1500, jitterRatio: 0.2 }
      : { maxRetries: 0, baseDelayMs: 0, maxDelayMs: 0, jitterRatio: 0.0 };

  if (retry == null) return defaultRetry;
  if (retry === false) return { maxRetries: 0, baseDelayMs: 0, maxDelayMs: 0, jitterRatio: 0.0 };

  const maxRetries = clampInt(retry.maxRetries ?? defaultRetry.maxRetries, 0, 10);
  const baseDelayMs = clampInt(retry.baseDelayMs ?? defaultRetry.baseDelayMs, 50, 60_000);
  const maxDelayMs = clampInt(
    retry.maxDelayMs ?? defaultRetry.maxDelayMs,
    baseDelayMs,
    120_000
  );
  const jitterRatio =
    typeof retry.jitterRatio === "number"
      ? Math.max(0, Math.min(0.5, retry.jitterRatio))
      : defaultRetry.jitterRatio;
  return { maxRetries, baseDelayMs, maxDelayMs, jitterRatio };
}

function shouldRetry({ err, attempt, retryOptions }) {
  if (!retryOptions || retryOptions.maxRetries <= 0) return false;
  if (attempt >= retryOptions.maxRetries) return false;
  return Boolean(err && err.retryable);
}

function computeRetryDelayMs({ retryOptions, attempt }) {
  if (!retryOptions || retryOptions.maxRetries <= 0) return 0;
  const exp = retryOptions.baseDelayMs * Math.pow(2, attempt);
  const capped = Math.min(retryOptions.maxDelayMs, exp);
  const jitter = capped * retryOptions.jitterRatio * Math.random();
  return Math.round(capped + jitter);
}

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function sleep(ms) {
  if (!ms || ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}
