type BillingGatewayDependencies = {
  stripe: StripeClient;
};

export function makeBillingGateway({ stripe }: BillingGatewayDependencies) {
  return {
    async charge(input: ChargeRequest) {
      const intent = await stripe.createPaymentIntent(input);
      return mapStripeStatus(intent.status);
    },
  };
}
