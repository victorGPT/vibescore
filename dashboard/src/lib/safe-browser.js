function getLocalStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage || null;
}

function getClipboard() {
  if (typeof navigator === "undefined") return null;
  return navigator.clipboard || null;
}

export function safeGetItem(key, { storage } = {}) {
  const target = storage ?? getLocalStorage();
  if (!target || typeof target.getItem !== "function") return null;
  try {
    return target.getItem(key);
  } catch (_e) {
    return null;
  }
}

export function safeSetItem(key, value, { storage } = {}) {
  const target = storage ?? getLocalStorage();
  if (!target || typeof target.setItem !== "function") return false;
  try {
    target.setItem(key, value);
    return true;
  } catch (_e) {
    return false;
  }
}

export function safeRemoveItem(key, { storage } = {}) {
  const target = storage ?? getLocalStorage();
  if (!target || typeof target.removeItem !== "function") return false;
  try {
    target.removeItem(key);
    return true;
  } catch (_e) {
    return false;
  }
}

export async function safeWriteClipboard(text, { clipboard } = {}) {
  const target = clipboard ?? getClipboard();
  if (!target || typeof target.writeText !== "function") return false;
  try {
    await target.writeText(text);
    return true;
  } catch (_e) {
    return false;
  }
}
