import { loadRules } from "./load.ts";

export function priceFor(tenantId: string, sku: string, listCents: number): number {
  const rule = loadRules(tenantId).find((r) => r.sku === sku);
  if (!rule) return listCents;
  return Math.round(listCents * (1 - rule.percentOff / 100));
}
