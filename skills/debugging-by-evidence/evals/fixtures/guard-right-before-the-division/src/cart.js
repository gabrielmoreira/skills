import { lookupProduct } from "./catalog.js";

export function resolveCartItems(rawItems) {
  const resolved = [];
  for (const entry of rawItems) {
    const products = lookupProduct(entry.productId);
    for (const p of products) {
      resolved.push({
        productId: p.productId,
        quantity: p.quantity * entry.quantity,
        weightGrams: p.weightGrams,
        isPhysical: p.isPhysical,
      });
    }
  }
  return resolved;
}

export function calculateCartWeight(items) {
  let totalWeight = 0;
  for (const item of items) {
    if (item.isPhysical) {
      totalWeight += item.weightGrams * item.quantity;
    }
  }
  return totalWeight;
}
