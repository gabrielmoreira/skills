export async function runDunning(account, gateway, mailer, ledger, flags, clock, logger) {
  const now = clock.now();
  if (!flags.isEnabled("dunning", account.id)) return { skipped: true };
  const invoices = await ledger.overdueFor(account.id, now);
  if (invoices.length === 0) return { skipped: true };
  const charge = await gateway.charge(account.paymentMethodId, invoices[0].amount);
  if (!charge.ok) {
    await mailer.send({ to: account.email, template: "payment-failed" });
    logger.warn("dunning charge failed", { account: account.id });
    return { charged: false };
  }
  await ledger.settle(invoices[0].id, charge.reference, now);
  logger.info("dunning charge settled", { account: account.id });
  return { charged: true };
}
