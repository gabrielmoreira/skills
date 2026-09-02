export function splitAmount(totalCents, ways) {
  if (ways < 1) throw new RangeError("ways must be at least 1");
  const base = Math.floor(totalCents / ways);
  const remainder = totalCents - base * ways;
  return Array.from({ length: ways }, (_, i) => base + (i < remainder ? 1 : 0));
}
