---
title: Earn Abstractions
decision: Use this when a new wrapper, layer, or interface is being proposed
tags: typescript, abstraction, clarity
---

## ✅ Prefer

Add an abstraction only when it protects a real pressure.

### Use this when

- there is a real mismatch to hide
- volatility is repeating in several callers
- the layer protects lifecycle, policy, or local meaning

### Example

```ts
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
```

```ts
type TenantStorageDependencies = {
  createS3Client: (tenantId: string) => S3Client;
};

export function makeTenantStorage(
  { createS3Client }: TenantStorageDependencies,
 ) {
  return {
    async put(tenantId: string, object: StoredObject) {
      return createS3Client(tenantId).put(object);
    },
  };
}

### Why this helps

- the abstraction protects a real mismatch
- callers stop repeating the same translation work
- the layer earns its cost

## ⚠️ Avoid

Do not add a layer just because symmetry feels nice.

### This is a poor fit when

- the wrapper mostly forwards calls
- removing the layer would not lose meaning
- the only reason is vague future flexibility

### Example

```ts
class UserService {
  constructor(private repo: UserRepo) {}
  findById(id: string) {
    return this.repo.findById(id);
  }
}
```

### Why to avoid it

- the layer adds indirection without protection
- readers pay the cost with no real gain
- future flexibility is still mostly imaginary
