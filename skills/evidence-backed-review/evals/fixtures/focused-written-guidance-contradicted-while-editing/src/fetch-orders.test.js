import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchOrders } from "./fetch-orders.js";

test("returns the first successful response", async () => {
  const client = { get: async () => ({ orders: [] }) };
  assert.deepEqual(await fetchOrders(client, "c1"), { orders: [] });
});

test("gives up after the attempt cap and rethrows", async () => {
  let calls = 0;
  const client = { get: async () => { calls++; throw new Error("upstream down"); } };
  await assert.rejects(() => fetchOrders(client, "c1"), /upstream down/);
  assert.equal(calls, 3);
});
