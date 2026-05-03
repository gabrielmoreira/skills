---
title: Where to Validate
decision: Use this when deciding between env-first and config-first validation
tags: typescript, config, env, boundary, zod
---

## ✅ Prefer

Pick the validation boundary based on one question:

**Do raw env values already match what the app needs?**

If yes, parse env directly.
If no, build the real config object first and validate that.

### Use this when

- you are unsure whether env is the real contract
- one flag or mode may change which fields are needed
- you are deciding where validation should live

### Quick fork

| If... | Prefer |
| --- | --- |
| env already matches the app shape | parse env directly |
| a flag or mode changes which fields are needed | build config first, then validate |
| config points to external resources | parse the shape now, verify the resource later |

### Example: parse env directly

```ts
import { z } from 'zod';

const rawEnv = {
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
};

const databaseUrlSchema = z.preprocess(
  (value) => (value === undefined ? '' : value),
  z
    .string()
    .min(1, 'DATABASE_URL is required. Set DATABASE_URL.')
    .refine((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, 'DATABASE_URL must be a valid URL.'),
);

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: databaseUrlSchema,
}).strict();

export const env = envSchema.parse(rawEnv);
```

Use this branch when env values are already the values the app consumes.

### Example: build config first, then validate

```ts
import { z } from 'zod';

const notificationsConfigSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('disabled') }).strict(),
  z.object({
    mode: z.literal('sqs'),
    queueUrl: z.preprocess(
      (value) => (value === undefined ? '' : value),
      z.string().min(1, 'queueUrl is required. Set NOTIFICATIONS_QUEUE_URL.'),
    ),
  }).strict(),
]);

export function getNotificationsConfig(env: Record<string, unknown>) {
  const candidate = env.NOTIFICATIONS_ENABLED === 'true'
    ? { mode: 'sqs', queueUrl: env.NOTIFICATIONS_QUEUE_URL }
    : { mode: 'disabled' };

  return notificationsConfigSchema.parse(candidate);
}
```

Use this branch when the app must decide what matters before validation.

### Why this helps

- the boundary becomes a real design choice, not a habit
- env-first stays simple when it fits
- config-first keeps flags and modes out of raw env parsing

## ⚠️ Avoid

Do not keep adding business rules to a raw env schema after the shape has clearly drifted.

### This is a poor fit when

- every new mode adds another `.refine(...)`
- tests need different env shapes for different modes
- more than one module keeps editing the same env schema

### Example

```ts
import { z } from 'zod';

const envSchema = z.object({
  NOTIFICATIONS_ENABLED: z.enum(['true', 'false']),
  NOTIFICATIONS_QUEUE_URL: z.string().optional(),
}).strict().refine(
  (env) => env.NOTIFICATIONS_ENABLED !== 'true' || !!env.NOTIFICATIONS_QUEUE_URL,
  { message: 'Queue URL is required when notifications are enabled' },
);
```

### Why to avoid it

- raw env parsing is now replaying app behavior
- requiredness gets harder to understand
- the better boundary is usually the final config object

## Migration trigger

You probably outgrew env-first if:
- the first `.refine(...)` starts comparing fields
- one mode makes half the env irrelevant
- tests need mode-specific config shapes
- teams are editing the same env schema for unrelated reasons
