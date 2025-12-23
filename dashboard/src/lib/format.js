export function toDisplayNumber(value) {
  if (value == null) return "-";
  try {
    if (typeof value === "bigint") return new Intl.NumberFormat().format(value);
    if (typeof value === "number") return new Intl.NumberFormat().format(value);
    const s = String(value).trim();
    if (/^[0-9]+$/.test(s)) return new Intl.NumberFormat().format(BigInt(s));
    return s;
  } catch (_e) {
    return String(value);
  }
}

export function toFiniteNumber(value) {
  const n = Number(String(value));
  return Number.isFinite(n) ? n : null;
}

export function formatUsdCurrency(value, { decimals = 2 } = {}) {
  if (value == null) return "-";
  const raw = String(value).trim();
  if (!raw) return "-";
  const match = raw.match(/^(-?\d+)(?:\.(\d+))?$/);
  if (!match) return raw;
  const intPart = match[1];
  const fracPart = match[2] || "";
  let formattedInt = intPart;
  try {
    formattedInt = new Intl.NumberFormat().format(BigInt(intPart));
  } catch (_e) {
    formattedInt = intPart;
  }
  const normalizedDecimals = Math.max(0, Math.min(6, Math.floor(decimals)));
  const decimalPart = normalizedDecimals
    ? fracPart.slice(0, normalizedDecimals).padEnd(normalizedDecimals, "0")
    : "";
  const sign = intPart.startsWith("-") ? "-" : "";
  const valuePart = normalizedDecimals
    ? `${formattedInt.replace("-", "")}.${decimalPart}`
    : formattedInt.replace("-", "");
  return `${sign}$${valuePart}`;
}
