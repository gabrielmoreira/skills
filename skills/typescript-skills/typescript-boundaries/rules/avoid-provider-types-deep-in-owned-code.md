---
title: Avoid Provider Types Deep in Owned Code
decision: Use this when SDK types are leaking past the edge
tags: typescript, boundaries, providers
---

## ✅ Prefer

Keep SDK and provider types near adapters and map them before business code.

### Use this when

- generated SDK types are spreading inward
- business code only needs part of the provider shape
- provider churn would hit many local files today

### Example

```ts
type PaymentIntentView = {
  id: string;
  amount: number;
  status: 'paid' | 'waiting' | 'rejected';
};

export function mapPaymentIntent(intent: Stripe.PaymentIntent): PaymentIntentView {
  let status: PaymentIntentView['status'];

  switch (intent.status) {
    case 'succeeded':
      status = 'paid';
      break;
    case 'pending':
      status = 'waiting';
      break;
    default:
      status = 'rejected';
      break;
  }

  return {
    id: intent.id,
    amount: intent.amount,
    status,
  };
}
```

### Why this helps

- local code depends on the shape it actually uses
- the provider model stays at the edge
- mapping cost is paid once instead of everywhere

## ⚠️ Avoid

Do not let SDK types become your app's internal language.

### This is a poor fit when

- domain code returns transport or SDK models directly
- provider enums appear deep in local behavior
- changing one provider type would touch many unrelated files

### Example

```ts
function settlePayment(intent: Stripe.PaymentIntent) {
  return intent.status === 'succeeded';
}
```

### Why to avoid it

- local logic now depends on external type churn
- readers must understand the SDK to understand your code
- your internal model never becomes explicit
