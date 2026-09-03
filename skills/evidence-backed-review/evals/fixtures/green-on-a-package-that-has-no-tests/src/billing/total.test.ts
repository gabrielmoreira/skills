import assert from "node:assert/strict";
import test from "node:test";

import { totalCents } from "./total.ts";

test("sums line totals", () => {
  assert.equal(totalCents([{ unitCents: 500, qty: 2 }, { unitCents: 250, qty: 1 }]), 1250);
});

test("an empty basket totals zero", () => {
  assert.equal(totalCents([]), 0);
});
