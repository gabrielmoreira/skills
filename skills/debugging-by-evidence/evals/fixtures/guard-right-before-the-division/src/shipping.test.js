import assert from "node:assert/strict";
import test from "node:test";

import { calculateFreightRate } from "./shipping.js";

test("calculates freight rate for standard physical items", () => {
  const items = [
    { productId: "prod_mug", quantity: 2 }, // 700g
    { productId: "prod_tea", quantity: 2 }, // 300g -> total 1000g
  ];
  const rate = calculateFreightRate(items, 500); // 500 cents / 1000g = 0.5 cents/g
  assert.equal(rate.totalWeight, 1000);
  assert.equal(rate.surchargeCents, 500);
  assert.equal(rate.ratePerGram, 0.5);
});

test("returns zero surcharge when base fee is zero", () => {
  const items = [{ productId: "prod_mug", quantity: 1 }];
  const rate = calculateFreightRate(items, 0);
  assert.equal(rate.surchargeCents, 0);
  assert.equal(rate.ratePerGram, 0);
});
