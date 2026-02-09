export function clampInt(value, { min, max, fallback }) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

export function buildPageItems(page, totalPages) {
  const safeTotal = clampInt(totalPages, { min: 0, max: 1_000_000, fallback: 0 });
  const safePage = clampInt(page, { min: 1, max: Math.max(1, safeTotal || 1), fallback: 1 });
  if (safeTotal <= 1) return [1];

  const candidates = new Set([
    1,
    safeTotal,
    safePage - 2,
    safePage - 1,
    safePage,
    safePage + 1,
    safePage + 2,
  ]);

  const sorted = Array.from(candidates)
    .filter((p) => Number.isInteger(p) && p >= 1 && p <= safeTotal)
    .sort((a, b) => a - b);

  const items = [];
  let prev = null;
  for (const p of sorted) {
    if (prev != null && p - prev > 1) items.push(null);
    items.push(p);
    prev = p;
  }
  return items;
}

export function getPaginationFlags({ page, totalPages }) {
  const totalKnown = typeof totalPages === "number" && Number.isFinite(totalPages) && totalPages >= 0;
  const safeTotal = totalKnown
    ? clampInt(totalPages, { min: 0, max: 1_000_000, fallback: 0 })
    : null;
  const safePage = clampInt(page, {
    min: 1,
    max: totalKnown ? Math.max(1, safeTotal || 1) : 1_000_000,
    fallback: 1,
  });

  const canPrev = safePage > 1;
  const canNext = totalKnown ? safePage < safeTotal : true;

  return { canPrev, canNext, safePage, safeTotal };
}

export function buildInjectedTopEntries({ topEntries, me, meLabel, limit }) {
  const safeLimit = clampInt(limit, { min: 1, max: 100, fallback: 10 });
  const rows = Array.isArray(topEntries) ? topEntries.slice(0, safeLimit) : [];
  const meRank = me && typeof me.rank === "number" ? me.rank : null;
  const hasMeInTop = rows.some((e) => Boolean(e?.is_me));

  if (!meRank || meRank <= safeLimit || hasMeInTop) return rows;

  const trimmed = rows.filter((e) => !e?.is_me).slice(0, Math.max(0, safeLimit - 1));
  return [
    ...trimmed,
    {
      rank: meRank,
      is_me: true,
      display_name: meLabel,
      avatar_url: null,
      gpt_tokens: me?.gpt_tokens ?? "0",
      claude_tokens: me?.claude_tokens ?? "0",
      total_tokens: me?.total_tokens ?? "0",
    },
  ];
}
