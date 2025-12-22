export function getBrowserTimeZone() {
  if (typeof Intl === "undefined" || !Intl.DateTimeFormat) return null;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || null;
  } catch (_e) {
    return null;
  }
}

export function getBrowserTimeZoneOffsetMinutes(date = new Date()) {
  const dt = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(dt.getTime())) return 0;
  const offset = dt.getTimezoneOffset();
  if (!Number.isFinite(offset)) return 0;
  return -offset;
}

export function formatUtcOffset(offsetMinutes) {
  if (!Number.isFinite(offsetMinutes) || offsetMinutes === 0) return "UTC";
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `UTC${sign}${hh}:${mm}`;
}

export function formatTimeZoneLabel({ timeZone, offsetMinutes } = {}) {
  const offsetLabel = formatUtcOffset(offsetMinutes);
  if (timeZone && timeZone !== "UTC") return `${timeZone} (${offsetLabel})`;
  return offsetLabel;
}

export function formatTimeZoneShortLabel({ timeZone, offsetMinutes } = {}) {
  if (Number.isFinite(offsetMinutes)) return formatUtcOffset(offsetMinutes);
  if (timeZone) return timeZone;
  return "UTC";
}

export function getTimeZoneCacheKey({ timeZone, offsetMinutes } = {}) {
  if (timeZone) return `tz:${timeZone}`;
  if (Number.isFinite(offsetMinutes)) return `offset:${Math.trunc(offsetMinutes)}`;
  return "utc";
}
