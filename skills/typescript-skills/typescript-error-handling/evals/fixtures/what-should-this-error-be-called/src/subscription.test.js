import assert from "node:assert/strict";
import test from "node:test";

import { renewSubscription } from "./subscription.js";
import { SubscriptionBillingPaymentMethodRevokedOrExpiredFailureException } from "./errors.js";

function mockDeps(declineCode = null) {
  const updated = [];
  return {
    updated,
    subscriptionStore: {
      async get(id) {
        return {
          id,
          customerId: "cust_42",
          paymentMethodId: "pm_tok_visa",
          planPriceCents: 2900,
        };
      },
      async update(id, data) {
        updated.push({ id, ...data });
      },
    },
    gateway: {
      async charge() {
        if (declineCode) {
          return {
            ok: false,
            declineCode,
            rawError: new Error("gateway declined transaction"),
          };
        }
        return { ok: true, transactionId: "txn_renew_1" };
      },
    },
  };
}

test("renews active subscription on successful charge", async () => {
  const deps = mockDeps();
  const res = await renewSubscription("sub_100", deps);
  assert.equal(res.ok, true);
  assert.equal(deps.updated.length, 1);
  assert.equal(deps.updated[0].status, "active");
});

test("throws payment method failure error with complete metadata when card expired", async () => {
  const deps = mockDeps("expired_card");

  await assert.rejects(
    async () => {
      await renewSubscription("sub_100", deps);
    },
    (err) => {
      assert.ok(err instanceof SubscriptionBillingPaymentMethodRevokedOrExpiredFailureException);
      assert.equal(err.code, "PAYMENT_METHOD_UNUSABLE");
      assert.equal(err.retryable, false);
      assert.equal(err.httpStatus, 402);
      assert.equal(err.subscriptionId, "sub_100");
      assert.equal(err.paymentMethodId, "pm_tok_visa");
      assert.equal(err.declineReason, "expired_card");
      assert.ok(err.cause instanceof Error);
      return true;
    },
  );
  assert.equal(deps.updated.length, 0);
});

test("throws payment method failure error when token revoked", async () => {
  const deps = mockDeps("revoked_token");

  await assert.rejects(
    async () => {
      await renewSubscription("sub_100", deps);
    },
    (err) => {
      assert.equal(err.code, "PAYMENT_METHOD_UNUSABLE");
      assert.equal(err.retryable, false);
      assert.equal(err.declineReason, "revoked_token");
      return true;
    },
  );
});
