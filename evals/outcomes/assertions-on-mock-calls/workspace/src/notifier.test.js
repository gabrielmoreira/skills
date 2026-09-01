import assert from "node:assert/strict";
import test, { mock } from "node:test";

import { notifyLateShipment } from "./notifier.js";

const order = { email: "a@example.com", shippedAt: 0 };

test("calls send once", () => {
  const mailer = { send: mock.fn() };
  notifyLateShipment(order, mailer, { now: () => 5 * 86400000 });
  assert.equal(mailer.send.mock.callCount(), 1);
});

test("calls send with a subject", () => {
  const mailer = { send: mock.fn() };
  notifyLateShipment(order, mailer, { now: () => 5 * 86400000 });
  assert.equal(mailer.send.mock.calls[0].arguments[0].subject, "Your order is late");
});

test("calls now once", () => {
  const now = mock.fn(() => 5 * 86400000);
  notifyLateShipment(order, { send: mock.fn() }, { now });
  assert.equal(now.mock.callCount(), 1);
});
