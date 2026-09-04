#!/usr/bin/env bash
set -e

git init -q
git config user.email "fixture@example.invalid"
git config user.name "Fixture"
git checkout -q -b main 2>/dev/null || true

# Base commit. The quote response still carries the optional field, and the
# shipping calculation does not exist yet.
cat << 'BASE' > src/quote.js
export function buildQuote(cart, shipping) {
  if (!cart || !cart.id) {
    throw new Error("Invalid cart");
  }

  return {
    quoteId: `q_${cart.id}`,
    totalCents: cart.totalCents + shipping.costCents,
    currency: cart.currency ?? "USD",
    estimatedDeliveryDays: cart.estimatedDeliveryDays ?? 5,
  };
}
BASE

cat << 'BASE' > src/index.js
export { buildQuote } from "./quote.js";
BASE

rm -f src/shipping.js
git add package.json docs/consumers.md src/quote.js src/quote.test.js src/notify.js src/index.js
git commit -qm "base: quote endpoint with estimated delivery"

# The state the prompt describes, left UNCOMMITTED on purpose. The user is mid
# implementation and says so, so the change belongs in the working tree rather
# than in a branch: this is not a pull request.
cat << 'WIP' > src/quote.js
export function buildQuote(cart, shipping) {
  if (!cart || !cart.id) {
    throw new Error("Invalid cart");
  }

  return {
    quoteId: `q_${cart.id}`,
    totalCents: cart.totalCents + shipping.costCents,
    currency: cart.currency ?? "USD",
  };
}
WIP

cat << 'WIP' > src/shipping.js
const DOMESTIC_BASE_CENTS = 499;

export function shippingFor(cart) {
  if (!cart || !Array.isArray(cart.items)) {
    throw new Error("Invalid cart");
  }

  const weightGrams = cart.items.reduce((total, item) => total + item.weightGrams * item.quantity, 0);

  // TODO: international rates and the weight bands above 5kg are not written yet.
  return { costCents: DOMESTIC_BASE_CENTS, weightGrams };
}
WIP

cat << 'WIP' > src/index.js
export { buildQuote } from "./quote.js";
export { shippingFor } from "./shipping.js";
WIP
