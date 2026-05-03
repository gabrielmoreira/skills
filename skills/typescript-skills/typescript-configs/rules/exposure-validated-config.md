---
title: Pass Validated Config, Not process.env
decision: Use this when config should be passed in, not read from process.env
tags: typescript, config, exposure, boundaries
---

## ✅ Prefer

Pass small validated config objects into the code that needs them.

### Use this when

- a module needs a small, clear set of config values
- tests should run without mutating global env
- shared code should declare what config it depends on

### Example

```ts
// notifications-config.ts
import { z } from 'zod';

const notificationsConfigSchema = z.object({
  topicArn: z.preprocess(
    (value) => (value === undefined ? '' : value),
    z.string().min(1, 'topicArn is required. Set NOTIFICATIONS_TOPIC_ARN.'),
  ),
}).strict();

export type NotificationsConfig = z.infer<typeof notificationsConfigSchema>;

export function createNotificationsConfig(input: Record<string, unknown>): NotificationsConfig {
  return notificationsConfigSchema.parse({
    topicArn: input.NOTIFICATIONS_TOPIC_ARN,
  });
}

// notifications-service.ts
export function createNotificationsService(config: NotificationsConfig) {
  return {
    publish(message: string) {
      // use config.topicArn
    },
  };
}
```

### Why this helps

- the module input is visible
- callers know what must be configured
- tests can pass config directly instead of mutating process-wide state

## ⚠️ Avoid

Do not pass raw env through the app.

### This is a poor fit when

- feature modules read `process.env` directly
- tests must mutate global env just to exercise business code
- unrelated modules import a giant config bag for one field

### Example

```ts
export const env = process.env;

export function publishNotification(message: string) {
  const topicArn = env.NOTIFICATIONS_TOPIC_ARN;
  // ...
}
```

### Why to avoid it

- feature code now depends on a global mutable input bag
- the dependency is hidden from callers and tests
- no one can tell whether the value was validated before use

## Quick note

The config type is what the module says it needs. The env-to-config factory is the outer adapter that fills it.
