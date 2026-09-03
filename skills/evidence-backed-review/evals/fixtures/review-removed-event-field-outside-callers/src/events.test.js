import assert from "node:assert/strict";
import test from "node:test";

import { createOrderCreatedEvent } from "./events.js";

test("creates valid order.created event payload", () => {
  const order = {
    id: "ord_12345",
    customerId: "cust_abc",
    totalCents: 4500,
    items: [{ sku: "SKU-1", quantity: 2 }],
  };

  const event = createOrderCreatedEvent(order);

  assert.equal(event.eventType, "order.created");
  assert.equal(event.orderId, "ord_12345");
  assert.equal(event.customerId, "cust_abc");
  assert.equal(event.totalCents, 4500);
  assert.equal(event.items.length, 1);
});

test("throws error when order is invalid", () => {
  assert.throws(() => createOrderCreatedEvent(null), {
    message: "Invalid order payload",
  });
});
