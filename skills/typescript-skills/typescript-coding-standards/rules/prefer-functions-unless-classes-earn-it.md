---
title: Prefer Functions Unless Classes Earn It
decision: Use this when a class is being considered mainly as a grouping tool
tags: typescript, functions, classes
---

## ✅ Prefer

Default to functions and factories for behavior.

### Use this when

- the code is mostly stateless
- the class would only group methods
- dependencies can be passed directly into a function or factory

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

- behavior stays direct
- state and lifecycle are not implied where they do not exist
- the boundary stays small and honest

## ⚠️ Avoid

Do not use a class just to store dependencies and expose stateless methods.

### This is a poor fit when

- the constructor only copies dependencies to fields
- every method could be a plain function
- the class adds no real lifecycle, identity, or sequencing

### Example

```ts
class ReceiptService {
  constructor(private mailer: Mailer) {}
  send(input: ReceiptInput) {
    return this.mailer.send(input);
  }
}
```

### Why to avoid it

- the class boundary is not protecting anything real
- the object shape suggests more statefulness than exists
- a factory and function would be simpler
