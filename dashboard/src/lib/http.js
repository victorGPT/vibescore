export async function fetchJson(url, { method, headers } = {}) {
  const res = await fetch(url, {
    method: method || "GET",
    headers: {
      ...(headers || {}),
    },
  });

  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (_e) {}

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

