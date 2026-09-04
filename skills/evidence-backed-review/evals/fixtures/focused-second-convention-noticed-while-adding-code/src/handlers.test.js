import { test } from "node:test";
import assert from "node:assert/strict";
import { getOrder, getInvoice } from "./handlers.js";

const store = { orders: new Map([["o1", { id: "o1" }]]), invoices: new Map() };

test("getOrder returns a known order", () => {
  assert.equal(getOrder(store, "o1").id, "o1");
});

test("getOrder raises a coded error for an unknown id", () => {
  assert.throws(() => getOrder(store, "nope"), (e) => e.code === "ORDER_NOT_FOUND");
});

test("getInvoice raises a plain error for an unknown id", () => {
  assert.throws(() => getInvoice(store, "nope"), /not found/);
});
