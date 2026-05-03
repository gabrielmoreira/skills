---
title: Avoid Hidden Singletons in App Logic
decision: Use this when convenience imports are quietly becoming the app's wiring model
tags: typescript, composition, singletons
---

## ✅ Prefer

If a singleton exists, create it at the edge and make that choice obvious.

### Use this when

- the app has one shared client or pool
- the same ready-made instance is imported in many places
- a convenience import is starting to act like the real composition system

### Example

```ts
const appServices = {
  mailer: makeSesMailer(),
  audit: makeAuditClient(),
};

export const services = {
  sendReceipt: makeSendReceipt({ mailer: appServices.mailer }),
};
```

### Why this helps

- the singleton is visible and explicit
- the edge still owns construction
- later extraction is easier because the dependency is named

## ⚠️ Avoid

Do not hide app wiring behind imported ready-made instances.

### This is a poor fit when

- modules import a shared client and treat it like magic infrastructure
- behavior code cannot say what scope the dependency belongs to
- changing the singleton policy means sweeping imports across the app

### Example

```ts
import { mailer } from './mailer-singleton';

export async function sendReceipt(input: ReceiptInput) {
  return mailer.send(input);
}
```

### Why to avoid it

- the composition root disappears from view
- the app starts depending on ambient wiring
- a local shortcut becomes structural lock-in
