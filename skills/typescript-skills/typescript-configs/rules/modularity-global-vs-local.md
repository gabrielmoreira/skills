---
title: Start Local; Add Global Config Only When Needed
decision: Use this when each module should own its own settings
tags: typescript, config, modularity
---

## ✅ Prefer

Start with module-local config factories.
Add a global config layer only for the small set of values the whole service truly shares.

### Use this when

- different teams own different capabilities
- one module can change config without touching every other module
- different modules have different modes or resources

### Example

```ts
import { z } from 'zod';
import { getNotificationsConfig } from '../modules/notifications/config';
import { getUploadsConfig } from '../modules/uploads/config';

const appRootSchema = z.object({
  stage: z.enum(['local', 'dev', 'staging', 'prod']),
  awsRegion: z.string().min(1),
}).strict();

export function getAppConfig(env: Record<string, unknown>) {
  const { stage, awsRegion } = appRootSchema.parse({
    stage: env.APP_STAGE,
    awsRegion: env.AWS_REGION,
  });

  return {
    stage,
    awsRegion,
    notifications: getNotificationsConfig(env),
    uploads: getUploadsConfig(env),
  };
}
```

### Why this helps

- the global layer owns only shared runtime facts
- each module owns its own validation and defaults
- config changes stay close to the module they affect

## ⚠️ Avoid

Do not create one giant `AppConfig` just because the project has grown.

### This is a poor fit when

- every module change edits the same central type
- teams are forced through one config bottleneck
- modules start depending on unrelated settings because the bag already exists

### Example

```ts
export type AppConfig = {
  stage: 'local' | 'dev' | 'staging' | 'prod';
  awsRegion: string;
  billingTopicArn: string | null;
  notificationsQueueUrl: string | null;
  notificationsTopicArn: string | null;
  uploadsBucketUrl: string;
  uploadsKmsKeyArn: string | null;
  searchEndpoint: string | null;
};
```

### Why to avoid it

- every module change edits the same central type
- it is not clear who owns which setting
- modules start reaching into unrelated settings because the bag is already there

## Quick note

`getAppConfig` is the composition root for shared runtime facts. If two modules really share one domain boundary, merge their config instead of splitting it by habit.
