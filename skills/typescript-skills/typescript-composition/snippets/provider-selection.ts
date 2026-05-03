export function bootstrap(config: { paymentProvider: 'stripe' | 'mock' }) {
  const payments = config.paymentProvider === 'stripe'
    ? makeStripePayments(config)
    : makeMockPayments(config);

  return {
    chargeCustomer: makeChargeCustomer({ payments }),
  };
}
