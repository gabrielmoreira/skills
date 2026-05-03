---
title: Avoid Brittle Structure Assertions
decision: Use this when tests are starting to protect file layout, helper names, or internal spelling
tags: typescript, testing, contracts
---

## ✅ Prefer

Assert observable behavior or meaningful boundaries.

### Use this when

- a test is failing on harmless renames
- you are tempted to grep source code in a test
- snapshots are freezing internal structure instead of outcomes

### Example

```ts
expect(result).toEqual({
  mode: 'disabled',
});
```

### Why this helps

- internal refactors stay cheaper
- the test protects the real contract
- signal stays focused on behavior that matters

## ⚠️ Avoid

Do not assert helper names, file paths, or private wiring details unless that text itself is the contract.

### This is a poor fit when

- the test would fail after a harmless rename
- the code could still be correct even though the assertion fails
- the assertion teaches more about layout than behavior

### Example

```ts
expect(source).toContain('parseQueueUrl');
```

### Why to avoid it

- the test protects spelling, not meaning
- refactors become expensive for the wrong reason
- confidence becomes distorted
