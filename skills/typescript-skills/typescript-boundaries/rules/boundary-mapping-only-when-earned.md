---
title: Add Boundary Mapping Only When It Earns Its Keep
decision: Use this when you are about to add another mapper, adapter, or wrapper layer
tags: typescript, boundaries, abstraction
---

## ✅ Prefer

Add a mapping layer only when it protects a real mismatch.

### Use this when

- external names and local names differ in important ways
- one provider shape would otherwise leak into many callers
- the mapping removes real reader pain or volatility

### Example

```ts
export function mapWebhookEvent(event: Stripe.Event): BillingEvent {
  return {
    eventId: event.id,
    kind: event.type,
  };
}
```

### Why this helps

- the mapping earns its place by protecting local meaning
- callers stop repeating translation work
- volatility is absorbed at one seam

## ⚠️ Avoid

Do not add a mapper just to make the diagram look cleaner.

### This is a poor fit when

- the mapper only renames one field once
- there is no real mismatch to protect
- deleting the mapper would not change local reasoning at all

### Example

```ts
export function mapUserId(input: { userId: string }) {
  return { userId: input.userId };
}
```

### Why to avoid it

- the layer adds ceremony without protecting anything real
- readers have one more file to open for no gain
- the abstraction has not been earned
