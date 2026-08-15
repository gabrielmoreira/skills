export function priceFor(item, customer) {
  let price = item.base;
  if (customer.tier === "gold") price *= 0.8;
  else if (customer.tier === "silver") price *= 0.9;
  if (item.clearance) price *= 0.5;
  if (customer.region === "eu") price *= 1.2;
  return Math.round(price * 100) / 100;
}

export function shippingFor(weightKg, region) {
  if (region === "domestic") return weightKg < 1 ? 4 : 4 + weightKg * 1.5;
  if (region === "eu") return 9 + weightKg * 2;
  return 14 + weightKg * 3;
}
