export function formatDateUTC(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

export function getDefaultRange() {
  const today = new Date();
  const to = formatDateUTC(today);
  const from = formatDateUTC(
    new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() - 29
      )
    )
  );
  return { from, to };
}

