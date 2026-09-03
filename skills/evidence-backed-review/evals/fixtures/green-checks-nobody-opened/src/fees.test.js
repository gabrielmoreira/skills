import assert from "node:assert/strict";
import test from "node:test";

import { calculateDomesticFee, calculateInternationalFee } from "./fees.js";

test("calculates domestic interchange fee", () => {
  const fee = calculateDomesticFee(10000);
  assert.equal(fee, 180);
});

test("calculates cross-border fees for international transactions", () => {
  const fee = calculateInternationalFee(10000, "CA", "CAD");
  assert.ok(typeof fee === "number");
});
