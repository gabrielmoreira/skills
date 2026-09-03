import { resolveCartItems, calculateCartWeight } from "./cart.js";

export function calculateFreightRate(rawOrderItems, baseSurchargeCents) {
  const items = resolveCartItems(rawOrderItems);
  const totalWeight = calculateCartWeight(items);

  if (baseSurchargeCents <= 0) {
    return { surchargeCents: 0, ratePerGram: 0, totalWeight };
  }

  if (totalWeight === 0) {
    throw new Error("Division by zero in freight weight surcharge allocation: total weight is 0");
  }

  const ratePerGram = baseSurchargeCents / totalWeight;
  return {
    surchargeCents: baseSurchargeCents,
    ratePerGram,
    totalWeight,
  };
}
