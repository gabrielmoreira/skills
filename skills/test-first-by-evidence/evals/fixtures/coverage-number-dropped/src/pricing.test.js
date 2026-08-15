import assert from "node:assert/strict";
import test from "node:test";

import { priceFor } from "./pricing.js";

test("applies the gold discount", () => {
  assert.equal(priceFor({ base: 100 }, { tier: "gold", region: "domestic" }), 80);
});
