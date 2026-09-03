import { SubscriptionBillingPaymentMethodRevokedOrExpiredFailureException } from "./errors.js";

export async function renewSubscription(subscriptionId, deps) {
  const sub = await deps.subscriptionStore.get(subscriptionId);
  if (!sub) {
    throw new Error(`subscription not found: ${subscriptionId}`);
  }

  const chargeResult = await deps.gateway.charge({
    customerId: sub.customerId,
    paymentMethodId: sub.paymentMethodId,
    amountCents: sub.planPriceCents,
  });

  if (!chargeResult.ok) {
    if (chargeResult.declineCode === "expired_card" || chargeResult.declineCode === "revoked_token") {
      throw new SubscriptionBillingPaymentMethodRevokedOrExpiredFailureException(
        subscriptionId,
        sub.paymentMethodId,
        chargeResult.declineCode,
        { cause: chargeResult.rawError },
      );
    }
    throw new Error(`billing failure: ${chargeResult.declineCode}`);
  }

  const renewedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await deps.subscriptionStore.update(subscriptionId, {
    status: "active",
    currentPeriodEnd: renewedUntil,
  });

  return { ok: true, subscriptionId, renewedUntil };
}
