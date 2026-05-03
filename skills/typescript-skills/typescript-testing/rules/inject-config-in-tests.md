---
title: Inject Config in Tests
decision: Use this when tests are awkward because config is hidden in env or globals
tags: typescript, testing, config, injection
---

## ✅ Prefer

Pass config directly in tests whenever the module contract allows it.

### Use this when

- tests currently mutate `process.env`
- a module only needs a small config slice
- hidden config is making test setup noisy

### Example

```ts
const service = createNotificationsService({
  topicArn: 'arn:aws:sns:us-east-1:123456789012:orders',
});
```

### Why this helps

- test setup gets smaller
- the module contract becomes visible
- tests stop depending on global process state

## ⚠️ Avoid

Do not mutate global env unless you are specifically testing the outer config boundary.

### This is a poor fit when

- the test is really about behavior, not env reading
- env mutation leaks across tests
- the module under test should not know about env at all

### Example

```ts
process.env.NOTIFICATIONS_TOPIC_ARN = 'arn:aws:sns:...';
const service = createNotificationsServiceFromEnv();
```

### Why to avoid it

- the test is using a wider setup than the module actually needs
- hidden global state makes tests less trustworthy
- cleanup and isolation become harder
