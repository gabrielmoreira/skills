import assert from "node:assert/strict";
import test from "node:test";

import { validateOrder } from "./validator.js";

test("accepts a complete order", () => {
  const result = validateOrder({ id: "o-1", total: 12, lines: [{ sku: "a" }] });
  assert.equal(result.ok, true);
});
