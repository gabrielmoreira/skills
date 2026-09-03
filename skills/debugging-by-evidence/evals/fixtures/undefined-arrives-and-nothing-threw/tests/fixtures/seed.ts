import { put } from "../../src/pricing/load.ts";

const standard = [
  { sku: "A-100", percentOff: 10 },
  { sku: "A-200", percentOff: 15 },
];

export function seedTenants(): void {
  put({ tenantId: "tenant-a", pricingRules: standard });
  put({ tenantId: "tenant-b", pricingRules: standard });
  // Onboarded later, through the import path rather than the console.
  put({ tenantId: "tenant-c", priceRules: standard } as never);
}
