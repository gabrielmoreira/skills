import assert from "node:assert/strict";
import test from "node:test";

import { calculateCartTotal } from "./discounts.js";

test("calculates cart total without discount", () => {
  const cart = {
    items: [
      { id: "item_a", priceCents: 2000, quantity: 1 },
      { id: "item_b", priceCents: 3000, quantity: 1 },
    ],
  };
  const result = calculateCartTotal(cart, null);
  assert.equal(result.subtotalCents, 5000);
  assert.equal(result.discountCents, 0);
  assert.equal(result.totalCents, 5000);
});

test("calculates cart total with standard 10% discount on single item", () => {
  const cart = {
    items: [{ id: "item_a", priceCents: 5000, quantity: 1 }],
  };
  const result = calculateCartTotal(cart, "SAVE10");
  assert.equal(result.subtotalCents, 5000);
  assert.equal(result.discountCents, 500);
  assert.equal(result.totalCents, 4500);
});
