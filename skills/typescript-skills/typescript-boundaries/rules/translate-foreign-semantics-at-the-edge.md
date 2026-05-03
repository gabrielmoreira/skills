---
title: Translate Foreign Semantics at the Edge
decision: Use this when external names or shapes are leaking into owned code
tags: typescript, boundaries, translation
---

## ✅ Prefer

Translate provider, transport, or framework shapes at the edge when their meaning does not match local meaning.

### Use this when

- provider names would confuse a reader without provider docs
- the same external shape leaks into several local modules
- your code starts sounding like copied API docs

### Example

```ts
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
```

### Why this helps

- local meaning becomes easier to read
- provider churn is contained at the edge
- inner code no longer needs vendor docs to make sense

## ⚠️ Avoid

Do not let external names quietly become local law.

### This is a poor fit when

- business logic uses provider enums directly
- transport DTO names appear deep in owned code
- every layer speaks in external vocabulary

### Example

```ts
function finalizePayment(status: StripeChargeStatus) {
  if (status === 'succeeded') {
    // ...
  }
}
```

### Why to avoid it

- local behavior now depends on vendor language
- replacing the provider becomes more expensive
- the code stops telling your app's story
