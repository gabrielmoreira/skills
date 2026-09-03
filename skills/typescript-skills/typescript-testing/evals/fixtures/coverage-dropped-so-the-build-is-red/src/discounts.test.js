import assert from "node:assert/strict";
import test from "node:test";

import { calculateDiscount } from "./discounts.js";

test("returns 0 for zero or negative quantity", () => {
  assert.equal(calculateDiscount(1000, 0), 0);
  assert.equal(calculateDiscount(1000, -5), 0);
});

test("applies 10 percent discount for 10 or more items", () => {
  // 10 items * 1000 cents = 10000 cents * 10% = 1000
  const discount = calculateDiscount(1000, 10, "standard");
  assert.equal(discount, 1000);
});

test("adds vip bonus to volume discount", () => {
  // 10 items * 1000 cents = 10000 cents * (10% + 5%) = 1500
  const discount = calculateDiscount(1000, 10, "vip");
  assert.equal(discount, 1500);
});

test("caps maximum discount at 50000 cents for standard tier", () => {
  // 100 items * 5000 cents = 500000 * 20% = 100000 -> capped at 50000
  const discount = calculateDiscount(5000, 100, "standard");
  assert.equal(discount, 50000);
});
