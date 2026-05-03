---
title: Parse, Don’t Assert
decision: Use this when config code is drifting toward `!`, `as`, or hand-written type guards
tags: typescript, config, type-safety
---

## ✅ Prefer

Parse unknown input and infer the type from the schema.

### Use this when

- you are tempted to write `process.env.FOO!`
- a config object arrives as `unknown`
- you are about to write `as AppConfig`
- you are thinking about a hand-written type guard only to prove a config shape

### Example

```ts
import { z } from 'zod';

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

const appConfigSchema = z.object({
  databaseUrl: databaseUrlSchema,
  cacheMode: z.enum(['production', 'test']),
}).strict();

export type AppConfig = z.infer<typeof appConfigSchema>;

export function getAppConfig(raw: unknown): AppConfig {
  return appConfigSchema.parse(raw);
}
```

### Why this helps

- runtime validation and static typing stay aligned
- callers get a real config type, not a guessed one
- missing config is caught by parsing instead of hidden by assertions

## ⚠️ Avoid

Do not use `!`, `as`, or shallow type guards as a substitute for parsing config.

### This is a poor fit when

- the assertion only exists to silence a type error
- the type guard checks one field and pretends the whole object is valid
- the runtime shape could still break later

### Example

```ts
const databaseUrl = process.env.DATABASE_URL!;
const config = raw as AppConfig;

function isAppConfig(value: unknown): value is AppConfig {
  return !!(value as AppConfig).databaseUrl;
}
```

### Why to avoid it

- `!` hides missing config
- `as` tells TypeScript to trust you without proof
- simple type guards often check less than the real config shape

## Quick note

The other rules in this bundle show where parsing should happen so you do not need these assertions later.
