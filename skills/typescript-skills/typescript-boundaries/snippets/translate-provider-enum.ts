type StripeChargeStatus = 'succeeded' | 'pending' | 'failed';
type PaymentResult = 'paid' | 'waiting' | 'rejected';

export function mapStripeStatus(status: StripeChargeStatus): PaymentResult {
  switch (status) {
    case 'succeeded':
      return 'paid';
    case 'pending':
      return 'waiting';
    case 'failed':
      return 'rejected';
  }
}
