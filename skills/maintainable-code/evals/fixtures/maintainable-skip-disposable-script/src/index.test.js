import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInvoice, calcTax } from "./index.js";

test("parses an invoice line", () => {
  assert.deepEqual(parseInvoice("i1,1200"), { id: "i1", cents: 1200 });
});

test("rounds tax to whole cents", () => {
  assert.equal(calcTax(1000, 0.075), 75);
});
