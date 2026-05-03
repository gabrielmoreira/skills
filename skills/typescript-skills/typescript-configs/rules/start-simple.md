---
title: Start Simple
decision: Use this when the app is small and the config is still flat
tags: typescript, config, simplicity
---

## ✅ Prefer

Start with a small typed object when the config shape is simple and stable.

### Use this when

- the app has only a few settings
- every setting is easy to read at a glance
- there are no modes or conditional branches yet
- the team would lose more clarity than it would gain from a schema

### Example

```ts
type LogLevel = 'info' | 'debug';

function parsePort(value: string | undefined) {
  const port = Number(value ?? '3000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  return port;
}

function parseLogLevel(value: string | undefined): LogLevel {
  if (value === undefined) return 'info';
  if (value === 'info' || value === 'debug') return value;
  throw new Error('LOG_LEVEL must be info or debug');
}

export const config = {
  port: parsePort(process.env.PORT),
  logLevel: parseLogLevel(process.env.LOG_LEVEL),
};
```

### Why this helps

- the whole config fits in one read
- there is almost no ceremony
- the next step up is still available later if pressure appears

## ⚠️ Avoid

Do not add schema machinery before the shape has earned it.

### This is a poor fit when

- the config has only a few fields
- the main benefit would just be feeling more formal
- no real bug or confusion is pushing you toward a stronger boundary

### Example

```ts
import { z } from 'zod';

const appConfigSchema = z.object({
  port: z.coerce.number().int().min(1).max(65535).default(3000),
  logLevel: z.enum(['info', 'debug']).default('info'),
}).strict();

export const config = appConfigSchema.parse({
  port: process.env.PORT,
  logLevel: process.env.LOG_LEVEL,
});
```

### Why to avoid it

- the schema may cost more than it protects
- a tiny config becomes harder to scan
- the abstraction is still unearned

## Quick note

Move up only when a real pressure appears:
- missing values caused a real bug
- config now has modes or conditional fields
- several modules depend on the same config boundary
