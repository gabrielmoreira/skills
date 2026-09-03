import { getCachedPromo, setCachedPromo } from "./cache.js";

const DEFAULT_PROMOS = new Map([
  ["SAVE10", { code: "SAVE10", percent: 10, minItems: 1 }],
  ["SAVE20", { code: "SAVE20", percent: 20, minItems: 2 }],
]);

export function fetchPromo(code) {
  let promo = getCachedPromo(code);
  if (!promo) {
    promo = DEFAULT_PROMOS.get(code) ?? null;
    if (promo) {
      setCachedPromo(code, promo);
    }
  }
  return promo;
}

export function calculateCartTotal(cart, promoCode) {
  let subtotalCents = 0;
  for (const item of cart.items) {
    subtotalCents += item.priceCents * item.quantity;
  }

  if (!promoCode) {
    return { subtotalCents, discountCents: 0, totalCents: subtotalCents };
  }

  const promo = fetchPromo(promoCode);
  if (!promo) {
    return { subtotalCents, discountCents: 0, totalCents: subtotalCents };
  }

  const discountCents = Math.round((subtotalCents * promo.percent) / 100);

  let stackableRebateCents = 0;
  if (cart.items.length >= 3) {
    stackableRebateCents = Math.round((subtotalCents - discountCents) * 0.15);
  }

  const totalCents = Math.max(0, subtotalCents - discountCents - stackableRebateCents);

  return {
    subtotalCents,
    discountCents,
    stackableRebateCents,
    totalCents,
  };
}
