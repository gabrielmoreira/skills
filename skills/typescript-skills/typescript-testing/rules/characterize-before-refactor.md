---
title: Characterize Before Refactor
decision: Use this when you need confidence about current behavior before changing structure
tags: typescript, testing, refactor
---

## ✅ Prefer

Write a characterization test before changing a shaky boundary.

### Use this when

- the current behavior is ugly but important
- you do not fully trust your mental model yet
- the code reads env, globals, or hidden imports today

### Example

```ts
it('keeps the current fallback behavior before the refactor', () => {
  const env = { ...process.env, PORT: '' };
  expect(readLegacyConfig(env).port).toBe('3000');
});
```

### Why this helps

- you know what you are preserving before you redesign it
- later failures tell you whether you changed behavior or only structure
- migration becomes safer and more reversible

## Common excuses

- "I already know what it does" → write the test anyway
- "The code is obviously bad" → the behavior may still matter
- "I'll write the tests after the cleanup" → then you already lost the easiest baseline

## ⚠️ Avoid

Do not refactor first and promise to write tests later.

### This is a poor fit when

- you are not sure what current behavior really is
- a boundary is already known to be brittle
- the rewrite could change semantics by accident

### Example

```ts
// avoid deleting the old path first and only then trying to remember how it behaved
export const config = newConfigSchema.parse(process.env);
```

### Why to avoid it

- you lose the easiest source of truth about current behavior
- later bugs are harder to localize
- rollback gets harder
