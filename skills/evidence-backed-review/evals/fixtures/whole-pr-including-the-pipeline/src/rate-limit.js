const hits = new Map();

export function allowExport(accountId, now = Date.now()) {
  const limit = Number(process.env.EXPORT_RATE_LIMIT ?? 5);
  const window = 60_000;
  const seen = (hits.get(accountId) ?? []).filter((t) => now - t < window);
  if (seen.length >= limit) return false;
  seen.push(now);
  hits.set(accountId, seen);
  return true;
}
