import { test } from "node:test";
import assert from "node:assert/strict";
import { billingPayload } from "./payload.js";

const invoice = { id: "i1", subtotalCents: 1000, totalCents: 1200 };

test("carries the invoice id", () => {
  assert.equal(billingPayload(invoice).invoiceId, "i1");
});

test("carries the total", () => {
  assert.equal(billingPayload(invoice).totalCents, 1200);
});
