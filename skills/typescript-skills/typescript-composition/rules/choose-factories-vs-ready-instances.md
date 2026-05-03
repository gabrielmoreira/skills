---
title: Choose Factories or Ready Instances on Purpose
decision: Use this when you are unsure whether to inject a factory or a built dependency
tags: typescript, composition, factories
---

## ✅ Prefer

Inject a ready instance by default. Inject a factory only when construction must still vary later.

### Use this when

- one dependency may be created with different runtime inputs
- you are deciding how much assembly to do up front
- a dependency is cheap and stable enough to build once

### Example

```ts
type CreateReportDependencies = {
  clock: Clock;
  createStorageClient: (tenantId: string) => StorageClient;
};

export function makeCreateReport(
  { clock, createStorageClient }: CreateReportDependencies,
 ) {
  return async function createReport(input: { tenantId: string }) {
    const storage = createStorageClient(input.tenantId);
    return storage.write({ createdAt: clock.now() });
  };
}

### Why this helps

- ready instances stay the default
- factories are used only when late variation is real
- the reason for the factory stays visible

## ⚠️ Avoid

Do not inject factories everywhere just in case they might be useful later.

### This is a poor fit when

- the factory only wraps one stable singleton
- the dependency never varies at call time
- the factory adds one more layer but no new decision

### Example

```ts
type SendReceiptDependencies = {
  createMailer: () => Mailer;
};

export function makeSendReceipt({ createMailer }: SendReceiptDependencies) {
  return async function sendReceipt(input: ReceiptInput) {
    return createMailer().send(input);
  };
}

### Why to avoid it

- the factory adds ceremony without protecting anything real
- the operation becomes harder to read locally
- a ready dependency would be simpler and more honest
