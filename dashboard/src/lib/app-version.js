function normalizeString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function getAppVersion(env = {}) {
  const version = normalizeString(env.VITE_APP_VERSION || env.APP_VERSION);
  if (version) return version;
  const mode = normalizeString(env.MODE);
  return mode || "unknown";
}
