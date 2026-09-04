import { test } from "node:test";
import assert from "node:assert/strict";
import { buildQuote } from "./quote.js";

const cart = { id: "c1", totalCents: 2000, currency: "USD", items: [] };

test("builds a quote id from the cart", () => {
  const quote = buildQuote(cart, { costCents: 499 });
  assert.equal(quote.quoteId, "q_c1");
});

test("adds shipping to the cart total", () => {
  const quote = buildQuote(cart, { costCents: 499 });
  assert.equal(quote.totalCents, 2499);
});
