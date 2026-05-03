---
title: Test Config Contracts
decision: Use this when config parsing is a real boundary with meaningful behavior
tags: typescript, testing, config
---

## ✅ Prefer

Test what the config boundary promises: parsed values, requiredness, defaults, and failure shape.

### Use this when

- config parsing is a module boundary
- defaults and conditional requirements matter
- a missing or malformed value should fail clearly

### Example

```ts
it('parses a valid notifications config', () => {
  expect(getNotificationsConfig({
    NOTIFICATIONS_ENABLED: 'true',
    NOTIFICATIONS_QUEUE_URL: 'queue-1',
  })).toEqual({
    mode: 'sqs',
    queueUrl: 'queue-1',
  });
});
```

### Why this helps

- the test protects the real contract
- refactors inside the parser stay free as long as the contract holds
- config failures stay visible and intentional

## Common excuses

- "The helper already has unit tests" → the caller still depends on the boundary contract
- "We only need to know parseQueueUrl ran" → callers care about the returned contract, not the helper name
- "The parser is small enough to eyeball" → small parsers still drift on defaults and failure shape

## ⚠️ Avoid

Do not test parser internals, helper names, or source layout instead of the contract.

### This is a poor fit when

- the assertion only proves a helper was called
- the test depends on file names or import paths
- the contract could break while the test still passes

### Example

```ts
expect(parserHelpers.parseQueueUrl).toHaveBeenCalled();
```

### Why to avoid it

- internal structure is not the real contract
- harmless refactors break the test
- real contract failures can slip through
