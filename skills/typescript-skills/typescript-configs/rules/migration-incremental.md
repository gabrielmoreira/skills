---
title: Migrate Config in Small Steps
decision: Use this when you are cleaning up a real codebase instead of starting fresh
tags: typescript, config, migration
---

## ✅ Prefer

Migrate config through small seams instead of one big rewrite.

### Use this when

- the codebase already has many `process.env` reads
- you cannot stop feature work for a full rewrite
- you want a safer path from legacy code to cleaner boundaries

### Example workflow

1. Find every raw read.
2. Snapshot current behavior with a characterization test.
3. Wrap the raw reads in one thin function without changing behavior.
4. Add parsing inside that wrapper.
5. Change the wrapper to accept `env` explicitly.
6. Migrate callers one module at a time.

```ts
// step 1: create a seam before changing behavior
export function readLegacyConfig(env: NodeJS.ProcessEnv) {
  return {
    port: env.PORT || '3000',
    databaseUrl: env.DATABASE_URL!,
  };
}
```

### Why this helps

- each step is easier to verify
- characterization tests protect current behavior while you move the boundary
- callers can migrate gradually instead of all at once

## ⚠️ Avoid

Do not jump straight from scattered env reads to a perfect final design without intermediate seams.

### This is a poor fit when

- the current behavior is not well understood
- `||` vs `??` changes have not been checked
- many callers would break at once if the migration is wrong

### Example

```ts
// avoid a one-shot rewrite without first capturing current behavior
export const config = appConfigSchema.parse({
  port: process.env.PORT,
  databaseUrl: process.env.DATABASE_URL,
  featureFlag: process.env.FEATURE_FLAG,
  retries: process.env.RETRIES,
  timeout: process.env.TIMEOUT,
});
```

### Why to avoid it

- you can break old assumptions without noticing
- it becomes hard to tell whether the bug is in parsing or in behavior changes
- the rollback path is poor

## Quick note

A partially migrated state is normal during the transition. Just keep the seam explicit and keep moving in one direction.
