export function calculateDiscount(itemPriceCents, quantity, customerTier = "standard") {
  if (itemPriceCents <= 0 || quantity <= 0) {
    return 0;
  }

  const grossTotal = itemPriceCents * quantity;
  let rate = 0;

  // Quantity volume tiers
  if (quantity >= 100) {
    rate = 0.20;
  } else if (quantity >= 50) {
    rate = 0.15;
  } else if (quantity >= 10) {
    rate = 0.10;
  }

  // Customer tier adjustment
  if (customerTier === "vip") {
    rate += 0.05;
  } else if (customerTier === "partner") {
    rate += 0.08;
  } else if (customerTier === "wholesale") {
    rate = Math.max(rate, 0.25);
  }

  const rawDiscount = Math.round(grossTotal * rate);

  // Maximum cap check
  if (customerTier !== "wholesale" && rawDiscount > 50000) {
    return 50000;
  }

  return rawDiscount;
}
