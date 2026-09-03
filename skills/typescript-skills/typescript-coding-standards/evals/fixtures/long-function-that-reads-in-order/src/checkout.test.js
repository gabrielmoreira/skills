import assert from "node:assert/strict";
import test from "node:test";

import { processCheckout } from "./checkout.js";

function mockDeps() {
  const savedOrders = [];
  return {
    savedOrders,
    customerStore: {
      async findById(id) {
        return { id, isSuspended: false, regionCode: "US-CA" };
      },
    },
    promoService: {
      async lookup(code) {
        if (code === "SAVE10") {
          return { active: true, minSubtotalCents: 1000, type: "fixed", discountCents: 1000 };
        }
        return null;
      },
    },
    taxService: {
      async rateFor(_region) {
        return 0.1; // 10%
      },
    },
    inventoryStore: {
      async checkStock(productId, _qty) {
        return productId !== "out_of_stock";
      },
      async allocate(productId, qty) {
        return { productId, qty, reserved: true };
      },
    },
    paymentGateway: {
      async charge(params) {
        if (params.token === "tok_fail") {
          return { success: false, errorCode: "insufficient_funds" };
        }
        return { success: true, transactionId: "txn_123" };
      },
    },
    idGenerator: {
      nextId(prefix) {
        return `${prefix}test_999`;
      },
    },
    orderStore: {
      async save(order) {
        savedOrders.push(order);
      },
    },
  };
}

test("completes checkout successfully with correct totals", async () => {
  const deps = mockDeps();
  const cart = {
    items: [
      { productId: "prod_1", quantity: 2, unitPriceCents: 2000 }, // 4000
      { productId: "prod_2", quantity: 1, unitPriceCents: 2500 }, // 2500 -> subtotal 6500
    ],
    promoCode: "SAVE10", // -1000 -> 5500
    shippingMethod: "standard", // >= 5000 -> 0
    currency: "USD",
  };
  const customer = { id: "cust_1" };
  const payment = { token: "tok_good" };

  const result = await processCheckout(cart, customer, payment, deps);

  assert.equal(result.ok, true);
  assert.equal(result.orderId, "ord_test_999");
  // Tax: 10% of (5500 + 0) = 550. Total: 5500 + 550 = 6050
  assert.equal(result.totalCents, 6050);
  assert.equal(deps.savedOrders.length, 1);
  assert.equal(deps.savedOrders[0].pricing.totalCents, 6050);
});

test("refuses checkout when an item is out of stock", async () => {
  const deps = mockDeps();
  const cart = {
    items: [{ productId: "out_of_stock", quantity: 1, unitPriceCents: 1000 }],
  };
  const result = await processCheckout(cart, { id: "cust_1" }, { token: "tok_good" }, deps);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "insufficient-stock");
  assert.equal(deps.savedOrders.length, 0);
});

test("refuses checkout when cart is empty", async () => {
  const deps = mockDeps();
  const result = await processCheckout({ items: [] }, { id: "cust_1" }, { token: "tok_good" }, deps);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "empty-cart");
});

test("handles payment gateway failure cleanly", async () => {
  const deps = mockDeps();
  const cart = {
    items: [{ productId: "prod_1", quantity: 1, unitPriceCents: 2000 }],
  };
  const result = await processCheckout(cart, { id: "cust_1" }, { token: "tok_fail" }, deps);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "payment-failed");
  assert.equal(result.gatewayCode, "insufficient_funds");
  assert.equal(deps.savedOrders.length, 0);
});
