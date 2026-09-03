export function totalCents(lines: { unitCents: number; qty: number }[]): number {
  return lines.reduce((a, l) => a + l.unitCents * l.qty, 0);
}
