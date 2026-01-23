export function isScreenshotModeEnabled(search = "") {
  if (typeof search !== "string" || search.length === 0) return false;
  const params = new URLSearchParams(search);
  const raw = String(params.get("screenshot") || "").toLowerCase();
  return raw === "1" || raw === "true";
}
