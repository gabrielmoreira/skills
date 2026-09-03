const store = new Map();

export function getCachedPromo(code) {
  return store.get(code) ?? null;
}

export function setCachedPromo(code, promo) {
  store.set(code, promo);
}

export function flushPromoCache() {
  store.clear();
}
