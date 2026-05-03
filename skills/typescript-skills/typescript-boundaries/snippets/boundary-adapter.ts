type ChargeRequest = { amount: number };
type PaymentResult = 'paid' | 'waiting' | 'rejected';
type StripeStatus = 'succeeded' | 'pending' | 'failed';
type StripeClient = {
  createPaymentIntent(input: ChargeRequest): Promise<{ status: StripeStatus }>;
};

function mapStripeStatus(status: StripeStatus): PaymentResult {
  switch (status) {
    case 'succeeded':
      return 'paid';
    case 'pending':
      return 'waiting';
    case 'failed':
      return 'rejected';
  }
}

export function makeBillingAdapter(stripe: StripeClient) {
  return {
    async charge(input: ChargeRequest): Promise<PaymentResult> {
      const intent = await stripe.createPaymentIntent(input);
      return mapStripeStatus(intent.status);
    },
  };
}
