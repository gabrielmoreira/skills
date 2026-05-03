---
title: Keep Provider Selection at the Edge
decision: Use this when the app supports more than one provider or runtime mode
tags: typescript, composition, providers
---

## ✅ Prefer

Choose providers at the edge, then pass the chosen implementation inward.

### Use this when

- the app supports multiple providers
- a mode or env variable picks one implementation
- the same provider choice appears in more than one feature

### Example

```ts
export function bootstrap(env: Record<string, unknown>) {
  const config = getAppConfig(env);

  const payments = config.paymentProvider === 'stripe'
    ? makeStripePayments(config)
    : makeMockPayments(config);

  return {
    chargeCustomer: makeChargeCustomer({ payments }),
  };
}
```

### Why this helps

- provider choice is visible in one place
- features depend on the capability, not the selection logic
- swapping providers does not leak across the app

## ⚠️ Avoid

Do not repeat provider switching deep in feature code.

### This is a poor fit when

- several modules all switch on the same provider name
- provider-specific imports appear inside business logic
- each feature makes the same runtime choice again

### Example

```ts
export async function chargeCustomer(input: ChargeInput) {
  if (process.env.PAYMENT_PROVIDER === 'stripe') {
    return stripeCharge(input);
  }

  return mockCharge(input);
}
```

### Why to avoid it

- provider selection is duplicated
- the feature now depends on runtime policy
- the app gets harder to reorganize safely
