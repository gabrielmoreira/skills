---
title: Keep Defaults Rare and Safe
decision: Use this when defaults feel hidden, duplicated, or too test-oriented
tags: typescript, config, defaults
---

## ✅ Prefer

Prefer required config for important values.
If you keep a default, make it explicit, keep one owner, and make it safe for production.

### Use this when

- a value is low-risk enough to default
- you can choose a production-safe preset
- lower environments should opt into test behavior on purpose
- a default currently appears in more than one place

### Example

```ts
import { z } from 'zod';

const cacheModeSchema = z.enum(['production', 'test']).default('production');

const cacheConfigSchema = z.object({
  mode: cacheModeSchema,
  ttlSeconds: z.coerce.number().int().min(1),
}).strict();

export function getCacheConfig(env: Record<string, unknown>) {
  const mode = cacheModeSchema.parse(env.CACHE_MODE);

  const presetTtlByMode = {
    production: '60',
    test: '5',
  } as const;

  const ttlSeconds = env.CACHE_TTL_SECONDS ?? presetTtlByMode[mode];

  return cacheConfigSchema.parse({ mode, ttlSeconds });
}
```

### Why this helps

- the behavior is explicit through `CACHE_MODE`
- the default starts from the safer production preset
- lower environments can opt into test mode on purpose
- the default has one owner

## ⚠️ Avoid

Do not hide defaults behind unrelated checks or let test defaults leak into production.

### This is a poor fit when

- the default points to a database, API, bucket, or queue
- the same default exists in both code and schema
- `||` is being used when you really mean "missing"

### Example

```ts
import { z } from 'zod';

const configSchema = z.object({
  maxAttempts: z.coerce.number().int().min(1).max(10).default(3),
  ttlSeconds: z.coerce.number().int().min(1),
  databaseUrl: z.string().min(1),
}).strict();

export function getConfig(env: Record<string, unknown>) {
  const ttlSeconds = env.APP_STAGE === 'prod' ? 60 : 5;

  return configSchema.parse({
    maxAttempts: env.MAX_ATTEMPTS ?? 3,
    ttlSeconds,
    databaseUrl: env.DATABASE_URL || 'postgres://localhost:5432/test',
  });
}
```

### Why to avoid it

- `APP_STAGE` is not a clear policy API
- the retry default now has two owners
- a test default leaking into production is worse than a production-safe default showing up in test
- for critical values, failing fast is safer than guessing

## When to simplify back

If the service has no modes and no conditional defaults, a plain schema default may be enough.
