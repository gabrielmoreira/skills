---
title: Pass Ready Dependencies Inward
decision: Use this when behavior code keeps discovering or constructing what it needs
tags: typescript, composition, dependencies
---

## ✅ Prefer

Pass ready dependencies into behavior code.

### Use this when

- behavior code keeps calling factories directly
- runtime wiring is leaking across modules
- tests have to mock hidden imports or globals

### Example

```ts
type SendReceiptDependencies = {
  mailer: Mailer;
};

export function makeSendReceipt({ mailer }: SendReceiptDependencies) {
  return async function sendReceipt(input: ReceiptInput) {
    return mailer.send(input);
  };
}
```

### Why this helps

- the dependency is visible at the boundary
- behavior code is easier to test
- the operation no longer decides where the dependency came from

## ⚠️ Avoid

Do not hide dependency discovery inside behavior code.

### This is a poor fit when

- a use case imports a ready-made singleton
- the behavior decides which factory to call
- the only way to test is to patch module-level state

### Example

```ts
import { mailer } from './runtime-mailer';

export async function sendReceipt(input: ReceiptInput) {
  return mailer.send(input);
}
```

### Why to avoid it

- the dependency is hidden
- tests must work around ambient state
- extraction and reuse get harder later
