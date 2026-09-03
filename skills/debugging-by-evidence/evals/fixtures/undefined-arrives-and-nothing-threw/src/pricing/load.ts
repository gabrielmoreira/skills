export type Rule = { sku: string; percentOff: number };
export type TenantDoc = { tenantId: string; pricingRules?: Rule[] };

const store = new Map<string, TenantDoc>();

export function put(doc: TenantDoc): void {
  store.set(doc.tenantId, doc);
}

/** Returns the tenant's rules, or an empty set where none are configured. */
export function loadRules(tenantId: string): Rule[] {
  const doc = store.get(tenantId);
  return doc?.pricingRules ?? [];
}
