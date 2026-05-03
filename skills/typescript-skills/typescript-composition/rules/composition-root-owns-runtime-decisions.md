---
title: Let the Composition Root Own Runtime Decisions
decision: Use this when runtime choices are leaking into behavior code
tags: typescript, composition, runtime
---

## ✅ Prefer

Keep env reads, provider selection, and assembly in one visible composition root.

### Use this when

- behavior code is deciding which implementation to use
- multiple runtime choices depend on env or startup state
- it is getting hard to see where the app is assembled

### Example

```ts
export function bootstrap(env: Record<string, unknown>) {
  const config = getAppConfig(env);
  const mailer = config.useFakeMailer ? makeFakeMailer() : makeSesMailer();
  const sendReceipt = makeSendReceipt({ mailer });

  return { sendReceipt };
}
```

### Why this helps

- runtime choices are visible in one place
- behavior code can stay focused on behavior
- startup becomes easier to reason about

## ⚠️ Avoid

Do not let feature code decide where its dependencies come from.

### This is a poor fit when

- a use case reads env directly
- a handler builds deep dependency trees inline
- changing runtime policy means editing business logic files

### Example

```ts
export async function sendReceipt(input: ReceiptInput) {
  const mailer = process.env.USE_FAKE_MAILER === 'true'
    ? makeFakeMailer()
    : makeSesMailer();

  return mailer.send(input);
}
```

### Why to avoid it

- behavior now owns assembly work
- runtime policy is hidden inside the operation
- testing becomes more awkward than it needs to be
