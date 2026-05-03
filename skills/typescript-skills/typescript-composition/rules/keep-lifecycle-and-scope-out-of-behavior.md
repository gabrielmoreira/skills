---
title: Keep Lifecycle and Scope Out of Behavior
decision: Use this when caching, memoization, request scope, or singleton policy is leaking into operations
tags: typescript, composition, lifecycle, scope
---

## ✅ Prefer

Own lifecycle and scope where the app is assembled, not inside behavior code.

### Use this when

- request scope matters
- the app uses singletons, pools, or memoized clients
- a dependency should be shared in one scope but not another

### Example

```ts
export function makeRequestServices(app: AppServices, requestId: string) {
  return {
    audit: makeAuditLogger({ requestId, base: app.audit }),
    sendReceipt: makeSendReceipt({ mailer: app.mailer }),
  };
}
```

### Why this helps

- scope policy is visible
- behavior code stays free of caching and lifecycle details
- request-local and app-wide state do not get mixed up

## ⚠️ Avoid

Do not hide memoization or singleton policy inside feature modules.

### This is a poor fit when

- a behavior module keeps its own cache
- a request handler creates its own hidden singleton
- the app cannot tell which dependencies are shared or scoped

### Example

```ts
let cachedMailer: Mailer | undefined;

function getMailer() {
  if (!cachedMailer) cachedMailer = makeSesMailer();
  return cachedMailer;
}

export async function sendReceipt(input: ReceiptInput) {
  return getMailer().send(input);
}
```

### Why to avoid it

- lifecycle policy is hidden in behavior code
- tests and runtime setup become less predictable
- scope is harder to change later
